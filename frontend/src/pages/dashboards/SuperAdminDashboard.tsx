import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchHospitals,
  createHospitalRecord,
  approveHospitalRecord,
  deleteHospitalRecord,
  fetchActivityLogs,
  logActivity,
  fetchHospitalAdmins,
  Hospital,
  ActivityLogItem,
  HospitalAdminUser,
} from "../../lib/dataStore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Building2, Users, Activity, CheckCircle, XCircle,
  Clock, TrendingUp, AlertTriangle, Plus, Trash2, Search, Filter, UserCheck,
} from "lucide-react";

const analyticsData = [
  { month: "Jan", hospitals: 40, patients: 2400 },
  { month: "Feb", hospitals: 55, patients: 3200 },
  { month: "Mar", hospitals: 70, patients: 4100 },
  { month: "Apr", hospitals: 90, patients: 5300 },
  { month: "May", hospitals: 110, patients: 6200 },
  { month: "Jun", hospitals: 124, patients: 7800 },
];
const pieData = [
  { name: "Patient", value: 75 },
  { name: "Hospital Admin", value: 20 },
  { name: "Super Admin", value: 5 },
];
const COLORS = ["#0F766E", "#14B8A6", "#06B6D4"];

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
        type === "success" ? "bg-green-600" : "bg-destructive"
      }`}
    >
      {type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {message}
    </motion.div>
  );
}

const EMPTY_FORM = {
  name: "",
  address: "",
  contact_phone: "",
  contact_email: "",
  description: "",
  latitude: "",
  longitude: "",
  admin_id: "",
};

export default function SuperAdminDashboard() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch all hospitals ──
  const { data: hospitals = [], isLoading: hospLoading } = useQuery<Hospital[]>({
    queryKey: ["hospitals"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: fetchHospitals,
  });

  // ── Fetch hospital admin users ──
  const { data: adminUsers = [] } = useQuery<HospitalAdminUser[]>({
    queryKey: ["hospital-admins"],
    queryFn: fetchHospitalAdmins,
  });

  // ── Fetch activity logs ──
  const { data: activityLogs = [] } = useQuery<ActivityLogItem[]>({
    queryKey: ["activity-logs"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: fetchActivityLogs,
  });

  // ── Approve hospital ──
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("[SuperAdmin] Approving hospital:", id);
      await approveHospitalRecord(id);
      await logActivity(`Hospital approved (ID: ${id})`);
      console.log("[SuperAdmin] Hospital approved successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      showToast("Hospital approved and is now live!", "success");
    },
    onError: (err: Error) => {
      console.error("[SuperAdmin] Approve error:", err.message);
      showToast(err.message || "Failed to approve hospital", "error");
    },
  });

  // ── Reject/Delete hospital ──
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("[SuperAdmin] Deleting hospital:", id);
      await deleteHospitalRecord(id);
      await logActivity(`Hospital removed (ID: ${id})`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      showToast("Hospital rejected and removed.", "success");
    },
    onError: (err: Error) => {
      console.error("[SuperAdmin] Delete error:", err.message);
      showToast(err.message || "Failed to delete hospital", "error");
    },
  });

  // ── Create hospital ──
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!createForm.name.trim()) throw new Error("Hospital name is required.");
      const created = await createHospitalRecord({
        name: createForm.name,
        address: createForm.address,
        contact_phone: createForm.contact_phone,
        contact_email: createForm.contact_email,
        description: createForm.description,
        admin_id: createForm.admin_id || null,
        latitude: createForm.latitude ? parseFloat(createForm.latitude) : null,
        longitude: createForm.longitude ? parseFloat(createForm.longitude) : null,
      });
      await logActivity(`New hospital registered: ${created.name}`);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      setShowCreateModal(false);
      setCreateForm(EMPTY_FORM);
      showToast("Hospital created & linked successfully!", "success");
    },
    onError: (err: Error) => showToast(err.message || "Failed to create hospital", "error"),
  });

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;

  // ── Derived stats ──
  const totalHospitals = hospitals.length;
  const pendingCount = hospitals.filter((h) => !h.is_approved).length;
  const approvedCount = hospitals.filter((h) => h.is_approved).length;
  const userCount = 1250;

  const filtered = hospitals.filter((h) => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) || (h.address && h.address.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" ? true : statusFilter === "pending" ? !h.is_approved : h.is_approved;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const statCards = [
    { label: "Total Hospitals", value: totalHospitals.toString(), icon: <Building2 className="h-6 w-6" />, change: `${approvedCount} live`, color: "from-primary to-secondary" },
    { label: "Total Users", value: userCount.toLocaleString(), icon: <Users className="h-6 w-6" />, change: "Registered", color: "from-blue-500 to-blue-700" },
    { label: "Pending Approval", value: pendingCount.toString(), icon: <Clock className="h-6 w-6" />, change: "Awaiting review", color: "from-orange-500 to-orange-700" },
    { label: "Approved Live", value: approvedCount.toString(), icon: <CheckCircle className="h-6 w-6" />, change: "On public map", color: "from-green-500 to-green-700" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/3">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Create Hospital Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-2xl shadow-2xl w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-xl font-heading font-bold mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Create New Hospital
              </h2>
              <div className="space-y-3">
                {([
                  { key: "name", label: "Hospital Name *", placeholder: "e.g. Yashoda Hospital" },
                  { key: "address", label: "Address *", placeholder: "123 Health St, Hyderabad" },
                  { key: "contact_phone", label: "Contact Phone", placeholder: "+91 98765 43210" },
                  { key: "contact_email", label: "Contact Email", placeholder: "admin@hospital.com" },
                  { key: "latitude", label: "Latitude (optional - auto-geocoded if blank)", placeholder: "17.4435" },
                  { key: "longitude", label: "Longitude (optional - auto-geocoded if blank)", placeholder: "78.3772" },
                ] as { key: keyof typeof createForm; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-sm font-medium">{label}</label>
                    <Input
                      className="mt-1"
                      placeholder={placeholder}
                      value={createForm[key]}
                      onChange={(e) => setCreateForm((p) => ({ ...p, [key]: e.target.value }))}
                    />
                  </div>
                ))}

                {/* Assign Hospital Admin dropdown */}
                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    <UserCheck className="h-4 w-4 text-primary" /> Assign Hospital Admin
                  </label>
                  <select
                    className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    value={createForm.admin_id}
                    onChange={(e) => setCreateForm((p) => ({ ...p, admin_id: e.target.value }))}
                  >
                    <option value="">-- Select Registered Hospital Admin --</option>
                    {adminUsers.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.full_name || admin.email} ({admin.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    rows={2}
                    className="w-full mt-1 px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Brief hospital description..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-secondary"
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating…" : "Create & Link Hospital"}
                </Button>
                <Button variant="outline" onClick={() => { setShowCreateModal(false); setCreateForm(EMPTY_FORM); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold">Super Admin Portal</h1>
              <p className="text-muted-foreground text-sm">Manage all hospitals, users, and platform analytics</p>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-primary to-secondary gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4" /> Add Hospital
          </Button>
        </motion.div>

        {/* Stat cards */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={i} whileHover={{ y: -3 }}>
              <Card className={`bg-gradient-to-br ${s.color} text-white border-0 shadow-lg`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="opacity-80">{s.icon}</div>
                    <Badge className="bg-white/20 text-white border-0 text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />{s.change}
                    </Badge>
                  </div>
                  <div className="text-3xl font-heading font-bold">{s.value}</div>
                  <div className="text-white/80 text-sm mt-1">{s.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="hospitals" className="space-y-6">
          <TabsList className="h-11 rounded-xl">
            <TabsTrigger value="hospitals">
              All Hospitals
              <Badge className="ml-2 bg-primary/20 text-primary border-0 text-xs px-1.5 py-0">{totalHospitals}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approvals">
              Approvals
              {pendingCount > 0 && (
                <Badge className="ml-2 bg-destructive text-white text-xs px-1.5 py-0">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* All Hospitals Tab */}
          <TabsContent value="hospitals">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass">
                <CardHeader>
                  <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                    <CardTitle>Hospital Registry</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9 h-9 w-56"
                          placeholder="Search hospitals…"
                          value={search}
                          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        />
                      </div>
                      <div className="flex gap-1">
                        {(["all", "pending", "approved"] as const).map((f) => (
                          <Button
                            key={f}
                            size="sm"
                            variant={statusFilter === f ? "default" : "outline"}
                            onClick={() => { setStatusFilter(f); setPage(0); }}
                            className="h-9 capitalize text-xs"
                          >
                            <Filter className="h-3 w-3 mr-1" />{f}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {hospLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : paginated.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      No hospitals match the current filter.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paginated.map((h) => (
                        <div key={h.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 border rounded-xl hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {h.name}
                                {h.admin_id && <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary">Linked Admin</Badge>}
                              </div>
                              <div className="text-sm text-muted-foreground">{h.address ?? "No address"}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{h.contact_phone} · {h.contact_email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={h.is_approved ? "default" : "secondary"}>
                              {h.is_approved ? "✓ Approved" : "⏳ Pending"}
                            </Badge>
                            {!h.is_approved && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                                onClick={() => approveMutation.mutate(h.id)}
                                disabled={approveMutation.isPending}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Approve
                              </Button>
                            )}
                            <Button size="sm" variant="destructive" className="h-8 text-xs"
                              onClick={() => { if (confirm(`Delete "${h.name}"?`)) rejectMutation.mutate(h.id); }}
                              disabled={rejectMutation.isPending}>
                              <Trash2 className="h-3 w-3 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                      <span className="text-sm flex items-center px-3 text-muted-foreground">
                        Page {page + 1} of {totalPages}
                      </span>
                      <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Hospital Registration Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hospitals.filter((h) => !h.is_approved).length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-60" />
                      All hospitals have been reviewed. No pending approvals.
                    </div>
                  ) : (
                    hospitals.filter((h) => !h.is_approved).map((h) => (
                      <div key={h.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-xl hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{h.name}</div>
                            <div className="text-sm text-muted-foreground">{h.address}</div>
                            <div className="flex gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {new Date(h.created_at).toLocaleDateString("en-IN")}
                              </span>
                              {h.contact_phone && (
                                <span className="text-xs text-muted-foreground">{h.contact_phone}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700"
                            onClick={() => approveMutation.mutate(h.id)}
                            disabled={approveMutation.isPending}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive"
                            onClick={() => { if (confirm(`Reject and delete "${h.name}"?`)) rejectMutation.mutate(h.id); }}
                            disabled={rejectMutation.isPending}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="glass lg:col-span-2">
                <CardHeader><CardTitle>Hospital Growth</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="hospitals" fill="#0F766E" radius={[4, 4, 0, 0]} name="Hospitals" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardHeader><CardTitle>User Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          {d.name}
                        </div>
                        <span className="font-medium">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass lg:col-span-3">
                <CardHeader><CardTitle>Patient Growth Analytics</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} />
                      <Bar dataKey="patients" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Patients Helped" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="glass">
                <CardHeader><CardTitle>Recent Activity Log</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {activityLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No activity logged yet.</p>
                  ) : (
                    activityLogs.map((a) => (
                      <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/40">
                        <div className="h-2 w-2 rounded-full shrink-0 bg-primary" />
                        <div className="flex-1">
                          <span className="font-medium text-sm">{a.action}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(a.timestamp).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Live stats summary */}
        <Card className="glass border-primary/20">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{totalHospitals}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Registered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                <div className="text-xs text-muted-foreground mt-1">Live on Map</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">{pendingCount}</div>
                <div className="text-xs text-muted-foreground mt-1">Pending Review</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">{userCount}</div>
                <div className="text-xs text-muted-foreground mt-1">Registered Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
