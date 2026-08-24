import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { fetchHospitals } from "../../lib/dataStore";
import {
  Search, MapPin, Heart, Activity, Bell, Star, Bed,
  Ambulance, Droplets, ChevronRight,
} from "lucide-react";

const recentSearches = ["Yashoda Hospital Hyderabad", "ICU Beds Bangalore", "O+ Blood Group Mumbai"];

export default function PatientDashboard() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch top 3 approved hospitals from dataStore
  const { data: rawHospitals = [] } = useQuery({
    queryKey: ["hospitals"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: fetchHospitals,
  });

  const hospitals = rawHospitals.filter((h) => h.is_approved).slice(0, 3);

  // Fetch their resources
  const { data: allResources = [] } = useQuery({
    queryKey: ["public-resources"],
    staleTime: 0,
    refetchOnMount: "always",
    enabled: hospitals.length > 0,
    queryFn: async () => {
      const ids = hospitals.map((h) => h.id);
      const { data, error } = await supabase
        .from("hospital_resources")
        .select("hospital_id, available_beds, waiting_time_minutes")
        .in("hospital_id", ids);
      if (error) return [];
      return data ?? [];
    },
  });

  // Fetch stats
  const { data: totalHospitals } = useQuery({
    queryKey: ["total-hospitals-count"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { count } = await supabase
        .from("hospitals")
        .select("id", { count: "exact", head: true })
        .eq("is_approved", true);
      return count ?? 0;
    },
  });

  const { data: icuCount } = useQuery({
    queryKey: ["icu-count"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data } = await supabase
        .from("hospital_resources")
        .select("icu_beds")
        .gt("icu_beds", 0);
      return data?.length ?? 0;
    },
  });

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Loading dashboard…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "there";

  const resourceMap: Record<string, { available_beds: number; waiting_time_minutes: number }> = {};
  allResources.forEach((r) => { resourceMap[r.hospital_id] = r; });

  const quickStats = [
    { icon: <Bed className="h-5 w-5" />, label: "Hospitals Nearby", value: String(totalHospitals ?? "—"), color: "text-primary" },
    { icon: <Activity className="h-5 w-5" />, label: "With ICU", value: String(icuCount ?? "—"), color: "text-blue-500" },
    { icon: <Ambulance className="h-5 w-5" />, label: "Live Map", value: "View", color: "text-green-500" },
    { icon: <Droplets className="h-5 w-5" />, label: "Blood Search", value: "Find", color: "text-destructive" },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-primary/2 to-accent/2">
      <img src="/dashboard_bg.jpg" className="absolute inset-0 w-full h-full object-cover opacity-5 dark:opacity-5 -z-10 pointer-events-none" alt="" />

      <div className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold">
              Good day, <span className="text-primary">{userName}</span> 👋
            </h1>
            <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s available near you right now.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notifications">
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-white text-xs flex items-center justify-center">2</span>
              </Button>
            </Link>
            <Link to="/favorites">
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Emergency search bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass border-primary/20 shadow-lg shadow-primary/5">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    className="pl-11 h-12 text-base border-2 focus:border-primary rounded-xl"
                    placeholder="Search hospitals, blood group, ICU…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Link to={`/map?q=${encodeURIComponent(searchQuery)}`}>
                  <Button className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-secondary font-semibold">
                    <Search className="mr-2 h-4 w-4" /> Search
                  </Button>
                </Link>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="text-xs text-muted-foreground">Recent:</span>
                {recentSearches.map((s) => (
                  <Badge key={s} variant="secondary" className="cursor-pointer hover:bg-primary/10 text-xs">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, i) => (
            <motion.div key={i} whileHover={{ y: -2 }} transition={{ type: "spring" }}>
              <Card className="glass hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                  <div className="text-2xl font-bold font-heading">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Nearby Hospitals — live from Supabase */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Hospitals Near You
            </h2>
            <Link to="/map">
              <Button variant="ghost" size="sm" className="text-primary">
                View on Map <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {hospitals.length === 0 ? (
            <Card className="glass">
              <CardContent className="py-12 text-center text-muted-foreground">
                <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No approved hospitals available yet. Check back soon.</p>
                <Link to="/map" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">View Map</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hospitals.map((h, i) => {
                const res = resourceMap[h.id];
                return (
                  <motion.div key={h.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} whileHover={{ y: -3 }}>
                    <Card className="glass h-full hover:border-primary/40 hover:shadow-md transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base leading-tight">{h.name}</CardTitle>
                          <Badge variant={res?.available_beds > 0 ? "default" : "destructive"} className="text-xs shrink-0">
                            {res?.available_beds > 0 ? "Open" : "Full"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{h.address || "India"}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-primary">{res?.available_beds ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">Beds</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-orange-500">{res?.waiting_time_minutes ? `${res.waiting_time_minutes}m` : "—"}</div>
                            <div className="text-xs text-muted-foreground">Wait</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold flex items-center justify-center gap-0.5 text-yellow-500">
                              <Star className="h-3.5 w-3.5 fill-yellow-400" />4.5
                            </div>
                            <div className="text-xs text-muted-foreground">Rating</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/hospitals/${h.id}`} className="flex-1">
                            <Button size="sm" className="w-full text-xs bg-gradient-to-r from-primary to-secondary">Details</Button>
                          </Link>
                          <Button size="sm" variant="outline" className="px-3">
                            <Heart className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-xl font-heading font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Droplets className="h-6 w-6" />, label: "Blood Search", href: "/map?filter=blood", color: "from-red-500/10 to-red-600/5 text-red-600 border-red-200" },
              { icon: <Ambulance className="h-6 w-6" />, label: "Ambulance", href: "/map?filter=ambulance", color: "from-green-500/10 to-green-600/5 text-green-600 border-green-200" },
              { icon: <Activity className="h-6 w-6" />, label: "ICU Availability", href: "/map?filter=icu", color: "from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-200" },
              { icon: <MapPin className="h-6 w-6" />, label: "Live Map", href: "/map", color: "from-primary/10 to-accent/5 text-primary border-primary/20" },
            ].map((action) => (
              <Link key={action.label} to={action.href}>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Card className={`bg-gradient-to-br ${action.color} border cursor-pointer hover:shadow-md transition-all`}>
                    <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
                      {action.icon}
                      <span className="text-sm font-semibold">{action.label}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
