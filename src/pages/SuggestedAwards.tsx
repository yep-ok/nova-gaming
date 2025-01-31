import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PostgrestError } from "@supabase/supabase-js";
import { NavigationButtons } from "@/components/suggested-awards/NavigationButtons";
import { NewAwardForm } from "@/components/suggested-awards/NewAwardForm";
import { AwardCard } from "@/components/suggested-awards/AwardCard";

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

  // Toggle vote mutation
  const toggleVoteMutation = useMutation({
    mutationFn: async (awardId: string) => {
      if (!session?.user) {
        navigate("/auth");
        throw new Error("Not authenticated");
      }

      const award = suggestedAwards?.find(a => a.id === awardId);
      if (!award) throw new Error("Award not found");

      if (award.has_voted) {
        // Remove vote
        const { error } = await supabase
          .from("award_votes")
          .delete()
          .eq("award_id", awardId)
          .eq("voter_id", session.user.id);

        if (error) throw error;
      } else {
        // Add vote
        const { error } = await supabase
          .from("award_votes")
          .insert({
            award_id: awardId,
            voter_id: session.user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, awardId) => {
      queryClient.invalidateQueries({ queryKey: ["suggestedAwards"] });
      const award = suggestedAwards?.find(a => a.id === awardId);
      toast({
        title: award?.has_voted ? "Vote removed" : "Vote recorded",
        description: award?.has_voted 
          ? "Your vote has been successfully removed." 
          : "Your vote has been successfully recorded.",
      });
    },
    onError: (error: Error | PostgrestError) => {
      if (error instanceof Error) {
        if (error.message === "Not authenticated") {
          toast({
            title: "Authentication required",
            description: "Please log in to vote for awards.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to process vote. Please try again.",
            variant: "destructive",
          });
        }
      }
      console.error("Error processing vote:", error);
    },
  });

  return (
    <div className="container py-8 space-y-6">
      <NavigationButtons onNewAward={() => setShowNewAwardForm(true)} />

      <AnimatePresence>
        {showNewAwardForm && (
          <NewAwardForm
            showForm={showNewAwardForm}
            onClose={() => setShowNewAwardForm(false)}
            userId={session?.user?.id || ""}
          />
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {suggestedAwards?.map((award) => (
          <AwardCard
            key={award.id}
            award={award}
            onClick={() => toggleVoteMutation.mutate(award.id)}
          />
        ))}
      </div>
    </div>
  );
}