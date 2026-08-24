import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { motion } from "framer-motion";
import { ArrowLeft, Bed, Clock, Ambulance, Activity, Droplets, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchHospitals, fetchHospitalResources, fetchBloodInventory, fetchAmbulances } from "../lib/dataStore";

export default function HospitalComparison() {
  const { data: rawHospitals = [], isLoading } = useQuery({
    queryKey: ["hospitals"],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: fetchHospitals,
  });

  const approvedHospitals = rawHospitals.filter((h) => h.is_approved).slice(0, 3);

  const { data: resourcesMap = {} } = useQuery({
    queryKey: ["compare-resources", approvedHospitals.map(h => h.id).join(",")],
    enabled: approvedHospitals.length > 0,
    queryFn: async () => {
      const map: Record<string, any> = {};
      for (const h of approvedHospitals) {
        map[h.id] = await fetchHospitalResources(h.id);
      }
      return map;
    },
  });

  const { data: bloodMap = {} } = useQuery({
    queryKey: ["compare-blood", approvedHospitals.map(h => h.id).join(",")],
    enabled: approvedHospitals.length > 0,
    queryFn: async () => {
      const map: Record<string, string[]> = {};
      for (const h of approvedHospitals) {
        const rows = await fetchBloodInventory(h.id);
        map[h.id] = rows.filter(r => r.units_available > 0).map(r => r.blood_group);
      }
      return map;
    },
  });

  const { data: ambMap = {} } = useQuery({
    queryKey: ["compare-amb", approvedHospitals.map(h => h.id).join(",")],
    enabled: approvedHospitals.length > 0,
    queryFn: async () => {
      const map: Record<string, boolean> = {};
      for (const h of approvedHospitals) {
        const rows = await fetchAmbulances(h.id);
        map[h.id] = rows.length > 0;
      }
      return map;
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const bestHospital = approvedHospitals.reduce((prev, curr) => {
    const prevBeds = resourcesMap[prev?.id]?.available_beds ?? 0;
    const currBeds = resourcesMap[curr?.id]?.available_beds ?? 0;
    return currBeds > prevBeds ? curr : prev;
  }, approvedHospitals[0]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link to="/map">
          <Button variant="ghost" className="mb-4 gap-2"><ArrowLeft className="h-4 w-4" /> Back to Map</Button>
        </Link>
        <h1 className="text-3xl font-heading font-bold">Compare Hospitals</h1>
        <p className="text-muted-foreground mt-1">Side-by-side real-time resource comparison to make the right choice</p>
      </motion.div>

      {approvedHospitals.length === 0 ? (
        <Card className="p-8 text-center glass">
          <p className="text-muted-foreground">No approved hospitals currently available for comparison.</p>
        </Card>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass overflow-hidden shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Live Comparison
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2">
                      <TableHead className="w-[200px] font-bold">Feature</TableHead>
                      {approvedHospitals.map((h) => {
                        const res = resourcesMap[h.id];
                        const status = (res?.available_beds ?? 0) > 5 ? "Beds Open" : (res?.available_beds ?? 0) > 0 ? "Limited" : "Full";
                        return (
                          <TableHead key={h.id} className="text-center min-w-[180px]">
                            <div className="space-y-2">
                              <Link to={`/hospitals/${h.id}`} className="font-bold text-foreground hover:text-primary transition-colors block">
                                {h.name}
                              </Link>
                              <Badge variant={(res?.available_beds ?? 0) > 5 ? "default" : (res?.available_beds ?? 0) > 0 ? "secondary" : "destructive"}>
                                {status}
                              </Badge>
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 text-muted-foreground"><Bed className="h-4 w-4" /> Available Beds</div>
                      </TableCell>
                      {approvedHospitals.map((h) => (
                        <TableCell key={h.id} className="text-center font-semibold">{resourcesMap[h.id]?.available_beds ?? "—"}</TableCell>
                      ))}
                    </TableRow>

                    <TableRow className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 text-muted-foreground"><Activity className="h-4 w-4" /> ICU Beds</div>
                      </TableCell>
                      {approvedHospitals.map((h) => (
                        <TableCell key={h.id} className="text-center font-semibold">{resourcesMap[h.id]?.icu_beds ?? "—"}</TableCell>
                      ))}
                    </TableRow>

                    <TableRow className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> Wait Time (min)</div>
                      </TableCell>
                      {approvedHospitals.map((h) => (
                        <TableCell key={h.id} className="text-center font-semibold">{resourcesMap[h.id]?.waiting_time_minutes ?? "—"}</TableCell>
                      ))}
                    </TableRow>

                    <TableRow className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 text-muted-foreground"><Ambulance className="h-4 w-4" /> Ambulance</div>
                      </TableCell>
                      {approvedHospitals.map((h) => (
                        <TableCell key={h.id} className="text-center">
                          {ambMap[h.id]
                            ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            : <XCircle className="h-5 w-5 text-destructive mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>

                    <TableRow className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle className="h-4 w-4" /> Pharmacy Open</div>
                      </TableCell>
                      {approvedHospitals.map((h) => (
                        <TableCell key={h.id} className="text-center">
                          {resourcesMap[h.id]?.pharmacy_status ?? true
                            ? <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            : <XCircle className="h-5 w-5 text-destructive mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Blood groups row */}
                    <TableRow className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Droplets className="h-4 w-4" /> Blood Groups
                        </div>
                      </TableCell>
                      {approvedHospitals.map((h) => (
                        <TableCell key={h.id} className="text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {(bloodMap[h.id] ?? []).length > 0 ? (
                              bloodMap[h.id].map((b) => (
                                <Badge key={b} variant="outline" className="text-xs border-destructive/50 text-destructive">{b}</Badge>
                              ))
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Action row */}
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Actions</TableCell>
                      {approvedHospitals.map((h) => (
                        <TableCell key={h.id} className="text-center py-4">
                          <Link to={`/hospitals/${h.id}`}>
                            <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-xs">
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>

          {/* Recommendation */}
          {bestHospital && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
              <Card className="glass border-primary/30 bg-primary/5">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Recommended: {bestHospital.name}</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Highest available beds ({resourcesMap[bestHospital.id]?.available_beds ?? 0}) and verified real-time emergency healthcare resources.
                    </p>
                  </div>
                  <Link to={`/hospitals/${bestHospital.id}`} className="shrink-0">
                    <Button className="bg-gradient-to-r from-primary to-secondary">Go →</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
