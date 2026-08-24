import { Link } from "react-router-dom";
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
