import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, MessageSquare, LogOut, Star } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const fetchLatestAward = async () => {
  const { data, error } = await supabase
    .from("awards")
    .select("name")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const fetchLatestMessage = async () => {
  const { data, error } = await supabase
    .from("messages")
    .select("content")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const fetchLatestFeatureRequest = async () => {
  const { data, error } = await supabase
    .from("feature_requests")
    .select("content")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const Index = () => {
  const [session, setSession] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate("/");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const redirectTo = searchParams.get("redirect");
      if (session && redirectTo) {
        navigate(redirectTo);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const redirectTo = searchParams.get("redirect");
      if (session && redirectTo) {
        navigate(redirectTo);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  const { data: latestAward } = useQuery({
    queryKey: ["latestAward"],
    queryFn: fetchLatestAward,
    enabled: !!session,
  });

  const { data: latestMessage } = useQuery({
    queryKey: ["latestMessage"],
    queryFn: fetchLatestMessage,
    enabled: !!session,
  });

  const { data: latestFeatureRequest } = useQuery({
    queryKey: ["latestFeatureRequest"],
    queryFn: fetchLatestFeatureRequest,
    enabled: !!session,
  });

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center w-full max-w-2xl"
        >
          <h1 className="text-3xl md:text-4xl font-light mb-4 text-[#222222]">
            Welcome to Nova Gaming
          </h1>
          <p className="text-base md:text-lg text-[#555555] mb-8">
            Join our community to participate in awards and discussions
          </p>
          <button
            onClick={() => supabase.auth.signInWithOAuth({
              provider: 'discord',
              options: {
                redirectTo: window.location.origin + (searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : "")
              }
            })}
            className="bg-[#FF4500] text-white px-6 md:px-8 py-3 rounded-full hover:bg-[#FF5722] transition-colors font-semibold text-base md:text-lg w-full md:w-auto"
          >
            Login with Discord
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#F3F3F3]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-medium text-[#222222]">Nova Gaming</h1>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-[#555555] hover:text-[#222222] hover:bg-[#E5E5E5] w-full md:w-auto"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Link to="/awards" className="block">
            <Card className="hover:border-[#FF4500] hover:shadow-md transition-all duration-200 bg-white h-full">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 md:h-6 w-5 md:w-6 text-[#FF4500]" />
                  <CardTitle className="text-lg md:text-xl text-[#222222]">Awards</CardTitle>
                </div>
                <CardDescription className="text-sm md:text-base text-[#555555]">
                  {latestAward?.name || "No awards yet"}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/messages" className="block">
            <Card className="hover:border-[#FF4500] hover:shadow-md transition-all duration-200 bg-white h-full">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 md:h-6 w-5 md:w-6 text-[#FF4500]" />
                  <CardTitle className="text-lg md:text-xl text-[#222222]">Messages</CardTitle>
                </div>
                <CardDescription className="text-sm md:text-base text-[#555555]">
                  {latestMessage?.content || "No messages yet"}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/feature-requests" className="block">
            <Card className="hover:border-[#FF4500] hover:shadow-md transition-all duration-200 bg-white h-full">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 md:h-6 w-5 md:w-6 text-[#FF4500]" />
                  <CardTitle className="text-lg md:text-xl text-[#222222]">Feature Requests</CardTitle>
                </div>
                <CardDescription className="text-sm md:text-base text-[#555555]">
                  {latestFeatureRequest?.content || "No feature requests yet"}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;