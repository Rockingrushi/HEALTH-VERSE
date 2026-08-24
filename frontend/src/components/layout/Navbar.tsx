import { Link } from "react-router-dom";
import { useTheme } from "../theme-provider";
import { Moon, Sun, MapPin, User as UserIcon, LogOut, Shield, Activity } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const role = user?.user_metadata?.role || (user?.email?.includes("super") ? "super_admin" : user?.email?.includes("admin") ? "hospital_admin" : "patient");

  const dashboardLink = role === "hospital_admin"
    ? "/dashboard/hospital"
    : role === "super_admin"
    ? "/dashboard/superadmin"
    : "/dashboard/patient";

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-heading font-bold text-2xl text-primary">HealthVerse</span>
          </Link>
          <Link to="/map" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <MapPin className="h-4 w-4" /> India Map
          </Link>
          <Link to="/compare" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:inline">
            Compare Hospitals
          </Link>
          <Link to="/alerts" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden md:inline flex items-center gap-1">
            Alerts
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to={dashboardLink}>
                <Button variant="outline" size="sm" className="gap-1.5 font-semibold">
                  <Shield className="h-4 w-4 text-primary" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserIcon className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
                Login
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-primary text-primary-foreground font-semibold">
                  Register
                </Button>
              </Link>
            </>
          )}

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}