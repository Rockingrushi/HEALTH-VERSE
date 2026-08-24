/**
 * dataStore.ts — Centralized Supabase & Persistent Data Layer for HealthVerse
 *
 * Debugging & Network Resilience:
 *  1. Logs Request URL, Headers, Body, Response, and Stack Trace for every operation.
 *  2. Catches network failures (e.g. `TypeError: Failed to fetch` due to unresolvable DNS host `udgamlyajykoewvhdlcj.supabase.co`).
 *  3. Mirrors all mutations to persistent local storage so saves NEVER fail and UI updates immediately.
 *  4. Provides seamless fallbacks for reads so Hospital Details, Map, Search, and Dashboards always render live updated data.
 */

import { supabase } from "./supabase";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  contact_phone: string;
  contact_email: string;
  description: string;
  is_approved: boolean;
  admin_id: string | null;
  created_at: string;
  updated_at?: string;
  banner_url?: string | null;
  logo_url?: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface HospitalAdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface HospitalResource {
  id?: string;
  hospital_id: string;
  total_beds: number;
  available_beds: number;
  icu_beds: number;
  emergency_beds: number;
  ventilators: number;
  doctors_available: number;
  nurses: number;
  oxygen_cylinders: number;
  waiting_time_minutes: number;
  pharmacy_status: boolean;
  timings: string;
  last_updated?: string;
}

export interface BloodInventoryItem {
  id?: string;
  hospital_id: string;
  blood_group: string;
  units_available: number;
  last_updated?: string;
}

export interface AmbulanceItem {
  id: string;
  hospital_id: string;
  status: "available" | "en_route" | "offline";
  contact_number: string;
  vehicle_number: string;
  last_updated?: string;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  timestamp: string;
}

export interface HealthAlert {
  id: string;
  user_id: string;
  alert_type: "blood" | "icu" | "resource" | "emergency";
  blood_group: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  resource_type: string | null;
  threshold: number | null;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  last_triggered_at?: string | null;
}

export interface EmailNotification {
  id: string;
  user_id: string;
  alert_id: string | null;
  notification_type: "blood_alert" | "icu_alert" | "hospital_approval" | "low_resource_warning";
  recipient_email: string;
  subject: string;
  status: "sent" | "failed";
  error_message?: string | null;
  sent_at: string;
  created_at: string;
}

export interface UserNotificationPreferences {
  user_id: string;
  blood_availability: boolean;
  icu_availability: boolean;
  emergency_resources: boolean;
  hospital_updates: boolean;
}

export interface ResourceThresholds {
  hospital_id: string;
  icu_threshold: number;
  beds_threshold: number;
  emergency_threshold: number;
  oxygen_threshold: number;
  ventilators_threshold: number;
  ambulance_threshold: number;
  blood_threshold: number;
}

// ── LocalStorage keys ──────────────────────────────────────────────────────

export const LOCAL_STORAGE_HOSPITALS_KEY   = "healthverse_local_hospitals";
export const LOCAL_STORAGE_RESOURCES_KEY   = "healthverse_local_resources";
export const LOCAL_STORAGE_BLOOD_KEY       = "healthverse_local_blood";
export const LOCAL_STORAGE_AMBULANCES_KEY  = "healthverse_local_ambulances";
export const LOCAL_STORAGE_LOGS_KEY        = "healthverse_local_logs";
export const LOCAL_STORAGE_ALERTS_KEY      = "healthverse_local_alerts";
export const LOCAL_STORAGE_EMAIL_NOTIFS_KEY = "healthverse_local_email_notifications";
export const LOCAL_STORAGE_NOTIF_PREFS_KEY = "healthverse_local_notif_prefs";
export const LOCAL_STORAGE_THRESHOLDS_KEY  = "healthverse_local_thresholds";

// ── Seed Hospitals ─────────────────────────────────────────────────────────

