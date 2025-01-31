import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AwardHeader } from "@/components/awards/AwardHeader";
import { AwardCard } from "@/components/awards/AwardCard";

interface AwardData {
  id: string;
  name: string;
  description: string;
  created_at: string;
  accepted_at: string | null;
}

interface NomineeData {
  id: string;
  nominee: {
    discord_username: string;
    id: string;
  };
  _count: {
    votes: number;
  };
  has_voted?: boolean;
}

interface UserData {
  id: string;
  discord_username: string;
}

export default function Awards() {
  const [expandedAward, setExpandedAward] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch user session
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  // Fetch accepted awards
  const { data: awards } = useQuery({
    queryKey: ["acceptedAwards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("awards")
        .select("id, name, description, created_at, accepted_at")
        .eq("status", "accepted")
        .order('accepted_at', { ascending: false, nullsLast: true });

      if (error) throw error;
      return data as AwardData[];
    },
  });

  const { data: nominees } = useQuery({
    queryKey: ["nominees", expandedAward],
    queryFn: async () => {
      if (!expandedAward) return null;

      const { data, error } = await supabase
        .from("nominees")
        .select(`
          id,
          nominee:nominee_id(id, discord_username),
          nominee_votes(count)
        `)
        .eq("award_id", expandedAward);

      if (error) throw error;

      // Get user's votes only if authenticated
      let userVotedNominees = new Set<string>();
      if (session?.user) {
        const { data: userVotes } = await supabase
          .from("nominee_votes")
          .select("nominee_id")
          .eq("voter_id", session.user.id);

        userVotedNominees = new Set(userVotes?.map(vote => vote.nominee_id) || []);
      }

      return data?.map(nominee => ({
        id: nominee.id,
        nominee: nominee.nominee,
        _count: {
          votes: nominee.nominee_votes?.[0]?.count || 0
        },
        has_voted: userVotedNominees.has(nominee.id)
      })) as NomineeData[];
    },
    enabled: !!expandedAward,
  });

  const { data: availableUsers } = useQuery({
    queryKey: ["availableUsers", expandedAward, searchQuery],
    queryFn: async () => {
      if (!expandedAward || !searchQuery) return [];

      const { data: nominatedUsers } = await supabase
        .from("nominees")
        .select("nominee_id")
        .eq("award_id", expandedAward);

      const nominatedIds = nominatedUsers?.map((n) => n.nominee_id) || [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, discord_username")
        .ilike("discord_username", `%${searchQuery}%`)
        .not("id", "in", `(${nominatedIds.join(",")})`)
        .limit(5);

      if (error) throw error;
      return data as UserData[];
    },
    enabled: !!expandedAward && searchQuery.length > 0,
  });

  const checkExistingVote = async (awardId: string) => {
    if (!session?.user) return false;

    const { data: existingVotes } = await supabase
      .from("nominee_votes")
      .select("nominee_id")
      .eq("voter_id", session.user.id)
      .in("nominee_id", nominees?.map(n => n.id) || []);

    return existingVotes && existingVotes.length > 0;
  };

  const voteMutation = useMutation({
    mutationFn: async ({ nomineeId, isVoting }: { nomineeId: string; isVoting: boolean }) => {
      if (!session?.user) {
        navigate("/auth");
        throw new Error("Not authenticated");
      }

      if (isVoting) {
        const hasExistingVote = await checkExistingVote(expandedAward!);
        if (hasExistingVote) {
          throw new Error("already_voted");
        }

        const { error } = await supabase
          .from("nominee_votes")
          .insert({
            nominee_id: nomineeId,
            voter_id: session.user.id,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("nominee_votes")
          .delete()
          .eq("nominee_id", nomineeId)
          .eq("voter_id", session.user.id);

        if (error) throw error;
      }
    },
    onSuccess: (_, { isVoting }) => {
      queryClient.invalidateQueries({ queryKey: ["nominees"] });
      toast({
        title: isVoting ? "Vote recorded" : "Vote removed",
        description: isVoting 
          ? "Your vote has been successfully recorded."
          : "Your vote has been successfully removed.",
      });
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message === "Not authenticated") {
          toast({
            title: "Authentication required",
            description: "Please log in to vote for nominees.",
            variant: "destructive",
          });
        } else if (error.message === "already_voted") {
          toast({
            title: "Vote not allowed",
            description: "You can only vote for one nominee per award. Please remove your existing vote first.",
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
    },
  });

  const nominateMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!session?.user) {
        navigate("/auth");
        throw new Error("Not authenticated");
      }

      if (!expandedAward) throw new Error("No award selected");

      const hasExistingVote = await checkExistingVote(expandedAward);
      if (hasExistingVote) {
        throw new Error("already_voted");
      }

      const { data: newNominee, error: nominationError } = await supabase
        .from("nominees")
        .insert({
          award_id: expandedAward,
          nominee_id: userId,
        })
        .select()
        .single();

      if (nominationError) throw nominationError;

      const { error: voteError } = await supabase
        .from("nominee_votes")
        .insert({
          nominee_id: newNominee.id,
          voter_id: session.user.id,
        });

      if (voteError) throw voteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nominees"] });
      queryClient.invalidateQueries({ queryKey: ["availableUsers"] });
      setSearchQuery("");
      toast({
        title: "Nominee added",
        description: "The user has been successfully nominated and received your vote.",
      });
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message === "Not authenticated") {
          toast({
            title: "Authentication required",
            description: "Please log in to nominate users.",
            variant: "destructive",
          });
        } else if (error.message === "already_voted") {
          toast({
            title: "Nomination not allowed",
            description: "You can only vote for one nominee per award. Please remove your existing vote first.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add nominee. Please try again.",
            variant: "destructive",
          });
        }
      }
    },
  });

  return (
    <div className="container py-8 space-y-6">
      <AwardHeader />
      
      <div className="grid gap-4">
        {awards?.map((award) => (
          <AwardCard
            key={award.id}
            award={award}
            isExpanded={expandedAward === award.id}
            onToggleExpand={() => setExpandedAward(expandedAward === award.id ? null : award.id)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            availableUsers={availableUsers}
            nominees={nominees}
            onNominate={(userId) => nominateMutation.mutate(userId)}
            onVote={(nomineeId, isVoting) => voteMutation.mutate({ nomineeId, isVoting })}
          />
        ))}
      </div>
    </div>
  );
}
