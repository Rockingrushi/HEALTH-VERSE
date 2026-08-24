import { useState } from "react";
import { useTheme } from "../components/theme-provider";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchNotificationPreferences, saveNotificationPreferences, UserNotificationPreferences } from "../lib/dataStore";
import { Bell, CheckCircle } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<UserNotificationPreferences>({
    user_id: user?.id || "user-1",
    blood_availability: true,
    icu_availability: true,
    emergency_resources: true,
    hospital_updates: true,
  });

  const { data: serverPrefs } = useQuery<UserNotificationPreferences>({
    queryKey: ["notif-prefs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => await fetchNotificationPreferences(user!.id),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await saveNotificationPreferences(user.id, prefs);
    },
    onSuccess: () => {
      setToast("Notification preferences saved successfully!");
      setTimeout(() => setToast(null), 3000);
    },
  });

  const current = serverPrefs || prefs;

  return (
    <div className="container mx-auto p-8 max-w-2xl space-y-6">
      <h1 className="text-3xl font-heading font-bold">Settings</h1>

      {toast && (
        <div className="p-4 bg-green-600 text-white rounded-xl font-medium flex items-center gap-2 text-sm shadow-md">
          <CheckCircle className="h-4 w-4" /> {toast}
        </div>
      )}

      {/* Theme Card */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label>Theme Preference</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications Card */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Email Notifications
          </CardTitle>
          <CardDescription>
            Configure your HealthVerse transactional email notifications preference.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "blood_availability", label: "Blood Availability", desc: "Notify when requested blood group units are available nearby." },
            { key: "icu_availability", label: "ICU Availability", desc: "Notify when emergency ICU bed capacity opens up." },
            { key: "emergency_resources", label: "Emergency Resources", desc: "Notify on ventilator and oxygen cylinder supply threshold updates." },
            { key: "hospital_updates", label: "Hospital Updates", desc: "Notify on hospital registration approvals and administrative updates." },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
              <div>
                <div className="font-semibold text-sm">{item.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={(current as any)[item.key] ?? true}
                onChange={(e) => {
                  const val = e.target.checked;
                  setPrefs((prev) => ({ ...prev, [item.key]: val }));
                }}
                className="h-5 w-5 accent-primary cursor-pointer"
              />
            </div>
          ))}

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="mt-2 bg-gradient-to-r from-primary to-secondary font-semibold"
          >
            {saveMutation.isPending ? "Saving…" : "Save Notification Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