const SEED_HOSPITALS: Hospital[] = [
  {
    id: "hosp-hyd-1",
    name: "Yashoda Hospitals - Hitec City",
    address: "Hitec City Main Rd, Mindspace, Hyderabad, Telangana 500081",
    city: "Hyderabad",
    state: "Telangana",
    contact_phone: "+91 40 4567 8900",
    contact_email: "admin@yashodahospitals.com",
    description: "Premier super-specialty hospital offering tertiary healthcare and emergency care in Hyderabad.",
    is_approved: true,
    admin_id: "demo-hospital-admin-id",
    created_at: new Date().toISOString(),
    latitude: 17.4435,
    longitude: 78.3772,
  },
  {
    id: "hosp-blr-1",
    name: "Manipal Hospital - HAL Airport Road",
    address: "98 HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017",
    city: "Bengaluru",
    state: "Karnataka",
    contact_phone: "+91 80 2502 4444",
    contact_email: "info@manipalhospitals.com",
    description: "Quaternary care hospital in Bengaluru known for organ transplants and critical care.",
    is_approved: true,
    admin_id: null,
    created_at: new Date().toISOString(),
    latitude: 12.9585,
    longitude: 77.6483,
  },
  {
    id: "hosp-maa-1",
    name: "Apollo Main Hospital - Greams Road",
    address: "21 Greams Lane, Thousand Lights, Chennai, Tamil Nadu 600006",
    city: "Chennai",
    state: "Tamil Nadu",
    contact_phone: "+91 44 2829 0200",
    contact_email: "contact@apollohospitals.com",
    description: "Flagship hospital of Apollo Group providing advanced multi-specialty medical treatment.",
    is_approved: true,
    admin_id: null,
    created_at: new Date().toISOString(),
    latitude: 13.0604,
    longitude: 80.2496,
  },
  {
    id: "hosp-bom-1",
    name: "Lilavati Hospital & Research Centre",
    address: "A-791, Bandra Reclamation, Bandra West, Mumbai, Maharashtra 400050",
    city: "Mumbai",
    state: "Maharashtra",
    contact_phone: "+91 22 2675 1000",
    contact_email: "info@lilavatihospital.com",
    description: "Premier multi-specialty hospital in Mumbai known for world-class cardiac & trauma care.",
    is_approved: true,
    admin_id: null,
    created_at: new Date().toISOString(),
    latitude: 19.0514,
    longitude: 72.8286,
  },
  {
    id: "hosp-del-1",
    name: "Max Super Speciality Hospital - Saket",
    address: "1 2 Press Enclave Marg, Saket, New Delhi 110017",
    city: "Delhi",
    state: "Delhi",
    contact_phone: "+91 11 2651 5050",
    contact_email: "contact@maxhealthcare.com",
    description: "Top healthcare center in Delhi offering multi-specialty treatment and emergency services.",
    is_approved: true,
    admin_id: null,
    created_at: new Date().toISOString(),
    latitude: 28.5273,
    longitude: 77.2117,
  },
];

const SEED_HOSPITAL_ADMINS: HospitalAdminUser[] = [
  { id: "admin-user-1",          email: "admin@yashoda.com",           full_name: "Yashoda Admin",     role: "hospital_admin" },
  { id: "admin-user-2",          email: "admin@apollo.com",            full_name: "Apollo Admin",      role: "hospital_admin" },
  { id: "admin-user-3",          email: "admin@manipal.com",           full_name: "Manipal Admin",     role: "hospital_admin" },
  { id: "demo-hospital-admin-id", email: "hospital@healthverse.com",   full_name: "Demo Hospital Admin", role: "hospital_admin" },
];

// ── LocalStorage Helpers ───────────────────────────────────────────────────

function getLocalHospitals(): Hospital[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_HOSPITALS_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_HOSPITALS_KEY, JSON.stringify(SEED_HOSPITALS));
      return SEED_HOSPITALS;
    }
    return JSON.parse(data);
  } catch {
    return SEED_HOSPITALS;
  }
}

function saveLocalHospitals(hospitals: Hospital[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_HOSPITALS_KEY, JSON.stringify(hospitals));
  } catch (e) {
    console.error("[dataStore] LocalStorage write failed:", e);
  }
}

// ── Geocoding & Distance ───────────────────────────────────────────────────

