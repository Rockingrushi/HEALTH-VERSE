import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Plus, Pause, Play, Trash2, Droplets, Activity, Shield, CheckCircle, AlertTriangle, Mail, Check, RefreshCw
} from "lucide-react";
import {
  fetchHealthAlerts, createHealthAlert, pauseHealthAlert, resumeHealthAlert, deleteHealthAlert,
  fetchEmailHistory, fetchNotificationPreferences, saveNotificationPreferences,
  HealthAlert, EmailNotification, UserNotificationPreferences
} from "../lib/dataStore";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function AlertsPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const [openModal, setOpenModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form State
  const [alertType, setAlertType] = useState<"blood" | "icu" | "resource" | "emergency">("blood");
  const [bloodGroup, setBloodGroup] = useState<string>("O+");
  const [city, setCity] = useState<string>("Hyderabad");
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [email, setEmail] = useState<string>(user?.email || "");

  // Notification Preferences State
  const [prefs, setPrefs] = useState<UserNotificationPreferences>({
    user_id: user?.id || "",
    blood_availability: true,
    icu_availability: true,
    emergency_resources: true,
    hospital_updates: true,
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Queries ──
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<HealthAlert[]>({
    queryKey: ["health-alerts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => await fetchHealthAlerts(user!.id),
  });

  const { data: emailHistory = [], isLoading: historyLoading } = useQuery<EmailNotification[]>({
    queryKey: ["email-history", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const role = user?.user_metadata?.role || (user?.email?.includes("super") ? "super_admin" : user?.email?.includes("admin") ? "hospital_admin" : "patient");
      return await fetchEmailHistory(user!.id, role);
    },
  });

  const { data: serverPrefs } = useQuery<UserNotificationPreferences>({
    queryKey: ["notif-prefs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => await fetchNotificationPreferences(user!.id),
  });

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Please log in to create alerts.");
      if (!email || !email.includes("@")) throw new Error("Please provide a valid email address.");

      await createHealthAlert({
        user_id: user.id,
        alert_type: alertType,
        blood_group: alertType === "blood" ? bloodGroup : null,
        city: city || "Hyderabad",
        radius_km: radiusKm,
        email: email || user.email || "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-alerts"] });
      setOpenModal(false);
      showToast("HealthVerse Alert created successfully!", "success");
    },
    onError: (err: Error) => showToast(err.message || "Failed to create alert", "error"),
  });

  const pauseMutation = useMutation({
    mutationFn: async (alertId: string) => await pauseHealthAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-alerts"] });
      showToast("Alert paused.", "success");
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (alertId: string) => await resumeHealthAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-alerts"] });
      showToast("Alert resumed.", "success");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (alertId: string) => await deleteHealthAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-alerts"] });
      showToast("Alert deleted.", "success");
    },
  });

  const savePrefsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await saveNotificationPreferences(user.id, prefs);
    },
    onSuccess: () => showToast("Notification preferences saved!", "success"),
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const currentPrefs = serverPrefs || prefs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/3 to-accent/3 p-4 md:p-8">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
            toast.type === "success" ? "bg-green-600" : "bg-destructive"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.message}
        </motion.div>
      )}

      <div className="container mx-auto max-w-5xl space-y-8">
        {/* Top Banner */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" /> HealthVerse Alerts
            </h1>
            <p className="text-muted-foreground mt-1">Get instant email notifications when critical healthcare resources become available near you.</p>
          </div>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary font-semibold gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Create New Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md glass">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Create Resource Alert</DialogTitle>
                <DialogDescription>Set up automated email notifications for healthcare emergency availability.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Alert Type</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium"
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value as any)}
                  >
                    <option value="blood">🩸 Blood Availability</option>
                    <option value="icu">🚨 ICU Bed</option>
                    <option value="resource">🏥 Hospital Resource</option>
                    <option value="emergency">🚑 Emergency Resource</option>
                  </select>
                </div>

                {alertType === "blood" && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Blood Group</label>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_GROUPS.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setBloodGroup(bg)}
                          className={`py-1.5 rounded-md text-xs font-bold border transition-all ${
                            bloodGroup === bg ? "bg-destructive text-white border-destructive" : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">City / Region</label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Hyderabad, Bengaluru, Mumbai"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Alert Radius (KM)</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                  >
                    <option value={5}>5 KM Radius</option>
                    <option value={10}>10 KM Radius</option>
                    <option value={25}>25 KM Radius</option>
                    <option value={50}>50 KM Radius</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Notification Email</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpenModal(false)} className="flex-1">Cancel</Button>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                >
                  {createMutation.isPending ? "Creating…" : "Create Alert"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="h-11 rounded-xl mb-6">
            <TabsTrigger value="active" className="gap-2"><Bell className="h-4 w-4" /> Active Alerts ({alerts.length})</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><Mail className="h-4 w-4" /> Email History ({emailHistory.length})</TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2"><Shield className="h-4 w-4" /> Preferences</TabsTrigger>
          </TabsList>

          {/* Active Alerts */}
          <TabsContent value="active">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {alertsLoading ? (
                <div className="p-8 text-center"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
              ) : alerts.length === 0 ? (
                <Card className="glass p-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold">You&apos;re not monitoring any healthcare resources yet.</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
                    Create your first alert to get automated email notifications when blood, ICU beds, or emergency care become available near you.
                  </p>
                  <Button onClick={() => setOpenModal(true)} className="mt-6 bg-gradient-to-r from-primary to-secondary">
                    Create Your First Alert
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alerts.map((al) => (
                    <Card key={al.id} className="glass hover:border-primary/40 transition-colors">
                      <CardContent className="p-5 flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {al.alert_type === "blood" ? (
                              <Badge className="bg-destructive text-white border-0 font-bold gap-1">
                                <Droplets className="h-3.5 w-3.5" /> {al.blood_group || "Blood"}
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-600 text-white border-0 font-bold gap-1">
                                <Activity className="h-3.5 w-3.5" /> ICU Bed
                              </Badge>
                            )}
                            <Badge variant={al.is_active ? "default" : "secondary"} className={al.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}>
                              {al.is_active ? "● Active" : "Paused"}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-lg">{al.city || "Hyderabad"} · {al.radius_km} KM Radius</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" /> {al.email}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          {al.is_active ? (
                            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => pauseMutation.mutate(al.id)}>
                              <Pause className="h-3.5 w-3.5" /> Pause
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => resumeMutation.mutate(al.id)}>
                              <Play className="h-3.5 w-3.5" /> Resume
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(al.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Email History */}
          <TabsContent value="history">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="glass overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Transactional Email Dispatch History</CardTitle>
                  <CardDescription>Server-side Resend email notifications dispatched for resource conditions.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {historyLoading ? (
                    <div className="p-8 text-center"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
                  ) : emailHistory.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">No email notifications sent yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b text-xs text-muted-foreground font-semibold uppercase">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Subject</th>
                            <th className="px-4 py-3">Recipient</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {emailHistory.map((h) => (
                            <tr key={h.id} className="hover:bg-muted/20">
                              <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{new Date(h.sent_at).toLocaleString()}</td>
                              <td className="px-4 py-3 font-semibold">{h.subject}</td>
                              <td className="px-4 py-3 text-muted-foreground">{h.recipient_email}</td>
                              <td className="px-4 py-3">
                                {h.status === "sent" ? (
                                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1"><Check className="h-3 w-3" /> Sent</Badge>
                                ) : (
                                  <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Failed</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notification Preferences */}
          <TabsContent value="preferences">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Email Notification Preferences</CardTitle>
                  <CardDescription>Configure which automated healthcare alerts you wish to receive.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: "blood_availability", label: "Blood Availability Alerts", desc: "Get notified when matching blood groups become available." },
                    { key: "icu_availability", label: "ICU Availability Alerts", desc: "Receive immediate notifications when emergency ICU beds open." },
                    { key: "emergency_resources", label: "Emergency Resource Updates", desc: "Ventilator, ambulance, and oxygen supply threshold alerts." },
                    { key: "hospital_updates", label: "Hospital Approval & Status Updates", desc: "Official status notifications for hospital registrations." },
                  ].map((p) => (
                    <div key={p.key} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                      <div>
                        <div className="font-semibold text-sm">{p.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={(currentPrefs as any)[p.key] ?? true}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setPrefs((prev) => ({ ...prev, [p.key]: val }));
                        }}
                        className="h-5 w-5 accent-primary cursor-pointer"
                      />
                    </div>
                  ))}

                  <Button onClick={() => savePrefsMutation.mutate()} className="mt-4 bg-gradient-to-r from-primary to-secondary">
                    Save Notification Preferences
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
