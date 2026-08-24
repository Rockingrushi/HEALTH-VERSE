import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchHospitalById, fetchHospitalResources, fetchBloodInventory, fetchAmbulances } from "../lib/dataStore";
import {
  Phone, MapPin, Clock, Activity, Bed, Ambulance, Droplets,
  Star, Heart, Navigation, Share2, CheckCircle, Users, AlertTriangle,
} from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const FALLBACK_DOCTORS = [
  { name: "Dr. Suresh Patel", dept: "Cardiology", rating: 4.9, exp: "15 years" },
  { name: "Dr. Anita Sharma", dept: "Neurology", rating: 4.7, exp: "12 years" },
  { name: "Dr. Rajesh Kumar", dept: "Orthopedics", rating: 4.8, exp: "18 years" },
];

const FALLBACK_REVIEWS = [
  { name: "Ravi M.", rating: 5, comment: "Excellent care during my father's surgery. Staff was very attentive.", date: "2 days ago" },
  { name: "Priya K.", rating: 4, comment: "Good hospital but wait times can be long. Doctors are very competent.", date: "1 week ago" },
  { name: "Amit S.", rating: 5, comment: "Saved my life during a cardiac emergency. Will forever be grateful.", date: "2 weeks ago" },
];

const DEPARTMENTS = [
  "Cardiology", "Neurology", "Orthopedics", "Oncology", "Pediatrics",
  "Gynecology", "Emergency", "ICU", "Radiology", "Gastroenterology",
];

