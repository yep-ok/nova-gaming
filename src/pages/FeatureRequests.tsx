import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Home, LogOut, ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface FeatureRequest {
  id: string;
  content: string;
  created_at: string;
  author: {
    discord_username: string;
  };
  _count: {
    votes: number;
  };
  has_voted?: boolean;
}

export default function FeatureRequests() {
  const [newRequest, setNewRequest] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  // Fetch feature requests
  const { data: featureRequests = [] } = useQuery<FeatureRequest[]>({
    queryKey: ["featureRequests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("feature_requests")
        .select(`
          id,
          content,
          created_at,
          author:author_id(discord_username),
          votes:feature_request_votes(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!user) return data as FeatureRequest[];

      // Get user's votes
      const { data: votes } = await supabase
        .from("feature_request_votes")
        .select("feature_request_id")
        .eq("voter_id", user.id);

      const votedIds = new Set(votes?.map(v => v.feature_request_id));

      // Transform the data to match the FeatureRequest interface
      return (data as any[]).map(request => ({
        id: request.id,
        content: request.content,
        created_at: request.created_at,
        author: request.author,
        _count: {
          votes: request.votes[0]?.count ?? 0
        },
        has_voted: votedIds.has(request.id)
      }));
    },
  });

  // Create feature request mutation
  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("feature_requests")
        .insert({
          content: newRequest,
          author_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewRequest("");
      queryClient.invalidateQueries({ queryKey: ["featureRequests"] });
      toast({
        title: "Request submitted",
        description: "Your feature request has been submitted successfully.",
      });
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ requestId, isVoting }: { requestId: string; isVoting: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (isVoting) {
        const { error } = await supabase
          .from("feature_request_votes")
          .insert({
            feature_request_id: requestId,
            voter_id: user.id,
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("feature_request_votes")
          .delete()
          .eq("feature_request_id", requestId)
          .eq("voter_id", user.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featureRequests"] });
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("feature-requests-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feature_requests",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["featureRequests"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feature_request_votes",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["featureRequests"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <Button asChild variant="outline">
          <Link to="/">
            <Home className="mr-2" />
            Home
          </Link>
        </Button>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2" />
          Sign out
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Type your feature request..."
          value={newRequest}
          onChange={(e) => setNewRequest(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newRequest.trim()) {
              createRequestMutation.mutate();
            }
          }}
        />
        <Button
          onClick={() => createRequestMutation.mutate()}
          disabled={!newRequest.trim()}
        >
          Submit
        </Button>
      </div>

      <div className="grid gap-4">
        {featureRequests?.map((request) => (
          <Card 
            key={request.id}
            className={`cursor-pointer transition-all ${
              request.has_voted 
                ? "bg-[#FF4500]/10 hover:bg-[#FF4500]/20 border-[#FF4500] shadow-lg transform hover:-translate-y-1" 
                : "hover:bg-accent"
            }`}
            onClick={() => voteMutation.mutate({ requestId: request.id, isVoting: !request.has_voted })}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className={`text-base font-normal ${request.has_voted ? "text-[#FF4500]" : ""}`}>
                  <span className="font-bold">{request.author.discord_username.split('#')[0]}: </span>
                  {request.content}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${request.has_voted ? "text-[#FF4500]" : "text-muted-foreground"}`}>
                    {request._count.votes} votes
                  </span>
                  <ThumbsUp 
                    className={request.has_voted ? "text-[#FF4500]" : "text-muted-foreground"} 
                    size={16}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}