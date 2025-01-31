import { Link, useNavigate } from "react-router-dom";
import { Award, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AwardHeader() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate("/");
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link to="/">
            <Home className="mr-2" />
            Home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/suggested-awards">
            <Award className="mr-2" />
            Suggested Awards
          </Link>
        </Button>
      </div>
      <Button variant="outline" onClick={handleLogout}>
        <LogOut className="mr-2" />
        Sign out
      </Button>
    </div>
  );
}