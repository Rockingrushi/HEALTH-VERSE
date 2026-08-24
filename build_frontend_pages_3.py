import os

files = {
    'src/pages/HospitalComparison.tsx': '''import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";

export default function HospitalComparison() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-heading font-bold mb-8">Compare Hospitals</h1>
      <Card className="glass overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Feature</TableHead>
              <TableHead>City General</TableHead>
              <TableHead>Metro Healthcare</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Available Beds</TableCell>
              <TableCell className="text-primary font-bold">12</TableCell>
              <TableCell className="text-destructive font-bold">0</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">ICU Beds</TableCell>
              <TableCell>2</TableCell>
              <TableCell>5</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Ambulance Status</TableCell>
              <TableCell><Badge>Available</Badge></TableCell>
              <TableCell><Badge variant="destructive">En Route</Badge></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Wait Time</TableCell>
              <TableCell>15 mins</TableCell>
              <TableCell>45 mins</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
''',

    'src/pages/Notifications.tsx': '''import { Card, CardContent } from "../components/ui/card";
import { Bell } from "lucide-react";

export default function Notifications() {
  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-heading font-bold mb-8 flex items-center gap-2"><Bell /> Notifications</h1>
      <div className="space-y-4">
          <Card className="p-4 border-l-4 border-l-primary">
              <div className="flex justify-between items-start">
                  <div>
                      <h4 className="font-bold">Bed Availability Alert</h4>
                      <p className="text-sm text-muted-foreground mt-1">City General just updated their ICU bed count to 5.</p>
                  </div>
                  <span className="text-xs text-muted-foreground">10m ago</span>
              </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-accent">
              <div className="flex justify-between items-start">
                  <div>
                      <h4 className="font-bold">Welcome to HealthVerse</h4>
                      <p className="text-sm text-muted-foreground mt-1">Please complete your profile.</p>
                  </div>
                  <span className="text-xs text-muted-foreground">1d ago</span>
              </div>
          </Card>
      </div>
    </div>
  );
}
''',

    'src/pages/Favorites.tsx': '''import { Card, CardContent } from "../components/ui/card";
import { Heart, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Favorites() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-heading font-bold mb-8 flex items-center gap-2"><Heart className="text-destructive"/> Saved Hospitals</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="glass overflow-hidden hover:shadow-lg transition-shadow">
              <img src="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=2072&auto=format&fit=crop" alt="Hospital" className="w-full h-40 object-cover" />
              <CardContent className="p-4">
                  <h3 className="text-xl font-bold">City General</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3"/> Downtown</p>
                  <div className="mt-4 flex gap-2">
                      <Button variant="default" className="flex-1">View Live</Button>
                      <Button variant="outline" size="icon"><Heart className="h-4 w-4 fill-destructive text-destructive"/></Button>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
''',

    'src/pages/Settings.tsx': '''import { useTheme } from "../components/theme-provider";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-heading font-bold mb-8">Settings</h1>
      <Card>
        <CardHeader>
            <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
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
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
''',

    'src/pages/Profile.tsx': '''import { useAuth } from "../hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";

export default function Profile() {
  const { user, signOut } = useAuth();
  
  if (!user) return <div className="p-8">Please login</div>;

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-heading font-bold mb-8">My Profile</h1>
      <Card className="glass">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-24 w-24">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} />
                  <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left flex-1">
                  <h2 className="text-2xl font-bold">{user.email}</h2>
                  <p className="text-muted-foreground">{user.id}</p>
                  <Button variant="destructive" className="mt-4" onClick={() => signOut()}>Sign Out</Button>
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
''',

    'src/pages/NotFound.tsx': '''import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background">
        <h1 className="text-9xl font-heading font-bold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-bold mb-4">Oops! Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link to="/">
            <Button size="lg">Return to Home</Button>
        </Link>
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

print("Remaining pages generated.")
