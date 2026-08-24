import { useAuth } from "../hooks/useAuth";
import { Card, CardContent } from "../components/ui/card";
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