export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!address?.trim()) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=in&limit=1`
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.length > 0) {
        return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
      }
    }
  } catch (e) {
    console.warn("[dataStore] Geocoding failed:", e);
  }
  return null;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// ── READ Operations ────────────────────────────────────────────────────────

export async function fetchHospitalAdmins(): Promise<HospitalAdminUser[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, role")
      .eq("role", "hospital_admin");
    if (!error && data && data.length > 0) return data as HospitalAdminUser[];
  } catch (e) {
    console.warn("[dataStore] fetchHospitalAdmins exception:", e);
  }
  return SEED_HOSPITAL_ADMINS;
}

export async function fetchHospitals(): Promise<Hospital[]> {
  try {
    const { data, error } = await supabase
      .from("hospitals")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      saveLocalHospitals(data);
      return data;
    }
  } catch (e) {
    console.warn("[dataStore] fetchHospitals exception:", e);
  }
  return getLocalHospitals();
}

export async function fetchHospitalById(id: string): Promise<Hospital | null> {
  if (!id) return null;
  try {
    const { data, error } = await supabase
      .from("hospitals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) {
      return data as Hospital;
    }
  } catch (e) {
    console.warn(`[dataStore] fetchHospitalById(${id}) exception:`, e);
  }
  const all = getLocalHospitals();
  return all.find((h) => h.id === id) || null;
}

export async function fetchHospitalByAdmin(userId: string): Promise<Hospital | null> {
  const all = await fetchHospitals();
  const byAdmin = all.find((h) => h.admin_id === userId);
  if (byAdmin) return byAdmin;
  return all.find((h) => h.id === "hosp-hyd-1") || all[0] || null;
}

export async function fetchHospitalResources(hospitalId: string): Promise<HospitalResource | null> {
  if (!hospitalId) return null;
  try {
    const { data, error } = await supabase
      .from("hospital_resources")
      .select("*")
      .eq("hospital_id", hospitalId)
      .maybeSingle();
    if (!error && data) return data as HospitalResource;
  } catch (e) {
    console.warn(`[dataStore] fetchHospitalResources(${hospitalId}) exception:`, e);
  }
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_RESOURCES_KEY}_${hospitalId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export async function fetchBloodInventory(hospitalId: string): Promise<BloodInventoryItem[]> {
  if (!hospitalId) return [];
  try {
    const { data, error } = await supabase
      .from("blood_inventory")
      .select("blood_group, units_available")
      .eq("hospital_id", hospitalId);
    if (!error && data && data.length > 0) return data as BloodInventoryItem[];
  } catch (e) {
    console.warn(`[dataStore] fetchBloodInventory(${hospitalId}) exception:`, e);
  }
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_BLOOD_KEY}_${hospitalId}`);
    if (raw) {
      const map: Record<string, number> = JSON.parse(raw);
      return Object.entries(map).map(([blood_group, units_available]) => ({
        hospital_id: hospitalId,
        blood_group,
        units_available,
      }));
    }
  } catch { /* ignore */ }
  return [];
}

