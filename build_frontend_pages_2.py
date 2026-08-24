import os

files = {
    'src/pages/dashboards/HospitalAdminDashboard.tsx': '''import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { motion } from "framer-motion";

export default function HospitalAdminDashboard() {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-8 text-center flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="relative min-h-screen">
      <div className="container p-8 mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-primary">Hospital Administration</h1>
          <p className="text-muted-foreground">Manage your hospital resources and availability.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Resource Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Available Beds</label>
                  <Input type="number" defaultValue="45" />
                </div>
                <div>
                  <label className="text-sm font-medium">ICU Beds</label>
                  <Input type="number" defaultValue="5" />
                </div>
                <div>
                  <label className="text-sm font-medium">Ventilators</label>
                  <Input type="number" defaultValue="12" />
                </div>
                <div>
                  <label className="text-sm font-medium">Oxygen Cylinders</label>
                  <Input type="number" defaultValue="100" />
                </div>
              </div>
              <Button className="w-full">Update Resources</Button>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Blood Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">A+ (Units)</label>
                  <Input type="number" defaultValue="20" />
                </div>
                <div>
                  <label className="text-sm font-medium">O- (Units)</label>
                  <Input type="number" defaultValue="8" />
                </div>
              </div>
              <Button className="w-full">Update Blood Bank</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
''',
    
    'src/pages/dashboards/SuperAdminDashboard.tsx': '''import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { motion } from "framer-motion";

export default function SuperAdminDashboard() {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="container p-8 mx-auto min-h-screen">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-destructive">Super Admin Portal</h1>
        <p className="text-muted-foreground">System overview and hospital approvals.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle>Total Hospitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">124</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary">
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">8,592</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-destructive">12</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 p-8 border rounded-xl bg-card">
          <h2 className="text-xl font-bold mb-4">Pending Hospital Registrations</h2>
          <div className="text-center text-muted-foreground py-8">
              No pending registrations at the moment.
          </div>
      </div>
    </div>
  );
}
''',
    
    'src/pages/HospitalProfile.tsx': '''import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Phone, MapPin, Clock, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function HospitalProfile() {
  const { id } = useParams();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8 shadow-lg">
          <div className="absolute inset-0 bg-primary/20"></div>
          <div className="absolute bottom-0 left-0 p-8 w-full bg-gradient-to-t from-black/80 to-transparent">
              <h1 className="text-3xl md:text-5xl font-heading font-bold text-white">City General Hospital</h1>
              <p className="text-white/80 mt-2 flex items-center gap-2"><MapPin className="h-4 w-4"/> 123 Healthcare Ave, NY</p>
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
                  <h2 className="text-2xl font-bold mb-4">About</h2>
                  <p className="text-muted-foreground leading-relaxed">
                      City General Hospital is a state-of-the-art facility providing comprehensive healthcare services to the community. 
                      Equipped with modern technology and staffed by experienced professionals, we ensure the best care for our patients.
                  </p>
              </motion.div>
              
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}}>
                  <h2 className="text-2xl font-bold mb-4">Emergency Resources</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Card className="text-center p-4 bg-primary/5 border-primary/20">
                          <div className="text-3xl font-bold text-primary">12</div>
                          <div className="text-xs text-muted-foreground mt-1">Available Beds</div>
                      </Card>
                      <Card className="text-center p-4 bg-destructive/5 border-destructive/20">
                          <div className="text-3xl font-bold text-destructive">2</div>
                          <div className="text-xs text-muted-foreground mt-1">ICU Beds</div>
                      </Card>
                      <Card className="text-center p-4 bg-secondary/5 border-secondary/20">
                          <div className="text-3xl font-bold text-secondary">5</div>
                          <div className="text-xs text-muted-foreground mt-1">Ambulances</div>
                      </Card>
                      <Card className="text-center p-4 bg-accent/5 border-accent/20">
                          <div className="text-3xl font-bold text-accent">8</div>
                          <div className="text-xs text-muted-foreground mt-1">Ventilators</div>
                      </Card>
                  </div>
              </motion.div>
          </div>
          
          <div className="space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle>Contact Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full text-primary"><Phone className="h-4 w-4"/></div>
                          <span>+1 (555) 123-4567</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full text-primary"><Clock className="h-4 w-4"/></div>
                          <span>24/7 Emergency</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full text-primary"><Activity className="h-4 w-4"/></div>
                          <span>15 min wait time</span>
                      </div>
                  </CardContent>
              </Card>
              
              <Card>
                  <CardHeader>
                      <CardTitle>Blood Bank</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="border-destructive text-destructive">O+ (12 units)</Badge>
                          <Badge variant="outline" className="border-destructive text-destructive">A- (4 units)</Badge>
                          <Badge variant="outline" className="border-destructive text-destructive">B+ (8 units)</Badge>
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
}
''',

    'src/pages/MapView.tsx': '''import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import L from "leaflet";

// Fix for default leaflet icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapView() {
  const [position, setPosition] = useState<[number, number]>([40.7128, -74.0060]); // Default to NY
  const [hospitals, setHospitals] = useState<any[]>([]);

  useEffect(() => {
    // Mock data for UI demonstration until API is fully wired
    setHospitals([
        { id: "1", name: "City General", lat: 40.7128, lng: -74.0060, beds: 12 },
        { id: "2", name: "Metro Healthcare", lat: 40.7200, lng: -74.0100, beds: 5 },
    ]);
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] relative flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-96 bg-background border-r border-border p-4 flex flex-col gap-4 overflow-y-auto z-10 shadow-xl">
          <h2 className="text-2xl font-bold font-heading">Emergency Search</h2>
          <div className="space-y-4">
              {hospitals.map(h => (
                  <Card key={h.id} className="p-4 hover:border-primary transition-colors cursor-pointer">
                      <h3 className="font-bold">{h.name}</h3>
                      <p className="text-sm text-muted-foreground">{h.beds} Available Beds</p>
                      <Link to={`/hospitals/${h.id}`}>
                          <Button variant="outline" size="sm" className="mt-2 w-full">View Details</Button>
                      </Link>
                  </Card>
              ))}
          </div>
      </div>
      
      {/* Map */}
      <div className="flex-1 h-full z-0">
          <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hospitals.map(h => (
                <Marker key={h.id} position={[h.lat, h.lng]}>
                    <Popup>
                        <div className="font-bold">{h.name}</div>
                        <div>Beds: {h.beds}</div>
                        <Link to={`/hospitals/${h.id}`} className="text-primary text-sm hover:underline">Details</Link>
                    </Popup>
                </Marker>
            ))}
          </MapContainer>
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

print("Dashboards and Map generated.")
