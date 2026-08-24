import os

files = {
    'src/components/theme-provider.tsx': '''import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}''',
    'src/components/layout/Navbar.tsx': '''import { Link } from "react-router-dom";
import { useTheme } from "../theme-provider";
import { Moon, Sun } from "lucide-react";

export default function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-heading font-bold text-2xl text-primary">HealthVerse</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Login</Link>
          <Link to="/register" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Register</Link>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-muted"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}''',
    'src/components/layout/Footer.tsx': '''export default function Footer() {
  return (
    <footer className="border-t border-border py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built by HealthVerse. Connecting patients with resources.
        </p>
      </div>
    </footer>
  );
}''',
    'src/pages/LandingPage.tsx': '''import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
           <img src="/landing_hero.jpg" alt="Hero" className="w-full h-full object-cover opacity-20 dark:opacity-10" />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
        </div>
        <div className="container px-4 md:px-6 relative z-10">
          <div className="flex flex-col items-center space-y-4 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              <h1 className="text-3xl font-heading font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Smart Hospital Resource <span className="text-primary">Discovery</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Find nearby hospitals, check real-time bed availability, blood inventory, and ambulances instantly during emergencies.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-x-4"
            >
              <Link
                to="/register"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Get Started
              </Link>
              <Link
                to="/map"
                className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Search Map
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}''',
    'src/pages/Login.tsx': '''export default function Login() { return <div className="p-8 text-center relative min-h-screen">
        <img src="/login_bg.jpg" className="absolute inset-0 w-full h-full object-cover opacity-30 -z-10" />
        <div className="glass max-w-md mx-auto mt-20 p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-4 font-heading">Login</h2>
            <p>Login form will go here</p>
        </div>
    </div>; }''',
    'src/pages/Register.tsx': '''export default function Register() { return <div className="p-8 text-center">Register Page</div>; }''',
    'src/pages/dashboards/PatientDashboard.tsx': '''export default function PatientDashboard() { return <div className="p-8 text-center relative min-h-screen">
        <img src="/dashboard_bg.jpg" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" />
        <h2 className="text-3xl font-bold font-heading">Patient Dashboard</h2>
    </div>; }''',
    'src/pages/dashboards/HospitalAdminDashboard.tsx': '''export default function HospitalAdminDashboard() { return <div className="p-8">Hospital Admin Dashboard</div>; }''',
    'src/pages/dashboards/SuperAdminDashboard.tsx': '''export default function SuperAdminDashboard() { return <div className="p-8">Super Admin Dashboard</div>; }''',
    'src/pages/HospitalProfile.tsx': '''export default function HospitalProfile() { return <div className="p-8">Hospital Profile</div>; }''',
    'src/pages/MapView.tsx': '''export default function MapView() { return <div className="p-8">Map View (Leaflet will render here)</div>; }''',
}

for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Files generated successfully.')
