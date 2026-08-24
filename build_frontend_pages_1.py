import os

files = {
    'src/pages/Login.tsx': '''import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    
    if (error) {
      setError(error.message);
      return;
    }
    
    // Fetch user role to redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (data?.role === 'hospital_admin') navigate('/dashboard/hospital');
        else if (data?.role === 'super_admin') navigate('/dashboard/superadmin');
        else navigate('/dashboard/patient');
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <img src="/login_bg.jpg" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md p-8 rounded-2xl shadow-xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-heading font-bold text-primary">Welcome Back</h2>
          <p className="text-muted-foreground mt-2">Sign in to your HealthVerse account</p>
        </div>
        
        {error && <div className="p-3 mb-4 text-sm text-destructive-foreground bg-destructive/90 rounded-md">{error}</div>}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}
''',
    
    'src/pages/Register.tsx': '''import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  role: z.enum(["patient", "hospital_admin"])
});

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", full_name: "", role: "patient" },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setError("");
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name,
          role: values.role
        }
      }
    });
    
    if (error) {
      setError(error.message);
      return;
    }
    
    navigate('/login');
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <img src="/login_bg.jpg" className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md p-8 rounded-2xl shadow-xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-heading font-bold text-primary">Create Account</h2>
          <p className="text-muted-foreground mt-2">Join HealthVerse today</p>
        </div>
        
        {error && <div className="p-3 mb-4 text-sm text-destructive-foreground bg-destructive/90 rounded-md">{error}</div>}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="patient">Patient / User</SelectItem>
                      <SelectItem value="hospital_admin">Hospital Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Registering..." : "Register"}
            </Button>
          </form>
        </Form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
''',
    
    'src/pages/dashboards/PatientDashboard.tsx': '''import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Activity, Heart, Search, Map as MapIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function PatientDashboard() {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-8 text-center flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="relative min-h-screen">
      <img src="/dashboard_bg.jpg" className="absolute inset-0 w-full h-full object-cover opacity-10 dark:opacity-5 -z-10" />
      <div className="container p-8 mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-4xl font-heading font-bold">Welcome, {user.email?.split('@')[0]}</h1>
          <p className="text-muted-foreground">Here is your health resource overview.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Find Hospital</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Search</div>
              <p className="text-xs text-muted-foreground">Emergency resources</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Favorites</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Saved hospitals</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Recent searches</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Live Map</CardTitle>
              <MapIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Explore</div>
              <p className="text-xs text-muted-foreground">Nearby facilities</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
'''
}

for filepath, content in files.items():
    full_path = os.path.join('frontend', filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Auth & Patient Dashboard generated.")
