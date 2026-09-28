import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { Search, MapPin, AlertTriangle, Star, ChevronRight, Heart, Zap, Activity, Ambulance, Droplets, Shield, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";

/* ── Animated counter ── */
function Counter({ end, label, suffix = "" }: { end: number; label: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString() + suffix);

  useEffect(() => { if (isInView) spring.set(end); }, [isInView, end, spring]);

  return (
    <div ref={ref} className="text-center">
      <motion.div className="text-4xl md:text-5xl font-heading font-bold text-primary">{display}</motion.div>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </div>
  );
}

const features = [
  { icon: <Search className="h-6 w-6" />, title: "Instant Discovery", desc: "Find hospitals matching your exact emergency needs in seconds" },
  { icon: <Activity className="h-6 w-6" />, title: "Live Resource Tracking", desc: "Real-time bed counts, ICU availability, and ventilator status" },
  { icon: <Ambulance className="h-6 w-6" />, title: "Ambulance Dispatch", desc: "View ambulance availability and estimated arrival times" },
  { icon: <Droplets className="h-6 w-6" />, title: "Blood Bank Search", desc: "Find specific blood groups at nearby hospitals instantly" },
  { icon: <MapPin className="h-6 w-6" />, title: "Live Maps", desc: "Interactive OpenStreetMap with hospital locations and directions" },
  { icon: <Shield className="h-6 w-6" />, title: "Verified Hospitals", desc: "All hospitals are verified and approved by our admin team" },
];

const testimonials = [
  { name: "Dr. Priya Sharma", role: "Emergency Medicine, AIIMS", text: "HealthVerse helped us manage critical transfers when our ICU was full. The real-time bed data saved lives.", avatar: "PS" },
  { name: "Rahul Mehta", role: "Patient", text: "During my father's cardiac emergency, I found a hospital with available beds in under 2 minutes. Incredible.", avatar: "RM" },
  { name: "Nurse Anita Patel", role: "Head Nurse, City Hospital", text: "The admin panel makes it so easy to update our resource availability. Our staff loves it.", avatar: "AP" },
];

const howItWorks = [
  { step: "01", title: "Search Nearby Hospitals", desc: "Enter your location or use GPS to find hospitals within your radius" },
  { step: "02", title: "Filter by Need", desc: "Select ICU, blood type, ambulance, or specific emergency requirements" },
  { step: "03", title: "Compare Resources", desc: "View real-time availability, wait times, and ratings side by side" },
  { step: "04", title: "Get Directions", desc: "Navigate directly with one tap and call the emergency contact" },
];

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="flex flex-col">
      {/* ── EMERGENCY BANNER ── */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-destructive/90 to-destructive text-white py-2 text-center text-sm font-medium"
      >
        <AlertTriangle className="inline h-4 w-4 mr-2" />
        Emergency? Call <strong>108</strong> or{" "}
        <Link to="/map" className="underline font-bold">Search Nearest Hospital →</Link>
      </motion.div>

      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        {/* Background mesh */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-2xl" />
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <motion.div variants={itemVariants}>
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1">
                  🏥 Smart Healthcare Discovery Platform
                </Badge>
              </motion.div>
              <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight">
                Find Emergency{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Hospital Resources
                </span>{" "}
                Instantly
              </motion.h1>
              <motion.p variants={itemVariants} className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                HealthVerse connects patients with nearby hospitals in real-time — showing available beds, blood banks, ambulances, and ICU status the moment you need it.
              </motion.p>

              {/* Quick Search */}
              <motion.div variants={itemVariants} className="flex gap-3 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    className="pl-12 h-14 text-base rounded-xl border-2 focus:border-primary"
                    placeholder="Search hospitals, locations…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Link to={`/map?q=${encodeURIComponent(searchQuery)}`}>
                  <Button className="h-14 px-6 text-base rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/25">
                    Search
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="h-13 px-8 text-base rounded-xl bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/25">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/map">
                  <Button variant="outline" size="lg" className="h-13 px-8 text-base rounded-xl border-2 hover:bg-primary/5">
                    <MapPin className="mr-2 h-5 w-5" /> Live Map
                  </Button>
                </Link>
              </motion.div>

              {/* Trust badges */}
              <motion.div variants={itemVariants} className="flex items-center gap-6 flex-wrap">
                {["HIPAA Secure", "Real-time Data", "24/7 Available"].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {t}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero illustration */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <img
                  src="/landing_hero.jpg"
                  alt="HealthVerse smart hospital network"
                  className="w-full rounded-3xl shadow-2xl shadow-primary/20 border border-white/20"
                />
                {/* Floating cards */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -left-8 top-1/4 glass rounded-2xl p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">ICU Beds Available</div>
                      <div className="text-lg font-bold text-green-500">12 Beds</div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                  className="absolute -right-8 bottom-1/4 glass rounded-2xl p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <Ambulance className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Ambulance Status</div>
                      <div className="text-lg font-bold text-destructive">Available Now</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── ALL-IN-ONE PROJECT MASTER HUB ── */}
      <section className="py-12 bg-slate-950 text-white border-y border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-slate-950 to-slate-950" />
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950 border border-teal-500/40 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <span>🚀</span> Unified Project Master Hub
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight bg-gradient-to-r from-teal-300 via-emerald-400 to-teal-100 bg-clip-text text-transparent">
              All HealthVerse Modules in One Place
            </h2>
            <p className="text-slate-400 text-sm">
              Direct 1-click access to all portals, role-based dashboards, interactive mapping, emergency alert engine, presentation deck, and IEEE 830 SRS documentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Core Portals */}
            <div className="rounded-2xl p-5 bg-slate-900/90 border border-teal-500/30 shadow-xl flex flex-col justify-between space-y-4 hover:border-teal-500/60 transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                  <span className="p-2 rounded-lg bg-teal-500/20 text-teal-300">🗺️</span>
                  <span>Portals & Maps</span>
                </div>
                <div className="space-y-2 text-xs">
                  <Link to="/map" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/60">
                    <span>📍 India Live Map</span>
                    <ArrowRight className="h-3.5 w-3.5 text-teal-400" />
                  </Link>
                  <Link to="/dashboard/patient" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/60">
                    <span>👤 Patient Discovery</span>
                    <ArrowRight className="h-3.5 w-3.5 text-teal-400" />
                  </Link>
                  <Link to="/compare" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/60">
                    <span>⚖️ Hospital Comparison</span>
                    <ArrowRight className="h-3.5 w-3.5 text-teal-400" />
                  </Link>
                </div>
              </div>
            </div>

            {/* 2. Admin Dashboards */}
            <div className="rounded-2xl p-5 bg-slate-900/90 border border-blue-500/30 shadow-xl flex flex-col justify-between space-y-4 hover:border-blue-500/60 transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <span className="p-2 rounded-lg bg-blue-500/20 text-blue-300">🏥</span>
                  <span>Admin Control Panels</span>
                </div>
                <div className="space-y-2 text-xs">
                  <Link to="/dashboard/hospital" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/60">
                    <span>🏥 Hospital Admin Panel</span>
                    <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
                  </Link>
                  <Link to="/dashboard/superadmin" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/60">
                    <span>👑 Super Admin Governance</span>
                    <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
                  </Link>
                  <Link to="/alerts" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/60">
                    <span>🔔 HealthVerse Alerts Hub</span>
                    <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
                  </Link>
                </div>
              </div>
            </div>

            {/* 3. Academic Presentation & Docs */}
            <div className="rounded-2xl p-5 bg-slate-900/90 border border-amber-500/30 shadow-xl flex flex-col justify-between space-y-4 hover:border-amber-500/60 transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <span className="p-2 rounded-lg bg-amber-500/20 text-amber-300">📽️</span>
                  <span>Presentation & SRS</span>
                </div>
                <div className="space-y-2 text-xs">
                  <a href="/presentation.html" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-950/60 text-amber-200 transition font-medium border border-amber-500/40">
                    <span>📽️ 11-Slide Web PPT</span>
                    <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                  </a>
                  <a href="/HealthVerse_Presentation.pptx" download className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/60">
                    <span>📥 Download .PPTX File</span>
                    <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                  </a>
                  <a href="/SRS_DOCUMENT.md" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/60">
                    <span>📑 IEEE 830 SRS Document</span>
                    <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                  </a>
                </div>
              </div>
            </div>

            {/* 4. Backend & API Services */}
            <div className="rounded-2xl p-5 bg-slate-900/90 border border-emerald-500/30 shadow-xl flex flex-col justify-between space-y-4 hover:border-emerald-500/60 transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">⚙️</span>
                  <span>Backend & API Services</span>
                </div>
                <div className="space-y-2 text-xs">
                  <a href="http://localhost:8000" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/60">
                    <span>⚙️ FastAPI Server (8000)</span>
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                  </a>
                  <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition font-medium border border-slate-700/60">
                    <span>📖 Swagger API Docs</span>
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                  </a>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 text-emerald-300 font-mono text-[11px] border border-emerald-500/30">
                    <span>🟢 All Services Live & Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Counter end={500} label="Hospitals Listed" suffix="+" />
            <Counter end={50000} label="Patients Helped" suffix="+" />
            <Counter end={15} label="Cities Covered" suffix="+" />
            <Counter end={98} label="Uptime" suffix="%" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">Core Features</Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-bold">Everything You Need in an Emergency</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
              HealthVerse was designed with one goal: get you the information you need to make the right healthcare decision, fast.
            </p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card className="glass h-full hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary mb-4 group-hover:from-primary group-hover:to-accent group-hover:text-white transition-all duration-300">
                      {f.icon}
                    </div>
                    <h3 className="font-heading font-bold text-lg mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-secondary/10 text-secondary border-secondary/20">How It Works</Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-bold">4 Steps to Emergency Care</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary to-accent" />
            {howItWorks.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center relative z-10"
              >
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-heading font-bold text-lg mb-4 shadow-lg shadow-primary/25">
                  {s.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMERGENCY SEARCH SECTION ── */}
      <section className="py-24 bg-gradient-to-br from-primary to-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/landing_hero.jpg')] bg-cover bg-center opacity-10" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">Need Emergency Help Right Now?</h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              Don&apos;t waste precious time. Search for the nearest hospital with available resources instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link to="/map" className="flex-1">
                <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90 font-bold shadow-xl">
                  <MapPin className="mr-2 h-5 w-5" /> Find Hospital Now
                </Button>
              </Link>
              <a href="tel:108" className="flex-1">
                <Button size="lg" variant="outline" className="w-full border-white text-white hover:bg-white/10 font-bold">
                  Call Emergency 108
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-heading font-bold">Trusted by Healthcare Professionals</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass h-full p-6 hover:border-primary/30 transition-colors">
                  <CardContent className="p-0">
                    <div className="flex mb-3">
                      {[...Array(5)].map((_, s) => <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3 border-t pt-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                        {t.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5 border-t">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-heading font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of patients and healthcare providers who use HealthVerse every day.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="px-10 bg-gradient-to-r from-primary to-secondary shadow-lg">
                  Create Free Account <ChevronRight className="ml-2" />
                </Button>
              </Link>
              <Link to="/map">
                <Button size="lg" variant="outline" className="px-10 border-2">
                  <Heart className="mr-2 h-5 w-5" /> Explore Hospitals
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}