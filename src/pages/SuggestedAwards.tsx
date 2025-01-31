import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Home, Award, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface SuggestedAward {
  id: string;
  name: string;
  description: string;
  _count: {
    votes: number;
  };
  has_voted?: boolean;
}

export default function SuggestedAwards() {
  const [showNewAwardForm, setShowNewAwardForm] = useState(false);
  const [newAwardName, setNewAwardName] = useState("");
  const [newAwardDescription, setNewAwardDescription] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  // Fetch suggested awards and user votes
  const { data: suggestedAwards } = useQuery({
    queryKey: ["suggestedAwards"],
    queryFn: async () => {
      if (!session?.user) return [];

      const { data: awards, error: awardsError } = await supabase
        .from("awards")
        .select(`
          id,
          name,
          description,
          award_votes(count)
        `)
        .eq("status", "suggested");

      if (awardsError) throw awardsError;

      // Fetch user's votes
      const { data: userVotes, error: votesError } = await supabase
        .from("award_votes")
        .select("award_id")
        .eq("voter_id", session.user.id);

      if (votesError) throw votesError;

      const userVotedAwards = new Set(userVotes?.map(vote => vote.award_id));

      return awards?.map(award => ({
        id: award.id,
        name: award.name,
        description: award.description,
        _count: {
          votes: award.award_votes?.[0]?.count || 0
        },
        has_voted: userVotedAwards.has(award.id)
      })) as SuggestedAward[];
    },
    enabled: !!session?.user,
  });

  // Create new award mutation
  const createAwardMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user) {
        navigate("/auth");
        throw new Error("Not authenticated");
      }

      const { error } = await supabase
        .from("awards")
        .insert({
          name: newAwardName,
          description: newAwardDescription,
          created_by: session.user.id,
          status: "suggested"
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestedAwards"] });
      setShowNewAwardForm(false);
      setNewAwardName("");
      setNewAwardDescription("");
      toast({
        title: "Award suggested",
        description: "Your award has been successfully suggested.",
      });
    },
    onError: (error) => {
      if (error.message === "Not authenticated") {
        toast({
          title: "Authentication required",
          description: "Please log in to suggest awards.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to suggest award. Please try again.",
          variant: "destructive",
        });
      }
      console.error("Error creating award:", error);
    },
  });

  // Vote for award mutation
  const voteForAwardMutation = useMutation({
    mutationFn: async (awardId: string) => {
      if (!session?.user) {
        navigate("/auth");
        throw new Error("Not authenticated");
      }

      const { error } = await supabase
        .from("award_votes")
        .insert({
          award_id: awardId,
          voter_id: session.user.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already voted",
            description: "You have already voted for this award.",
          });
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestedAwards"] });
      toast({
        title: "Vote recorded",
        description: "Your vote has been successfully recorded.",
      });
    },
    onError: (error) => {
      if (error.message === "Not authenticated") {
        toast({
          title: "Authentication required",
          description: "Please log in to vote for awards.",
          variant: "destructive",
        });
      } else if (error.code !== '23505') {
        toast({
          title: "Error",
          description: "Failed to record vote. Please try again.",
          variant: "destructive",
        });
        console.error("Error voting for award:", error);
      }
    },
  });

  const handleSubmitAward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAwardName || !newAwardDescription) {
      toast({
        title: "Error",
        description: "Please fill in both name and description.",
        variant: "destructive",
      });
      return;
    }
    createAwardMutation.mutate();
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link to="/">
              <Home className="mr-2" />
              Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/awards">
              <Award className="mr-2" />
              Accepted Awards
            </Link>
          </Button>
        </div>
        <Button onClick={() => setShowNewAwardForm(true)}>
          <Plus className="mr-2" />
          New Award
        </Button>
      </div>

      <AnimatePresence>
        {showNewAwardForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Suggest New Award</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewAwardForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitAward} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Award name"
                      value={newAwardName}
                      onChange={(e) => setNewAwardName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Award description"
                      value={newAwardDescription}
                      onChange={(e) => setNewAwardDescription(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!newAwardName || !newAwardDescription || createAwardMutation.isPending}
                  >
                    Submit Award
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {suggestedAwards?.map((award) => (
          <Card
            key={award.id}
            className={`cursor-pointer transition-colors ${
              award.has_voted 
                ? "bg-accent/50 hover:bg-accent/60" 
                : "hover:bg-accent"
            }`}
            onClick={() => !award.has_voted && voteForAwardMutation.mutate(award.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{award.name}</CardTitle>
                <CardDescription>
                  {award._count.votes} / 3 votes
                </CardDescription>
              </div>
              <CardDescription>{award.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}