import { Card } from "../components/ui/card";
import { Bell } from "lucide-react";

export default function Notifications() {
  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-heading font-bold mb-8 flex items-center gap-2"><Bell /> Notifications</h1>
      <div className="space-y-4">
        <Card className="p-4 border-l-4 border-l-primary glass">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold">Bed Availability Alert</h4>
              <p className="text-sm text-muted-foreground mt-1">Yashoda Hospitals - Hitec City updated critical ICU bed capacity.</p>
            </div>
            <span className="text-xs text-muted-foreground">10m ago</span>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-accent glass">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold">Welcome to HealthVerse</h4>
              <p className="text-sm text-muted-foreground mt-1">Real-time emergency healthcare monitoring & resource tracking platform across India.</p>
            </div>
            <span className="text-xs text-muted-foreground">1d ago</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
