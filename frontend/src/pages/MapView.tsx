import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Link } from "react-router-dom";
import L from "leaflet";
import { Search, MapPin, Clock, Bed, Navigation, Heart, Compass, Phone, Activity, Ambulance, Droplets } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchHospitals, calculateDistance, Hospital } from "../lib/dataStore";

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

function MapCenterController({ position, zoom }: { position: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(position, zoom); }, [position, zoom, map]);
  return null;
}

export default function MapView() {
  const [selected, setSelected] = useState<Hospital | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "beds" | "icu" | "oxygen" | "blood" | "ambulance" | "pharmacy">("all");
  const [mapCenter, setMapCenter] = useState<[number, number]>(INDIA_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(DEFAULT_ZOOM);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  // Fetch approved hospitals from dataStore (real DB / persistent store)
  const { data: rawHospitals = [] } = useQuery<Hospital[]>({
    queryKey: ["hospitals"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: fetchHospitals,
  });

  // Filter approved hospitals
  const approvedHospitals = rawHospitals.filter((h) => h.is_approved);

  // Detect Geolocation on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userPos);
          setMapCenter(userPos);
          setMapZoom(12);
          setLocating(false);
        },
        () => {
          setMapCenter(INDIA_CENTER);
          setMapZoom(DEFAULT_ZOOM);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  const handleLocateUser = () => {
    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userPos);
          setMapCenter(userPos);
          setMapZoom(12);
          setLocating(false);
        },
        () => {
          alert("Location permission was denied. Showing India map.");
          setMapCenter(INDIA_CENTER);
          setMapZoom(DEFAULT_ZOOM);
          setLocating(false);
        }
      );
    }
  };

  // Filter & calculate distance
  const processed = approvedHospitals
    .map((h) => {
      const lat = h.latitude ?? 20.5937;
      const lng = h.longitude ?? 78.9629;
      let dist = 0;
      if (userLocation) {
        dist = calculateDistance(userLocation[0], userLocation[1], lat, lng);
      }
      return { ...h, lat, lng, dist };
    })
    .filter((h) => {
      const q = search.toLowerCase();
      const matchSearch =
        h.name.toLowerCase().includes(q) ||
        (h.address && h.address.toLowerCase().includes(q)) ||
        (h.city && h.city.toLowerCase().includes(q)) ||
        (h.state && h.state.toLowerCase().includes(q));
      return matchSearch;
    });

  // Sort by distance if user location is available
  if (userLocation) {
    processed.sort((a, b) => a.dist - b.dist);
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row">
      {/* ── Sidebar ── */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full md:w-[420px] flex flex-col bg-background border-r border-border overflow-hidden z-20 shadow-xl"
      >
        {/* Search header */}
        <div className="p-4 border-b bg-gradient-to-br from-primary/5 to-accent/5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> India Hospital Map
            </h2>
            <Button size="sm" variant="outline" onClick={handleLocateUser} disabled={locating} className="text-xs gap-1">
              <Compass className={`h-3.5 w-3.5 ${locating ? "animate-spin text-primary" : ""}`} />
              {locating ? "Locating…" : "My Location"}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search hospital name, city, state…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {(["all", "beds", "icu", "ambulance", "blood", "pharmacy"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className="capitalize text-xs px-2.5 h-7 shrink-0"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Hospital list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {processed.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
              No approved hospitals match your search.
            </div>
          )}
          {processed.map((h) => (
            <motion.div
              key={h.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                setSelected(h);
                setMapCenter([h.lat, h.lng]);
                setMapZoom(14);
              }}
              className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${selected?.id === h.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-card"}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-sm leading-tight">{h.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {h.city && <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{h.city}</span>}
                    {userLocation && h.dist > 0 && <span className="text-[11px] text-muted-foreground">📍 {h.dist} km away</span>}
                  </div>
                </div>
                <Badge variant="default" className="text-xs shrink-0">Live</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />{h.address}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center bg-muted/50 rounded-lg p-2">
                  <Bed className="h-3 w-3 text-primary mx-auto mb-0.5" />
                  <div className="text-xs font-bold">Available</div>
                  <div className="text-[10px] text-muted-foreground">Beds</div>
                </div>
                <div className="text-center bg-muted/50 rounded-lg p-2">
                  <Clock className="h-3 w-3 text-orange-500 mx-auto mb-0.5" />
                  <div className="text-xs font-bold">15m</div>
                  <div className="text-[10px] text-muted-foreground">Wait</div>
                </div>
                <div className="text-center bg-muted/50 rounded-lg p-2">
                  <Heart className="h-3 w-3 text-yellow-500 mx-auto mb-0.5" />
                  <div className="text-xs font-bold">4.8</div>
                  <div className="text-[10px] text-muted-foreground">Rating</div>
                </div>
              </div>
              <Link to={`/hospitals/${h.id}`}>
                <Button variant="default" size="sm" className="w-full mt-1 h-8 text-xs bg-gradient-to-r from-primary to-secondary">
                  View Details <Navigation className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Selected hospital quick info */}
        {selected && (
          <div className="p-4 border-t bg-primary/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-primary">Selected: {selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.contact_phone || "Emergency Line"}</p>
            </div>
            <Link to={`/hospitals/${selected.id}`}>
              <Button size="sm" className="text-xs bg-primary">Open →</Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        <MapContainer center={INDIA_CENTER} zoom={DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }} zoomControl={true}>
          <MapCenterController position={selected ? [selected.latitude || 20.5937, selected.longitude || 78.9629] : mapCenter} zoom={selected ? 14 : mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup>
                <div className="text-center font-bold text-sm text-destructive p-1">
                  📍 You are Here
                </div>
              </Popup>
            </Marker>
          )}

          {/* Hospital Markers */}
          {processed.map((h) => (
            <Marker
              key={h.id}
              position={[h.lat, h.lng]}
              icon={hospitalIcon}
              eventHandlers={{
                click: () => {
                  setSelected(h);
                  setMapCenter([h.lat, h.lng]);
                  setMapZoom(14);
                }
              }}
            >
              <Popup>
                <div className="min-w-[220px] p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{h.city || "India"}</span>
                    <Badge variant="default" className="text-[10px] bg-green-600">✓ Approved</Badge>
                  </div>
                  <h3 className="font-bold text-sm leading-tight">{h.name}</h3>
                  <p className="text-xs text-gray-500">{h.address}</p>
                  <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-primary" /> {h.contact_phone || "+91 98765 43210"}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-gray-50 p-2 rounded-lg">
                    <span className="flex items-center gap-1"><Bed className="h-3 w-3 text-primary" /> Beds: Open</span>
                    <span className="flex items-center gap-1"><Activity className="h-3 w-3 text-blue-600" /> ICU: Yes</span>
                    <span className="flex items-center gap-1"><Droplets className="h-3 w-3 text-red-600" /> Blood: Avail</span>
                    <span className="flex items-center gap-1"><Ambulance className="h-3 w-3 text-green-600" /> Amb: Ready</span>
                  </div>
                  <Link to={`/hospitals/${h.id}`} className="block text-center text-xs bg-teal-700 text-white py-1.5 rounded-md font-semibold hover:bg-teal-800 transition-colors mt-2">
                    View Details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