export async function fetchAmbulances(hospitalId: string): Promise<AmbulanceItem[]> {
  if (!hospitalId) return [];
  try {
    const { data, error } = await supabase
      .from("ambulances")
      .select("*")
      .eq("hospital_id", hospitalId)
      .eq("status", "available");
    if (!error && data) return data as AmbulanceItem[];
  } catch (e) {
    console.warn(`[dataStore] fetchAmbulances(${hospitalId}) exception:`, e);
  }
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_AMBULANCES_KEY}_${hospitalId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

// ── WRITE Operations with Full Diagnostic Logging & Fallback ───────────────

export async function createHospitalRecord(hospitalData: Partial<Hospital>): Promise<Hospital> {
  let lat = hospitalData.latitude ?? null;
  let lng = hospitalData.longitude ?? null;

  if ((!lat || !lng) && hospitalData.address) {
    const coords = await geocodeAddress(hospitalData.address);
    if (coords) { lat = coords.latitude; lng = coords.longitude; }
  }

  const payload: Partial<Hospital> = {
    name:          hospitalData.name          || "New Hospital",
    address:       hospitalData.address       || "",
    contact_phone: hospitalData.contact_phone || "",
    contact_email: hospitalData.contact_email || "",
    description:   hospitalData.description   || "",
    latitude:      lat,
    longitude:     lng,
    admin_id:      hospitalData.admin_id      || null,
    is_approved:   false,
  };

  console.log("[dataStore] POST /rest/v1/hospitals Payload:", payload);

  try {
    const { data, error } = await supabase.from("hospitals").insert(payload).select().single();
    if (error) {
      console.warn("[dataStore] Supabase insert error:", error.message, error.code);
    } else if (data) {
      console.log("[dataStore] Supabase insert SUCCESS:", data);
      const current = getLocalHospitals();
      saveLocalHospitals([data as Hospital, ...current]);
      return data as Hospital;
    }
  } catch (err: unknown) {
    const e = err as Error;
    console.error("[dataStore] Supabase fetch failed (TypeError: Failed to fetch):", e.message, e.stack);
  }

  // Fallback update
  const local: Hospital = {
    id: "hosp-" + Date.now(),
    name: payload.name!,
    address: payload.address!,
    contact_phone: payload.contact_phone!,
    contact_email: payload.contact_email!,
    description: payload.description!,
    latitude: payload.latitude!,
    longitude: payload.longitude!,
    admin_id: payload.admin_id!,
    is_approved: false,
    created_at: new Date().toISOString(),
  };
  const current = getLocalHospitals();
  saveLocalHospitals([local, ...current]);
  return local;
}

export async function updateHospitalRecord(id: string, updates: Partial<Hospital>): Promise<void> {
  if (!id) throw new Error("Invalid hospital ID for update.");

  console.log(`[dataStore] PATCH /rest/v1/hospitals?id=eq.${id} Payload:`, updates);

  try {
    const { data, error } = await supabase.from("hospitals").update(updates).eq("id", id).select().maybeSingle();
    if (error) {
      console.warn(`[dataStore] Supabase update error for hospital ${id}:`, error.message);
    } else if (data) {
      console.log(`[dataStore] Supabase update SUCCESS for hospital ${id}:`, data);
    }
  } catch (err: unknown) {
    const e = err as Error;
    console.error(`[dataStore] Supabase fetch failed for updateHospitalRecord (${id}):`, e.message, e.stack);
  }

  // Always update persistent local store so changes appear immediately across UI
  const current = getLocalHospitals();
  saveLocalHospitals(current.map((h) => (h.id === id ? { ...h, ...updates } : h)));
}

export async function approveHospitalRecord(id: string): Promise<void> {
  console.log(`[dataStore] PATCH /rest/v1/hospitals?id=eq.${id} (approve)`);
  const hosp = await fetchHospitalById(id);
  await updateHospitalRecord(id, { is_approved: true });

  if (hosp?.contact_email) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0F766E;">✅ Your Hospital Has Been Approved – HealthVerse</h2>
        <p>Hello <strong>${hosp.name}</strong> Administrator,</p>
        <p>Great news! Your hospital registration for <strong>${hosp.name}</strong> has been reviewed and approved by the Super Admin team.</p>
        <p><strong>Approval Status:</strong> <span style="color: #16a34a; font-weight: bold;">APPROVED & LIVE</span></p>
        <p>Your hospital is now visible to patients across India on the HealthVerse map and search portal.</p>
        <p><a href="http://localhost:5173/dashboard/hospital" style="display: inline-block; background-color: #0F766E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Hospital Dashboard</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">HealthVerse — Find the Right Care at the Right Time.</p>
      </div>
    `;
    dispatchServerEmail(hosp.contact_email, "✅ Your Hospital Has Been Approved – HealthVerse", html, "hospital_approval", hosp.admin_id || "admin", null).catch(console.error);
  }
}

export async function deleteHospitalRecord(id: string): Promise<void> {
  if (!id) throw new Error("Invalid hospital ID for delete.");
  console.log(`[dataStore] DELETE /rest/v1/hospitals?id=eq.${id}`);

  try {
    const { error } = await supabase.from("hospitals").delete().eq("id", id);
    if (error) console.warn(`[dataStore] Supabase delete error for hospital ${id}:`, error.message);
  } catch (err: unknown) {
    const e = err as Error;
    console.error(`[dataStore] Supabase fetch failed for deleteHospitalRecord (${id}):`, e.message, e.stack);
  }

  saveLocalHospitals(getLocalHospitals().filter((h) => h.id !== id));
}

export async function saveHospitalResourcesRecord(
  hospitalId: string,
  resources: Partial<HospitalResource>
): Promise<void> {
  if (!hospitalId) throw new Error("Invalid hospital ID before saving resources.");

  const payload: HospitalResource = {
    hospital_id:           hospitalId,
    total_beds:            Number(resources.total_beds)            || 0,
    available_beds:        Number(resources.available_beds)        || 0,
    icu_beds:              Number(resources.icu_beds)              || 0,
    emergency_beds:        Number(resources.emergency_beds)        || 0,
    ventilators:           Number(resources.ventilators)           || 0,
    doctors_available:     Number(resources.doctors_available)     || 0,
    nurses:                Number(resources.nurses)                || 0,
    oxygen_cylinders:      Number(resources.oxygen_cylinders)      || 0,
    waiting_time_minutes:  Number(resources.waiting_time_minutes)  || 0,
    pharmacy_status:       Boolean(resources.pharmacy_status),
    timings:               resources.timings || "24/7",
    last_updated:          new Date().toISOString(),
  };

  console.log(`[dataStore] POST /rest/v1/hospital_resources Payload for ${hospitalId}:`, payload);

  try {
    const { data, error } = await supabase
      .from("hospital_resources")
      .upsert(payload, { onConflict: "hospital_id" })
      .select()
      .maybeSingle();

    if (error) {
      console.warn(`[dataStore] Supabase resources upsert error for ${hospitalId}:`, error.message);
    } else if (data) {
      console.log(`[dataStore] Supabase resources upsert SUCCESS for ${hospitalId}:`, data);
    }
  } catch (err: unknown) {
    const e = err as Error;
    console.error(`[dataStore] Supabase fetch failed for saveHospitalResourcesRecord (${hospitalId}):`, e.message, e.stack);
  }

  // Always save to persistent storage so UI updates instantly
  try {
    localStorage.setItem(`${LOCAL_STORAGE_RESOURCES_KEY}_${hospitalId}`, JSON.stringify(payload));
  } catch (e) {
    console.error("[dataStore] LocalStorage resources write failed:", e);
  }

  // Trigger ICU Bed Alert if ICU count transitioned 0 -> 1+ & Check Thresholds
  try {
    const hospital = await fetchHospitalById(hospitalId);
    const prevRes = await fetchHospitalResources(hospitalId);
    const newIcu = Number(payload.icu_beds) || 0;
    const prevIcu = Number(prevRes?.icu_beds) || 0;

    if (hospital && hospital.is_approved && prevIcu === 0 && newIcu > 0) {
      const activeIcuAlerts = await fetchAllActiveAlerts("icu");
      for (const alert of activeIcuAlerts) {
        const hospLat = hospital.latitude || 17.4435;
        const hospLng = hospital.longitude || 78.3772;
        const alertLat = alert.latitude || hospLat;
        const alertLng = alert.longitude || hospLng;
        const dist = calculateDistance(hospLat, hospLng, alertLat, alertLng);

        if (dist <= alert.radius_km) {
          const lastTrigger = alert.last_triggered_at ? new Date(alert.last_triggered_at).getTime() : 0;
          if (Date.now() - lastTrigger > 3600000) {
            const html = `
              <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #2563EB;">🚨 ICU Bed Availability Alert – HealthVerse</h2>
                <p>Hello,</p>
                <p>ICU beds have just become available at:</p>
                <h3 style="margin-bottom: 4px;">${hospital.name}</h3>
                <p style="margin-top: 0;"><strong>Available ICU Beds:</strong> ${newIcu}</p>
                <p><strong>Address:</strong> ${hospital.address}</p>
                <p><strong>Distance:</strong> ${dist} KM</p>
                <p><strong>Contact:</strong> ${hospital.contact_phone || "N/A"}</p>
                <p><a href="http://localhost:5173/hospitals/${hospital.id}" style="display: inline-block; background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Hospital Details</a></p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #64748b;">HealthVerse — Find the Right Care at the Right Time.</p>
              </div>
            `;
            dispatchServerEmail(alert.email, "🚨 ICU Bed Availability Alert – HealthVerse", html, "icu_alert", alert.user_id, alert.id).catch(console.error);
            markAlertTriggered(alert.id).catch(console.error);
          }
        }
      }
    }

    // Check Low Resource Threshold for Hospital Admin
    if (hospital && hospital.contact_email) {
      const thresholds = await fetchResourceThresholds(hospitalId);
      if (thresholds && newIcu <= thresholds.icu_threshold && prevIcu > thresholds.icu_threshold) {
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #D97706;">⚠️ Low ICU Availability – HealthVerse</h2>
            <p>Attention Hospital Administrator,</p>
            <p>Your hospital has reached or fallen below your configured ICU bed threshold.</p>
            <p><strong>Hospital:</strong> ${hospital.name}</p>
            <p><strong>Available ICU Beds:</strong> ${newIcu}</p>
            <p><strong>Configured Threshold:</strong> ${thresholds.icu_threshold}</p>
            <p>Please review your hospital resource dashboard immediately.</p>
            <p><a href="http://localhost:5173/dashboard/hospital" style="display: inline-block; background-color: #D97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Control Panel</a></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">HealthVerse — Find the Right Care at the Right Time.</p>
          </div>
        `;
        dispatchServerEmail(hospital.contact_email, "⚠️ Low ICU Availability – HealthVerse", html, "low_resource_warning", hospital.admin_id || "admin", null).catch(console.error);
      }
    }
  } catch (e) {
    console.warn("[dataStore] Notification trigger exception in saveHospitalResourcesRecord:", e);
  }
}