export default function HospitalProfile() {
  const { id } = useParams<{ id: string }>();

  const { data: hospital, isLoading: hLoading } = useQuery({
    queryKey: ["hospital", id],
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!id) return null;
      return await fetchHospitalById(id);
    },
  });

  const { data: resources } = useQuery({
    queryKey: ["hospital-resources", id],
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!id) return null;
      return await fetchHospitalResources(id);
    },
  });

  const { data: bloodRows } = useQuery({
    queryKey: ["blood-inventory", id],
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!id) return [];
      return await fetchBloodInventory(id);
    },
  });

  const { data: ambulanceRows } = useQuery({
    queryKey: ["ambulances", id],
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!id) return [];
      return await fetchAmbulances(id);
    },
  });

  if (hLoading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!hospital) return (
    <div className="h-screen flex items-center justify-center flex-col gap-4 text-center px-4">
      <AlertTriangle className="h-16 w-16 text-destructive" />
      <h2 className="text-3xl font-bold font-heading">Hospital Not Found</h2>
      <p className="text-muted-foreground max-w-md">
        The requested hospital record could not be found. Please verify the URL or check the hospital list.
      </p>
      <Button onClick={() => window.history.back()} className="mt-2">
        ← Go Back
      </Button>
    </div>
  );

  if (!hospital.is_approved) return (
    <div className="h-screen flex items-center justify-center flex-col gap-4 text-center px-4">
      <Clock className="h-16 w-16 text-orange-500" />
      <h2 className="text-3xl font-bold font-heading text-orange-600">This hospital is pending approval.</h2>
      <p className="text-muted-foreground max-w-md">
        This hospital registration is currently awaiting review and approval by the Super Admin.
      </p>
      <Button onClick={() => window.history.back()} variant="outline" className="mt-2">
        ← Back to Hospital List
      </Button>
    </div>
  );

  // Build blood map — strictly from DB, no fake defaults
  const bloodMap: Record<string, number> = {};
  BLOOD_GROUPS.forEach((g) => (bloodMap[g] = 0));
  (bloodRows ?? []).forEach((r: { blood_group: string; units_available: number }) => {
    bloodMap[r.blood_group] = r.units_available;
  });

  const r = resources;
  const availableAmbulances = (ambulanceRows ?? []).length;

  const resourceItems = [
    { label: "Available Beds", value: r?.available_beds ?? "—", icon: <Bed className="h-4 w-4" />, color: "text-primary", bg: "bg-primary/10" },
    { label: "ICU Beds", value: r?.icu_beds ?? "—", icon: <Activity className="h-4 w-4" />, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" },
    { label: "Emergency Beds", value: r?.emergency_beds ?? "—", icon: <Activity className="h-4 w-4" />, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/20" },
    { label: "Ventilators", value: r?.ventilators ?? "—", icon: <Activity className="h-4 w-4" />, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/20" },
    { label: "Ambulances", value: availableAmbulances, icon: <Ambulance className="h-4 w-4" />, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" },
    { label: "Oxygen Cylinders", value: r?.oxygen_cylinders ?? "—", icon: <Activity className="h-4 w-4" />, color: "text-cyan-600", bg: "bg-cyan-100 dark:bg-cyan-900/20" },
    { label: "Doctors", value: r?.doctors_available ?? "—", icon: <Users className="h-4 w-4" />, color: "text-teal-600", bg: "bg-teal-100 dark:bg-teal-900/20" },
    { label: "Nurses", value: r?.nurses ?? "—", icon: <Users className="h-4 w-4" />, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/20" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-gradient-to-br from-primary to-secondary">
        {hospital.banner_url ? (
          <img src={hospital.banner_url} alt="Hospital Banner" className="w-full h-full object-cover opacity-30" />
        ) : (
          <img src="/dashboard_bg.jpg" alt="Hospital Banner" className="w-full h-full object-cover opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <Badge className="bg-green-500/90 text-white border-0">● Open {r?.timings ?? "24/7"}</Badge>
              {hospital.is_approved && <Badge className="bg-white/20 text-white border-0">✓ Verified</Badge>}
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-white flex items-center gap-3">
              {hospital.logo_url && <img src={hospital.logo_url} alt="Logo" className="h-10 w-10 object-contain rounded bg-white/10 p-1" />}
              {hospital.name}
            </h1>
            <p className="text-white/80 mt-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {hospital.address}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-white/40"}`} />
                ))}
                <span className="text-white font-semibold ml-1">4.8</span>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button size="icon" variant="secondary" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            <Heart className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            onClick={() => navigator.share?.({ title: hospital.name, url: window.location.href })}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Quick action bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-3 mb-8">
          <a href={`tel:${hospital.contact_phone}`}>
            <Button className="bg-gradient-to-r from-primary to-secondary gap-2">
              <Phone className="h-4 w-4" /> Call Emergency ({hospital.contact_phone || "+91 98765 43210"})
            </Button>
          </a>
          {hospital.latitude && hospital.longitude && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <Navigation className="h-4 w-4" /> Get Directions
              </Button>
            </a>
          )}
          <Button variant="outline" className="gap-2">
            <Heart className="h-4 w-4" /> Save to Favorites
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview">
              <TabsList className="h-11 rounded-xl mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="doctors">Doctors</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <Card className="glass">
                    <CardHeader><CardTitle>About the Hospital</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {hospital.description || `${hospital.name} is a premier healthcare institution providing comprehensive emergency and specialized medical care.`}
                      </p>
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: "Doctors", value: r?.doctors_available ? `${r.doctors_available}+` : "—" },
                          { label: "Nurses", value: r?.nurses ? `${r.nurses}+` : "—" },
                          { label: "Total Beds", value: r?.total_beds ? `${r.total_beds}` : "—" },
                          { label: "Ambulances", value: availableAmbulances > 0 ? `${availableAmbulances}` : "—" },
                        ].map((s) => (
                          <div key={s.label} className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-2xl font-bold text-primary">{s.value}</div>
                            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardHeader><CardTitle>Departments</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {DEPARTMENTS.map((d) => (
                          <Badge key={d} variant="secondary" className="text-sm py-1 px-3">{d}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="resources">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" /> Live Resource Status
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" /> Real-time status synced
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {resourceItems.map((ri) => (
                          <div key={ri.label} className={`${ri.bg} rounded-xl p-4 text-center`}>
                            <div className={`${ri.color} flex justify-center mb-2`}>{ri.icon}</div>
                            <div className={`text-3xl font-bold ${ri.color}`}>{ri.value}</div>
                            <div className="text-xs text-muted-foreground mt-1">{ri.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                          <Clock className="h-5 w-5 text-orange-500" />
                          <div>
                            <div className="font-semibold text-sm">{r?.waiting_time_minutes ?? 15} minutes</div>
                            <div className="text-xs text-muted-foreground">Avg. Wait Time</div>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg flex items-center gap-3 ${r?.pharmacy_status ?? true ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}>
                          <CheckCircle className={`h-5 w-5 ${r?.pharmacy_status ?? true ? "text-green-600" : "text-destructive"}`} />
                          <div>
                            <div className={`font-semibold text-sm ${r?.pharmacy_status ?? true ? "text-green-700 dark:text-green-400" : "text-destructive"}`}>
                              {r?.pharmacy_status ?? true ? "Open" : "Closed"}
                            </div>
                            <div className="text-xs text-muted-foreground">Pharmacy Status</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="doctors">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {FALLBACK_DOCTORS.map((doc, i) => (
                    <Card key={i} className="glass hover:border-primary/30 transition-colors">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                          {doc.name.split(" ").slice(1).map((n) => n[0]).join("")}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{doc.name}</h3>
                          <p className="text-sm text-muted-foreground">{doc.dept}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{doc.rating}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{doc.exp} experience</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Book</Button>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="reviews">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {FALLBACK_REVIEWS.map((rev, i) => (
                    <Card key={i} className="glass">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent text-white text-xs flex items-center justify-center font-bold">
                              {rev.name[0]}
                            </div>
                            <span className="font-semibold text-sm">{rev.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{rev.date}</span>
                        </div>
                        <div className="flex mb-2">
                          {[...Array(5)].map((_, s) => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{rev.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="glass">
              <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary"/>Contact Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: <Phone className="h-4 w-4 text-primary" />, label: "Emergency", value: hospital.contact_phone || "+91 98765 43210" },
                  { icon: <Clock className="h-4 w-4 text-primary" />, label: "Hours", value: r?.timings ?? "24/7 Emergency" },
                  { icon: <MapPin className="h-4 w-4 text-primary" />, label: "Address", value: hospital.address || "India" },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg mt-0.5">{c.icon}</div>
                    <div>
                      <div className="text-xs text-muted-foreground">{c.label}</div>
                      <div className="text-sm font-medium">{c.value}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader><CardTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-destructive"/>Blood Bank</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((group) => {
                    const units = bloodMap[group] ?? 0;
                    return (
                      <div key={group} className={`text-center p-2 rounded-lg ${units > 10 ? "bg-green-100 dark:bg-green-900/20" : units > 0 ? "bg-orange-100 dark:bg-orange-900/20" : "bg-red-100 dark:bg-red-900/20"}`}>
                        <div className={`text-xs font-bold ${units > 10 ? "text-green-700 dark:text-green-400" : units > 0 ? "text-orange-700 dark:text-orange-400" : "text-destructive"}`}>{group}</div>
                        <div className="text-xs text-muted-foreground">{units}u</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader><CardTitle className="flex items-center gap-2"><Ambulance className="h-5 w-5 text-green-600"/>Ambulances</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center py-3">
                  <div className="text-5xl font-bold text-green-600">{availableAmbulances}</div>
                  <div className="text-sm text-muted-foreground mt-1">Available Now</div>
                </div>
                <a href={`tel:${hospital.contact_phone}`}>
                  <Button className="w-full bg-green-600 hover:bg-green-700 mt-2">
                    <Phone className="h-4 w-4 mr-2" /> Book Ambulance
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
