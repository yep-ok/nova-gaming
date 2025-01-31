import { Link, useNavigate } from "react-router-dom";
import { Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export function NavigationButtons() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
        <Button asChild variant="outline" className="w-full md:w-auto justify-center">
          <Link to="/">
            <Home className="mr-2" />
            {!isMobile && "Home"}
          </Link>
        </Button>
      </div>
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto">
        <Button variant="outline" onClick={handleLogout} className="w-full md:w-auto justify-center">
          <LogOut className="mr-2" />
          {!isMobile && "Sign out"}
        </Button>
      </div>
    </div>
  );
}