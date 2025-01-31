import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, MessageSquare, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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

const Index = () => {
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

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

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F3F3]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center px-4 max-w-2xl w-full"
        >
          <h1 className="text-4xl font-light mb-4 text-[#222222]">
            Welcome to Nova Gaming
          </h1>
          <p className="text-lg text-[#555555] mb-8">
            Join our community to participate in awards and discussions
          </p>
          <button
            onClick={() => supabase.auth.signInWithOAuth({
              provider: 'discord',
              options: {
                redirectTo: window.location.origin + (searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : "")
              }
            })}
            className="bg-[#FF4500] text-white px-8 py-3 rounded-full hover:bg-[#FF5722] transition-colors font-semibold text-lg"
          >
            Login with Discord
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-[#F3F3F3]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-medium text-[#222222]">Nova Gaming</h1>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-[#555555] hover:text-[#222222] hover:bg-[#E5E5E5]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/awards">
            <Card className="hover:border-[#FF4500] hover:shadow-md transition-all duration-200 bg-white">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-6 w-6 text-[#FF4500]" />
                  <CardTitle className="text-[#222222]">Awards</CardTitle>
                </div>
                <CardDescription className="text-[#555555]">
                  {latestAward?.name || "No awards yet"}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/messages">
            <Card className="hover:border-[#FF4500] hover:shadow-md transition-all duration-200 bg-white">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-6 w-6 text-[#FF4500]" />
                  <CardTitle className="text-[#222222]">Messages</CardTitle>
                </div>
                <CardDescription className="text-[#555555]">
                  {latestMessage?.content || "No messages yet"}
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