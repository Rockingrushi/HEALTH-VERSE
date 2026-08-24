import { useState, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import {
  fetchHospitalByAdmin,
  fetchHospitalResources,
  fetchBloodInventory,
  fetchAmbulances,
  fetchResourceThresholds,
  saveResourceThresholds,
  saveHospitalResourcesRecord,
  saveBloodInventoryRecord,
  updateHospitalRecord,
  addAmbulanceRecord,
  deleteAmbulanceRecord,
  ResourceThresholds
} from "../../lib/dataStore";
import {
  Activity, Bed, AlertTriangle, Ambulance, Droplets,
  CheckCircle, Clock, Save, Building2, Phone, Image, Settings,
  Plus, Trash2, Upload, Bell
} from "lucide-react";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface Resources {
  id?: string;
  hospital_id?: string;
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
}

interface HospitalRow {
  id: string;
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  banner_url: string | null;
  logo_url: string | null;
  is_approved: boolean;
}

interface AmbulanceRow {
  id: string;
  hospital_id: string;
  status: "available" | "en_route" | "offline";
  contact_number: string;
  vehicle_number: string;
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
        type === "success" ? "bg-green-600" : "bg-destructive"
      }`}
    >
      {type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {message}
    </motion.div>
  );
}

export default function HospitalAdminDashboard() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [newAmbulance, setNewAmbulance] = useState({ vehicle_number: "", contact_number: "" });
  const [showAddAmbulance, setShowAddAmbulance] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch hospital owned by current admin ──
  const { data: hospital, isLoading: hLoading } = useQuery<HospitalRow | null>({
    queryKey: ["my-hospital", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const found = await fetchHospitalByAdmin(user!.id);
      return found as unknown as HospitalRow;
    },
  });

  // ── Fetch resources ──
  const { data: resourcesData } = useQuery<Resources>({
    queryKey: ["hospital-resources", hospital?.id],
    enabled: !!hospital?.id,
    queryFn: async () => {
      const res = await fetchHospitalResources(hospital!.id);
      return res ?? {
        total_beds: 0, available_beds: 0, icu_beds: 0, emergency_beds: 0,
        ventilators: 0, doctors_available: 0, nurses: 0, oxygen_cylinders: 0,
        waiting_time_minutes: 0, pharmacy_status: true, timings: "24/7",
      };
    },
  });

  // ── Fetch blood inventory ──
  const { data: bloodData } = useQuery<Record<string, number>>({
    queryKey: ["blood-inventory", hospital?.id],
    enabled: !!hospital?.id,
    queryFn: async () => {
      const rows = await fetchBloodInventory(hospital!.id);
      const map: Record<string, number> = {};
      bloodGroups.forEach((g) => (map[g] = 0));
      (rows ?? []).forEach((row) => { map[row.blood_group] = row.units_available; });
      return map;
    },
  });

  // ── Fetch ambulances ──
  const { data: ambulances } = useQuery<AmbulanceRow[]>({
    queryKey: ["ambulances", hospital?.id],
    enabled: !!hospital?.id,
    queryFn: async () => {
      const rows = await fetchAmbulances(hospital!.id);
      return rows as unknown as AmbulanceRow[];
    },
  });

  const [resources, setResources] = useState<Resources>({
    total_beds: 0, available_beds: 0, icu_beds: 0, emergency_beds: 0,
    ventilators: 0, doctors_available: 0, nurses: 0, oxygen_cylinders: 0,
    waiting_time_minutes: 0, pharmacy_status: true, timings: "24/7",
  });
  const [blood, setBlood] = useState<Record<string, number>>({
    "A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0,
  });
  const [profile, setProfile] = useState({ name: "", address: "", contact_email: "", contact_phone: "", description: "" });
  const [icuThreshold, setIcuThreshold] = useState<number>(2);

  useQuery<ResourceThresholds>({
    queryKey: ["thresholds", hospital?.id],
    enabled: !!hospital?.id,
    queryFn: async () => {
      const data = await fetchResourceThresholds(hospital!.id);
      if (data?.icu_threshold !== undefined) setIcuThreshold(data.icu_threshold);
      return data;
    },
  });

  const saveThresholdsMutation = useMutation({
    mutationFn: async () => {
      if (!hospital?.id) return;
      await saveResourceThresholds(hospital.id, { icu_threshold: icuThreshold });
    },
    onSuccess: () => showToast("Resource alert thresholds saved!", "success"),
  });

  // Sync from server → local state (server data always wins)
  const effectiveResources = resourcesData ?? resources;
  const effectiveBlood = { ...bloodData, ...blood };

  const updateResource = (key: keyof Resources, val: string | boolean) => {
    setResources((prev) => ({ ...prev, [key]: typeof val === "boolean" ? val : isNaN(Number(val)) ? val : Number(val) }));
    if (resourcesData) {
      (resourcesData as Resources)[key] = typeof val === "boolean" ? val as never : (isNaN(Number(val)) ? val : Number(val)) as never;
    }
  };

  const updateBloodUnit = (bg: string, val: number) => {
    const safeVal = Math.max(0, isNaN(val) ? 0 : val);
    setBlood((prev) => ({ ...prev, [bg]: safeVal }));
    if (bloodData) {
      bloodData[bg] = safeVal;
    }
  };

  // ── Save Resources ──
  const saveResourcesMutation = useMutation({
    mutationFn: async () => {
      if (!hospital?.id) throw new Error("No hospital found. Ensure your account is linked to a hospital.");
      const totalBeds = Number(effectiveResources.total_beds) || 0;
      const availBeds = Number(effectiveResources.available_beds) || 0;
      if (
        totalBeds < 0 || availBeds < 0 ||
        (Number(effectiveResources.icu_beds) || 0) < 0 ||
        (Number(effectiveResources.emergency_beds) || 0) < 0 ||
        (Number(effectiveResources.ventilators) || 0) < 0 ||
        (Number(effectiveResources.doctors_available) || 0) < 0 ||
        (Number(effectiveResources.nurses) || 0) < 0 ||
        (Number(effectiveResources.oxygen_cylinders) || 0) < 0 ||
        (Number(effectiveResources.waiting_time_minutes) || 0) < 0
      ) {
        throw new Error("Resource numbers cannot be negative.");
      }
      if (availBeds > totalBeds) {
        throw new Error("Available beds cannot exceed total beds.");
      }
      console.log("[Dashboard] Saving resources for hospital:", hospital.id, effectiveResources);
      await saveHospitalResourcesRecord(hospital.id, effectiveResources);
      console.log("[Dashboard] Resources saved successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital-resources"] });
      queryClient.invalidateQueries({ queryKey: ["hospital-resources", hospital?.id] });
      queryClient.invalidateQueries({ queryKey: ["hospital", hospital?.id] });
      showToast("Resources saved successfully!", "success");
    },
    onError: (err: Error) => {
      console.error("[Dashboard] Resources save error:", err.message);
      showToast(err.message || "Failed to save resources", "error");
    },
  });

  // ── Save Blood Inventory ──
  const saveBloodMutation = useMutation({
    mutationFn: async () => {
      if (!hospital?.id) throw new Error("No hospital linked.");
      console.log("[Dashboard] Saving blood inventory for hospital:", hospital.id, effectiveBlood);
      await saveBloodInventoryRecord(hospital.id, effectiveBlood);
      console.log("[Dashboard] Blood inventory saved successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blood-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["blood-inventory", hospital?.id] });
      queryClient.invalidateQueries({ queryKey: ["hospital", hospital?.id] });
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["public-resources"] });
      showToast("Blood inventory updated!", "success");
    },
    onError: (err: Error) => {
      console.error("[Dashboard] Blood save error:", err.message);
      showToast(err.message || "Failed to update blood inventory", "error");
    },
  });

  // ── Update Profile ──
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!hospital?.id) throw new Error("No hospital linked.");
      const updates = {
        name:          profile.name          || hospital.name,
        address:       profile.address       || hospital.address,
        contact_email: profile.contact_email || hospital.contact_email,
        contact_phone: profile.contact_phone || hospital.contact_phone,
        description:   profile.description   || hospital.description,
        updated_at:    new Date().toISOString(),
      };
      console.log("[Dashboard] Saving hospital profile:", hospital.id, updates);
      await updateHospitalRecord(hospital.id, updates);
      console.log("[Dashboard] Profile saved successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-hospital"] });
      queryClient.invalidateQueries({ queryKey: ["my-hospital", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["hospital", hospital?.id] });
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      showToast("Hospital profile updated!", "success");
    },
    onError: (err: Error) => {
      console.error("[Dashboard] Profile save error:", err.message);
      showToast(err.message || "Failed to update profile", "error");
    },
  });

  // ── Add Ambulance ──
  const addAmbulanceMutation = useMutation({
    mutationFn: async () => {
      if (!hospital?.id) throw new Error("No hospital linked.");
      if (!newAmbulance.vehicle_number) throw new Error("Vehicle number is required.");
      console.log("[Dashboard] Adding ambulance:", newAmbulance);
      await addAmbulanceRecord(hospital.id, newAmbulance.vehicle_number, newAmbulance.contact_number);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ambulances"] });
      queryClient.invalidateQueries({ queryKey: ["ambulances", hospital?.id] });
      setNewAmbulance({ vehicle_number: "", contact_number: "" });
      setShowAddAmbulance(false);
      showToast("Ambulance added!", "success");
    },
    onError: (err: Error) => {
      console.error("[Dashboard] Add ambulance error:", err.message);
      showToast(err.message || "Failed to add ambulance", "error");
    },
  });

  // ── Delete Ambulance ──
  const deleteAmbulanceMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("[Dashboard] Deleting ambulance:", id);
      await deleteAmbulanceRecord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ambulances"] });
      queryClient.invalidateQueries({ queryKey: ["ambulances", hospital?.id] });
      showToast("Ambulance removed.", "success");
    },
    onError: (err: Error) => {
      console.error("[Dashboard] Delete ambulance error:", err.message);
      showToast(err.message || "Failed to remove ambulance", "error");
    },
  });

  // ── Image Upload ──
  const handleImageUpload = async (file: File, type: "banner" | "logo") => {
    if (!hospital?.id) return showToast("No hospital linked.", "error");
    try {
      const ext = file.name.split(".").pop();
      const path = `${hospital.id}/${type}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("hospital_images").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("hospital_images").getPublicUrl(path);
      const col = type === "banner" ? "banner_url" : "logo_url";
      const { error: dbErr } = await supabase.from("hospitals").update({ [col]: urlData.publicUrl }).eq("id", hospital.id);
      if (dbErr) throw dbErr;
      queryClient.invalidateQueries({ queryKey: ["my-hospital"] });
      showToast(`${type === "banner" ? "Banner" : "Logo"} uploaded!`, "success");
    } catch (err) {
      showToast((err as Error).message || "Upload failed", "error");
    }
  };

  if (loading || hLoading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;

  const res = { ...resources, ...resourcesData };
  const bl = { ...blood, ...bloodData };
  const occupancy = res.total_beds > 0 ? Math.round(((res.total_beds - res.available_beds) / res.total_beds) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/3">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              {hospital?.name ?? "Hospital Control Panel"}
            </h1>
            <p className="text-muted-foreground mt-1">Manage your hospital resources and availability in real-time</p>
            {hospital && (
              <Badge variant={hospital.is_approved ? "default" : "secondary"} className="mt-2">
                {hospital.is_approved ? "✓ Approved & Live" : "⏳ Pending Approval"}
              </Badge>
            )}
          </div>
          <Button
            onClick={() => saveResourcesMutation.mutate()}
            disabled={saveResourcesMutation.isPending}
            className="bg-gradient-to-r from-primary to-secondary px-6"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveResourcesMutation.isPending ? "Saving…" : "Save All Changes"}
          </Button>
        </motion.div>

        {/* No hospital linked warning */}
        {!hospital && !hLoading && (
          <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="p-5 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
              <p className="text-sm text-orange-700 dark:text-orange-400">
                No hospital is linked to your account. Please contact the Super Admin to create and link a hospital to your account.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick status cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass border-l-4 border-l-primary">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Bed Occupancy</span>
                <Bed className="h-4 w-4 text-primary" />
              </div>
              <div className="text-3xl font-bold">{occupancy}%</div>
              <div className="text-xs text-muted-foreground mt-1">{res.available_beds} beds available</div>
            </CardContent>
          </Card>
          <Card className="glass border-l-4 border-l-blue-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">ICU Beds</span>
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-3xl font-bold">{res.icu_beds}</div>
              <div className="text-xs text-muted-foreground mt-1">Available now</div>
            </CardContent>
          </Card>
          <Card className="glass border-l-4 border-l-orange-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Wait Time</span>
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-3xl font-bold">{res.waiting_time_minutes}m</div>
              <div className="text-xs text-muted-foreground mt-1">Current average</div>
            </CardContent>
          </Card>
          <Card className={`glass border-l-4 ${res.pharmacy_status ? "border-l-green-500" : "border-l-destructive"}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pharmacy</span>
                <CheckCircle className={`h-4 w-4 ${res.pharmacy_status ? "text-green-500" : "text-destructive"}`} />
              </div>
              <div className="text-lg font-bold">{res.pharmacy_status ? "Open" : "Closed"}</div>
              <div className="text-xs text-muted-foreground mt-1">{res.timings}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="resources" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg h-12 rounded-xl">
            <TabsTrigger value="resources" className="rounded-lg"><Bed className="h-4 w-4 mr-2"/>Resources</TabsTrigger>
            <TabsTrigger value="blood"><Droplets className="h-4 w-4 mr-2"/>Blood</TabsTrigger>
            <TabsTrigger value="emergency"><AlertTriangle className="h-4 w-4 mr-2"/>Emergency</TabsTrigger>
            <TabsTrigger value="profile"><Settings className="h-4 w-4 mr-2"/>Profile</TabsTrigger>
          </TabsList>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Bed className="h-5 w-5 text-primary"/>Bed Management</CardTitle>
                  <CardDescription>Update real-time bed availability</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {(["total_beds", "available_beds", "icu_beds", "emergency_beds"] as const).map((key) => (
                    <div key={key}>
                      <label className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</label>
                      <Input
                        type="number"
                        value={res[key] as number}
                        onChange={(e) => updateResource(key, e.target.value)}
                        className="mt-1.5"
                        min={0}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-blue-500"/>Staff & Equipment</CardTitle>
                  <CardDescription>Current staff count and equipment</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {(["ventilators", "doctors_available", "nurses", "oxygen_cylinders"] as const).map((key) => (
                    <div key={key}>
                      <label className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</label>
                      <Input
                        type="number"
                        value={res[key] as number}
                        onChange={(e) => updateResource(key, e.target.value)}
                        className="mt-1.5"
                        min={0}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-orange-500"/>Operational Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Waiting Time (minutes)</label>
                    <Input
                      type="number"
                      value={res.waiting_time_minutes}
                      onChange={(e) => updateResource("waiting_time_minutes", e.target.value)}
                      className="mt-1.5"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Timings</label>
                    <Input
                      value={res.timings}
                      onChange={(e) => updateResource("timings", e.target.value)}
                      placeholder="e.g. 24/7 or Mon-Fri 8AM-6PM"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Pharmacy Open</span>
                    <button
                      onClick={() => updateResource("pharmacy_status", !res.pharmacy_status)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${res.pharmacy_status ? "bg-primary" : "bg-muted-foreground/30"}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${res.pharmacy_status ? "left-6" : "left-0.5"}`} />
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Image className="h-5 w-5 text-purple-500"/>Hospital Images</CardTitle>
                  <CardDescription>Upload banner and logo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Banner upload */}
                  <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "banner"); }} />
                  <div
                    onClick={() => bannerInputRef.current?.click()}
                    className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/60 transition-colors cursor-pointer relative overflow-hidden"
                  >
                    {hospital?.banner_url ? (
                      <img src={hospital.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                    ) : null}
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload banner image</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                  </div>
                  {/* Logo upload */}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "logo"); }} />
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center hover:border-primary/60 transition-colors cursor-pointer"
                  >
                    {hospital?.logo_url
                      ? <img src={hospital.logo_url} alt="Logo" className="h-12 w-12 object-contain rounded mx-auto mb-2" />
                      : <Building2 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    }
                    <p className="text-sm text-muted-foreground">Upload hospital logo</p>
                  </div>
                </CardContent>
              </Card>

              {/* Resource Alert Settings (Thresholds) */}
              <Card className="glass md:col-span-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-5 w-5 text-amber-500"/>Low Resource Alert Settings</CardTitle>
                  <CardDescription>Configure low-capacity email thresholds. You will receive an automated email when resources drop to or below these levels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">ICU Beds Threshold</label>
                      <Input
                        type="number"
                        value={icuThreshold}
                        onChange={(e) => setIcuThreshold(Number(e.target.value))}
                        className="mt-1"
                        min={0}
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveThresholdsMutation.mutate()}
                    disabled={saveThresholdsMutation.isPending}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" /> Save Alert Thresholds
                  </Button>
                </CardContent>
              </Card>

              <div className="md:col-span-2 flex justify-end">
                <Button
                  onClick={() => saveResourcesMutation.mutate()}
                  disabled={saveResourcesMutation.isPending}
                  className="bg-gradient-to-r from-primary to-secondary text-base px-8 h-12 shadow-lg shadow-primary/25"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {saveResourcesMutation.isPending ? "Saving…" : "Save All Changes"}
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Blood Tab */}
          <TabsContent value="blood">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Droplets className="h-5 w-5 text-destructive"/>Blood Bank Inventory</CardTitle>
                  <CardDescription>Update units available for each blood group</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {bloodGroups.map((bg) => (
                      <div key={bg} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-destructive text-destructive font-bold">{bg}</Badge>
                          <span className="text-xs text-muted-foreground">units</span>
                        </div>
                        <Input
                          type="number"
                          value={bl[bg] ?? 0}
                          onChange={(e) => updateBloodUnit(bg, Number(e.target.value))}
                          className="text-center font-semibold"
                          min={0}
                        />
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-destructive to-red-400 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (bl[bg] ?? 0) * 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => saveBloodMutation.mutate()}
                    disabled={saveBloodMutation.isPending}
                    className="mt-6 w-full bg-gradient-to-r from-destructive to-red-600"
                  >
                    <Droplets className="h-4 w-4 mr-2" />
                    {saveBloodMutation.isPending ? "Updating…" : "Update Blood Inventory"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Emergency Tab */}
          <TabsContent value="emergency">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-destructive"/>Emergency Contacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Emergency Phone</label>
                    <Input
                      defaultValue={hospital?.contact_phone ?? "+91 98765 43210"}
                      placeholder="+91 98765 43210"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ambulance Contact</label>
                    <Input placeholder="+91 98765 43211" className="mt-1.5" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">ICU Direct Line</label>
                    <Input placeholder="+91 98765 43212" className="mt-1.5" />
                  </div>
                  <Button onClick={() => saveResourcesMutation.mutate()} disabled={saveResourcesMutation.isPending} className="w-full bg-gradient-to-r from-primary to-secondary">
                    <Save className="h-4 w-4 mr-2" /> {saveResourcesMutation.isPending ? "Saving…" : "Save Contacts"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Ambulance className="h-5 w-5 text-green-500"/>Ambulance Fleet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(ambulances ?? []).map((amb) => (
                    <div key={amb.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium">{amb.vehicle_number}</span>
                        <p className="text-xs text-muted-foreground">{amb.contact_number}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={amb.status === "available" ? "default" : amb.status === "en_route" ? "secondary" : "destructive"} className="text-xs capitalize">
                          {amb.status.replace("_", " ")}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteAmbulanceMutation.mutate(amb.id)}
                          disabled={deleteAmbulanceMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(ambulances ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No ambulances registered yet.</p>
                  )}

                  {showAddAmbulance && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                      <Input
                        placeholder="Vehicle number (e.g. MH-01-AB-1001)"
                        value={newAmbulance.vehicle_number}
                        onChange={(e) => setNewAmbulance((p) => ({ ...p, vehicle_number: e.target.value }))}
                      />
                      <Input
                        placeholder="Contact number"
                        value={newAmbulance.contact_number}
                        onChange={(e) => setNewAmbulance((p) => ({ ...p, contact_number: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => addAmbulanceMutation.mutate()} disabled={addAmbulanceMutation.isPending}>
                          {addAmbulanceMutation.isPending ? "Adding…" : "Add"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddAmbulance(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  <Button variant="outline" className="w-full mt-2 border-dashed gap-2" onClick={() => setShowAddAmbulance(true)}>
                    <Plus className="h-4 w-4" /> Add Ambulance
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Hospital Profile</CardTitle>
                  <CardDescription>Basic information visible to patients</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Hospital Name</label>
                    <Input
                      defaultValue={hospital?.name ?? ""}
                      placeholder="Hospital Name"
                      className="mt-1.5"
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact Email</label>
                    <Input
                      type="email"
                      defaultValue={hospital?.contact_email ?? ""}
                      placeholder="admin@hospital.com"
                      className="mt-1.5"
                      onChange={(e) => setProfile((p) => ({ ...p, contact_email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact Phone</label>
                    <Input
                      defaultValue={hospital?.contact_phone ?? ""}
                      placeholder="+91 22 1234 5678"
                      className="mt-1.5"
                      onChange={(e) => setProfile((p) => ({ ...p, contact_phone: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input
                      defaultValue={hospital?.address ?? ""}
                      placeholder="Full address"
                      className="mt-1.5"
                      onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      rows={3}
                      defaultValue={hospital?.description ?? ""}
                      placeholder="Describe your hospital..."
                      className="w-full mt-1.5 px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      onClick={() => saveProfileMutation.mutate()}
                      disabled={saveProfileMutation.isPending}
                      className="bg-gradient-to-r from-primary to-secondary px-8"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveProfileMutation.isPending ? "Saving…" : "Update Profile"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
