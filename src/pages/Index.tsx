import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center px-4"
        >
          <h1 className="text-4xl font-light mb-4 text-foreground">
            Welcome to Nova Gaming
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Please login to continue
          </p>
          <button
            onClick={() => supabase.auth.signInWithOAuth({
              provider: 'discord',
              options: {
                redirectTo: window.location.origin
              }
            })}
            className="bg-[#5865F2] text-white px-6 py-2 rounded-md hover:bg-[#4752C4] transition-colors"
          >
            Login with Discord
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-light mb-8 text-foreground">Nova Gaming</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/awards">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-6 w-6" />
                  <CardTitle>Awards</CardTitle>
                </div>
                <CardDescription>
                  {latestAward?.name || "No awards yet"}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/messages">
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-6 w-6" />
                  <CardTitle>Messages</CardTitle>
                </div>
                <CardDescription>
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