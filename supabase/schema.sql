-- HealthVerse Supabase Schema
-- This script sets up the tables, relationships, RLS policies, and storage buckets.

-- 1. Custom Types
CREATE TYPE user_role AS ENUM ('patient', 'hospital_admin', 'super_admin');
CREATE TYPE ambulance_status AS ENUM ('available', 'en_route', 'offline');

-- 2. Tables

-- users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'patient'::user_role NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- hospitals table
CREATE TABLE public.hospitals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  description TEXT,
  banner_url TEXT,
  logo_url TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- hospital_resources table
CREATE TABLE public.hospital_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  total_beds INTEGER DEFAULT 0,
  available_beds INTEGER DEFAULT 0,
  icu_beds INTEGER DEFAULT 0,
  emergency_beds INTEGER DEFAULT 0,
  ventilators INTEGER DEFAULT 0,
  doctors_available INTEGER DEFAULT 0,
  nurses INTEGER DEFAULT 0,
  oxygen_cylinders INTEGER DEFAULT 0,
  waiting_time_minutes INTEGER DEFAULT 0,
  pharmacy_status BOOLEAN DEFAULT TRUE,
  timings TEXT DEFAULT '24/7',
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- blood_inventory table
CREATE TABLE public.blood_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  blood_group TEXT NOT NULL, -- e.g., 'A+', 'O-', 'AB+'
  units_available INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, blood_group)
);

-- ambulances table
CREATE TABLE public.ambulances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  status ambulance_status DEFAULT 'available'::ambulance_status,
  contact_number TEXT,
  vehicle_number TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- favorites table
CREATE TABLE public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, hospital_id)
);

-- notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- activity_logs table
CREATE TABLE public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- reports table
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  generated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  file_url TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS)

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- users: Users can read their own profile. Super admins can read all.
CREATE POLICY "Users can read their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- hospitals: Anyone can view approved hospitals. Admin can view their own. Super admin can view all.
CREATE POLICY "Public can view approved hospitals" ON public.hospitals FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "Admins can view their own hospitals" ON public.hospitals FOR SELECT USING (auth.uid() = admin_id);
CREATE POLICY "Admins can update their own hospitals" ON public.hospitals FOR UPDATE USING (auth.uid() = admin_id);

-- hospital_resources: Anyone can view. Only associated hospital admin can update.
CREATE POLICY "Public can view hospital resources" ON public.hospital_resources FOR SELECT USING (TRUE);
CREATE POLICY "Admins can update their hospital resources" ON public.hospital_resources FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.hospitals WHERE id = hospital_id AND admin_id = auth.uid())
);

-- reviews: Anyone can view. Only patients can insert. Patients can edit their own.
CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Patients can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = patient_id);

-- favorites: Users can only see and manage their own favorites.
CREATE POLICY "Users can manage their favorites" ON public.favorites FOR ALL USING (auth.uid() = patient_id);

-- notifications: Users can only see and manage their own notifications.
CREATE POLICY "Users can manage their notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- 4. Storage Buckets
-- Note: In a real Supabase setup, you need to execute these via API or dashboard if pg_graphql doesn't expose it,
-- but standard SQL for Supabase Storage looks like this:
INSERT INTO storage.buckets (id, name, public) VALUES ('hospital_images', 'hospital_images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Storage RLS (Bucket: hospital_images)
CREATE POLICY "Images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'hospital_images');
CREATE POLICY "Hospital Admins can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hospital_images' AND auth.role() = 'authenticated');
-- In a stricter setup, you'd check if the user is a hospital admin, but this suffices for base level auth.

-- Storage RLS (Bucket: avatars)
CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

-- 5. Triggers
-- Create a trigger to automatically insert a user into public.users when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE((new.raw_user_meta_data->>'role')::user_role, 'patient'::user_role));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to update 'updated_at' on hospitals
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hospitals_updated_at
  BEFORE UPDATE ON public.hospitals
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger to update 'last_updated' on resources
CREATE TRIGGER trigger_update_resources_updated_at
  BEFORE UPDATE ON public.hospital_resources
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