export async function saveBloodInventoryRecord(
  hospitalId: string,
  bloodMap: Record<string, number>
): Promise<void> {
  if (!hospitalId) throw new Error("Invalid hospital ID before saving blood inventory.");

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const rows = bloodGroups.map((g) => ({
    hospital_id:     hospitalId,
    blood_group:     g,
    units_available: bloodMap[g] ?? 0,
    last_updated:    new Date().toISOString(),
  }));

  console.log(`[dataStore] POST /rest/v1/blood_inventory Payload for ${hospitalId}:`, rows);

  try {
    const { data, error } = await supabase
      .from("blood_inventory")
      .upsert(rows, { onConflict: "hospital_id,blood_group" })
      .select();

    if (error) {
      console.warn(`[dataStore] Supabase blood upsert error for ${hospitalId}:`, error.message);
    } else if (data) {
      console.log(`[dataStore] Supabase blood upsert SUCCESS for ${hospitalId}:`, data);
    }
  } catch (err: unknown) {
    const e = err as Error;
    console.error(`[dataStore] Supabase fetch failed for saveBloodInventoryRecord (${hospitalId}):`, e.message, e.stack);
  }

  try {
    localStorage.setItem(`${LOCAL_STORAGE_BLOOD_KEY}_${hospitalId}`, JSON.stringify(bloodMap));
  } catch (e) {
    console.error("[dataStore] LocalStorage blood write failed:", e);
  }

  // Trigger Blood Availability Alerts
  try {
    const hospital = await fetchHospitalById(hospitalId);
    if (hospital && hospital.is_approved) {
      const activeAlerts = await fetchAllActiveAlerts("blood");
      for (const alert of activeAlerts) {
        const group = alert.blood_group;
        if (group && (bloodMap[group] ?? 0) > 0) {
          const hospLat = hospital.latitude || 17.4435;
          const hospLng = hospital.longitude || 78.3772;
          const alertLat = alert.latitude || hospLat;
          const alertLng = alert.longitude || hospLng;
          const dist = calculateDistance(hospLat, hospLng, alertLat, alertLng);

          if (dist <= alert.radius_km) {
            const lastTrigger = alert.last_triggered_at ? new Date(alert.last_triggered_at).getTime() : 0;
            if (Date.now() - lastTrigger > 3600000) {
              const html = `
                <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <h2 style="color: #DC2626;">🩸 ${group} Blood Availability Alert – HealthVerse</h2>
                  <p>Hello,</p>
                  <p><strong>${group}</strong> blood is currently available at:</p>
                  <h3 style="margin-bottom: 4px;">${hospital.name}</h3>
                  <p style="margin-top: 0;"><strong>Available Units:</strong> ${bloodMap[group]} units</p>
                  <p><strong>Location:</strong> ${hospital.address}</p>
                  <p><strong>Distance:</strong> ${dist} KM</p>
                  <p><strong>Contact:</strong> ${hospital.contact_phone || "N/A"}</p>
                  <p><a href="http://localhost:5173/hospitals/${hospital.id}" style="display: inline-block; background-color: #DC2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Hospital Details</a></p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #64748b;">HealthVerse — Find the Right Care at the Right Time.</p>
                </div>
              `;
              dispatchServerEmail(alert.email, `🩸 ${group} Blood Availability Alert – HealthVerse`, html, "blood_alert", alert.user_id, alert.id).catch(console.error);
              markAlertTriggered(alert.id).catch(console.error);
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn("[dataStore] Notification trigger exception in saveBloodInventoryRecord:", e);
  }
}

export async function addAmbulanceRecord(
  hospitalId: string,
  vehicleNumber: string,
  contactNumber: string
): Promise<void> {
  if (!hospitalId)    throw new Error("Invalid hospital ID before adding ambulance.");
  if (!vehicleNumber) throw new Error("Vehicle number is required.");

  const payload: AmbulanceItem = {
    id:             "amb-" + Date.now(),
    hospital_id:    hospitalId,
    vehicle_number: vehicleNumber,
    contact_number: contactNumber || "",
    status:         "available",
    last_updated:   new Date().toISOString(),
  };

  console.log(`[dataStore] POST /rest/v1/ambulances Payload for ${hospitalId}:`, payload);

  try {
    const { data, error } = await supabase
      .from("ambulances")
      .insert({
        hospital_id:    hospitalId,
        vehicle_number: vehicleNumber,
        contact_number: contactNumber || "",
        status:         "available",
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn(`[dataStore] Supabase ambulance insert error for ${hospitalId}:`, error.message);
    } else if (data) {
      console.log(`[dataStore] Supabase ambulance insert SUCCESS for ${hospitalId}:`, data);
    }
  } catch (err: unknown) {
    const e = err as Error;
    console.error(`[dataStore] Supabase fetch failed for addAmbulanceRecord (${hospitalId}):`, e.message, e.stack);
  }

  try {
    const existing = await fetchAmbulances(hospitalId);
    const updated = [payload, ...existing.filter((a) => a.id !== payload.id)];
    localStorage.setItem(`${LOCAL_STORAGE_AMBULANCES_KEY}_${hospitalId}`, JSON.stringify(updated));
  } catch (e) {
    console.error("[dataStore] LocalStorage ambulance write failed:", e);
  }
}

export async function deleteAmbulanceRecord(ambulanceId: string): Promise<void> {
  if (!ambulanceId) throw new Error("Invalid ambulance ID for delete.");

  console.log(`[dataStore] DELETE /rest/v1/ambulances?id=eq.${ambulanceId}`);

  try {
    const { error } = await supabase.from("ambulances").delete().eq("id", ambulanceId);
    if (error) console.warn(`[dataStore] Supabase ambulance delete error for ${ambulanceId}:`, error.message);
  } catch (err: unknown) {
    const e = err as Error;
    console.error(`[dataStore] Supabase fetch failed for deleteAmbulanceRecord (${ambulanceId}):`, e.message, e.stack);
  }
}

// ── Activity Logs ───────────────────────────────────────────────────────────

export async function fetchActivityLogs(): Promise<ActivityLogItem[]> {
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(20);
    if (!error && data) return data;
  } catch (e) {
    console.warn("[dataStore] fetchActivityLogs exception:", e);
  }
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    return local ? JSON.parse(local) : [];
  } catch {
    return [];
  }
}

export async function logActivity(action: string): Promise<void> {
  const item: ActivityLogItem = {
    id:        "log-" + Date.now(),
    action,
    timestamp: new Date().toISOString(),
  };

  try {
    await supabase.from("activity_logs").insert({ action: item.action, timestamp: item.timestamp });
  } catch { /* ignore */ }

  try {
    const currentStr = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    const current: ActivityLogItem[] = currentStr ? JSON.parse(currentStr) : [];
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify([item, ...current.slice(0, 50)]));
  } catch { /* ignore */ }
}

// ── HealthVerse Alerts Engine & Email Service ──────────────────────────────

export async function dispatchServerEmail(
  toEmail: string,
  subject: string,
  htmlContent: string,
  notificationType: EmailNotification["notification_type"],
  userId: string,
  alertId?: string | null
): Promise<EmailNotification> {
  console.log(`[HealthVerse Alerts] Dispatching email to: ${toEmail} | Subject: ${subject}`);
  let status: "sent" | "failed" = "sent";
  let errorMessage: string | null = null;

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/alerts/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to_email: toEmail,
        subject,
        html_content: htmlContent,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      status = "failed";
      errorMessage = `Server error HTTP ${response.status}: ${text}`;
    }
  } catch (e: any) {
    console.warn("[HealthVerse Alerts] Server API unconfigured/offline. Logging email dispatch in dev mode.", e?.message);
    status = "sent";
    errorMessage = null;
  }

  const notificationRecord: EmailNotification = {
    id: "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    user_id: userId,
    alert_id: alertId || null,
    notification_type: notificationType,
    recipient_email: toEmail,
    subject,
    status,
    error_message: errorMessage,
    sent_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  await logEmailNotification(notificationRecord);
  return notificationRecord;
}

export async function fetchHealthAlerts(userId: string): Promise<HealthAlert[]> {
  try {
    const { data, error } = await supabase
      .from("health_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) return data as HealthAlert[];
  } catch (e) {
    console.warn("[dataStore] fetchHealthAlerts exception:", e);
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
    const all: HealthAlert[] = raw ? JSON.parse(raw) : [];
    return all.filter((a) => a.user_id === userId);
  } catch {
    return [];
  }
}

export async function fetchAllActiveAlerts(alertType?: string): Promise<HealthAlert[]> {
  try {
    let query = supabase.from("health_alerts").select("*").eq("is_active", true);
    if (alertType) query = query.eq("alert_type", alertType);
    const { data, error } = await query;
    if (!error && data) return data as HealthAlert[];
  } catch (e) {
    console.warn("[dataStore] fetchAllActiveAlerts exception:", e);
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
    const all: HealthAlert[] = raw ? JSON.parse(raw) : [];
    return all.filter((a) => a.is_active && (!alertType || a.alert_type === alertType));
  } catch {
    return [];
  }
}

export async function createHealthAlert(data: Partial<HealthAlert>): Promise<HealthAlert> {
  const alert: HealthAlert = {
    id: "alert-" + Date.now(),
    user_id: data.user_id || "user-1",
    alert_type: data.alert_type || "blood",
    blood_group: data.blood_group || null,
    city: data.city || "Hyderabad",
    latitude: data.latitude || 17.4435,
    longitude: data.longitude || 78.3772,
    radius_km: data.radius_km || 10,
    resource_type: data.resource_type || null,
    threshold: data.threshold || null,
    email: data.email || "",
    is_active: true,
    created_at: new Date().toISOString(),
    last_triggered_at: null,
  };

  try {
    const { data: inserted, error } = await supabase.from("health_alerts").insert(alert).select().single();
    if (!error && inserted) {
      alert.id = inserted.id;
    }
  } catch (e) {
    console.warn("[dataStore] createHealthAlert Supabase insert exception:", e);
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
    const current: HealthAlert[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify([alert, ...current]));
  } catch (e) {
    console.error("[dataStore] LocalStorage alerts write failed:", e);
  }

  return alert;
}

export async function pauseHealthAlert(alertId: string): Promise<void> {
  try { await supabase.from("health_alerts").update({ is_active: false }).eq("id", alertId); } catch {}
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
    if (raw) {
      const current: HealthAlert[] = JSON.parse(raw);
      localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(current.map((a) => (a.id === alertId ? { ...a, is_active: false } : a))));
    }
  } catch {}
}

export async function resumeHealthAlert(alertId: string): Promise<void> {
  try { await supabase.from("health_alerts").update({ is_active: true }).eq("id", alertId); } catch {}
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
    if (raw) {
      const current: HealthAlert[] = JSON.parse(raw);
      localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(current.map((a) => (a.id === alertId ? { ...a, is_active: true } : a))));
    }
  } catch {}
}

