import { Card, CardContent } from "../components/ui/card";
import { Heart, MapPin, Building2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchHospitals } from "../lib/dataStore";

export default function Favorites() {
  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: fetchHospitals,
  });

  const savedHospitals = hospitals.filter((h) => h.is_approved).slice(0, 3);

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <h1 className="text-3xl font-heading font-bold mb-8 flex items-center gap-2">
        <Heart className="text-destructive fill-destructive" /> Saved Hospitals
      </h1>

      {savedHospitals.length === 0 ? (
        <Card className="p-8 text-center glass">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No saved favorite hospitals yet.</p>
          <Link to="/map">
            <Button className="mt-4">Explore India Map</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedHospitals.map((h) => (
            <Card key={h.id} className="glass overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
                {h.banner_url ? (
                  <img src={h.banner_url} alt={h.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="h-12 w-12 text-primary opacity-60" />
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="text-xl font-bold line-clamp-1">{h.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 line-clamp-1">
                  <MapPin className="h-3 w-3 shrink-0" /> {h.address}
                </p>
                <div className="mt-4 flex gap-2">
                  <Link to={`/hospitals/${h.id}`} className="flex-1">
                    <Button variant="default" className="w-full">View Details</Button>
                  </Link>
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4 fill-destructive text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