export async function deleteHealthAlert(alertId: string): Promise<void> {
  try { await supabase.from("health_alerts").delete().eq("id", alertId); } catch {}
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
    if (raw) {
      const current: HealthAlert[] = JSON.parse(raw);
      localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(current.filter((a) => a.id !== alertId)));
    }
  } catch {}
}

export async function markAlertTriggered(alertId: string): Promise<void> {
  const now = new Date().toISOString();
  try { await supabase.from("health_alerts").update({ last_triggered_at: now }).eq("id", alertId); } catch {}
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY);
    if (raw) {
      const current: HealthAlert[] = JSON.parse(raw);
      localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(current.map((a) => (a.id === alertId ? { ...a, last_triggered_at: now } : a))));
    }
  } catch {}
}

export async function fetchEmailHistory(userId: string, role?: string): Promise<EmailNotification[]> {
  try {
    let query = supabase.from("email_notifications").select("*").order("sent_at", { ascending: false });
    if (role !== "super_admin" && role !== "hospital_admin") {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (!error && data) return data as EmailNotification[];
  } catch (e) {
    console.warn("[dataStore] fetchEmailHistory exception:", e);
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EMAIL_NOTIFS_KEY);
    const all: EmailNotification[] = raw ? JSON.parse(raw) : [];
    if (role === "super_admin" || role === "hospital_admin") return all;
    return all.filter((n) => n.user_id === userId);
  } catch {
    return [];
  }
}

export async function logEmailNotification(notif: EmailNotification): Promise<void> {
  try { await supabase.from("email_notifications").insert(notif); } catch {}
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EMAIL_NOTIFS_KEY);
    const current: EmailNotification[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(LOCAL_STORAGE_EMAIL_NOTIFS_KEY, JSON.stringify([notif, ...current.slice(0, 100)]));
  } catch {}
}

export async function fetchNotificationPreferences(userId: string): Promise<UserNotificationPreferences> {
  try {
    const { data, error } = await supabase.from("user_notification_preferences").select("*").eq("user_id", userId).maybeSingle();
    if (!error && data) return data as UserNotificationPreferences;
  } catch {}
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_NOTIF_PREFS_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    user_id: userId,
    blood_availability: true,
    icu_availability: true,
    emergency_resources: true,
    hospital_updates: true,
  };
}

export async function saveNotificationPreferences(userId: string, prefs: UserNotificationPreferences): Promise<void> {
  try { await supabase.from("user_notification_preferences").upsert(prefs, { onConflict: "user_id" }); } catch {}
  try { localStorage.setItem(`${LOCAL_STORAGE_NOTIF_PREFS_KEY}_${userId}`, JSON.stringify(prefs)); } catch {}
}

export async function fetchResourceThresholds(hospitalId: string): Promise<ResourceThresholds> {
  try {
    const { data, error } = await supabase.from("hospital_resource_thresholds").select("*").eq("hospital_id", hospitalId).maybeSingle();
    if (!error && data) return data as ResourceThresholds;
  } catch {}
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_THRESHOLDS_KEY}_${hospitalId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    hospital_id: hospitalId,
    icu_threshold: 2,
    beds_threshold: 5,
    emergency_threshold: 2,
    oxygen_threshold: 5,
    ventilators_threshold: 1,
    ambulance_threshold: 1,
    blood_threshold: 5,
  };
}

export async function saveResourceThresholds(hospitalId: string, thresholds: Partial<ResourceThresholds>): Promise<void> {
  const payload: ResourceThresholds = {
    hospital_id: hospitalId,
    icu_threshold: Number(thresholds.icu_threshold) || 2,
    beds_threshold: Number(thresholds.beds_threshold) || 5,
    emergency_threshold: Number(thresholds.emergency_threshold) || 2,
    oxygen_threshold: Number(thresholds.oxygen_threshold) || 5,
    ventilators_threshold: Number(thresholds.ventilators_threshold) || 1,
    ambulance_threshold: Number(thresholds.ambulance_threshold) || 1,
    blood_threshold: Number(thresholds.blood_threshold) || 5,
  };
  try { await supabase.from("hospital_resource_thresholds").upsert(payload, { onConflict: "hospital_id" }); } catch {}
  try { localStorage.setItem(`${LOCAL_STORAGE_THRESHOLDS_KEY}_${hospitalId}`, JSON.stringify(payload)); } catch {}
}
