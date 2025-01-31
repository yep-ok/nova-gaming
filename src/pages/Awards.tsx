import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, Search, Home, ChevronDown, ChevronUp, ThumbsUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface AwardData {
  id: string;
  name: string;
  description: string;
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

  // Fetch accepted awards
  const { data: awards } = useQuery({
    queryKey: ["acceptedAwards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("awards")
        .select("id, name, description")
        .eq("status", "accepted");

      if (error) throw error;
      return data as AwardData[];
    },
  });

  // Fetch nominees for an award
  const { data: nominees, isLoading: nomineesLoading } = useQuery({
    queryKey: ["nominees", expandedAward],
    queryFn: async () => {
      if (!expandedAward) return null;

      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("nominees")
        .select(`
          id,
          nominee:nominee_id(id, discord_username),
          nominee_votes(count)
        `)
        .eq("award_id", expandedAward);

      if (error) throw error;

      // Get user's votes
      const { data: userVotes } = await supabase
        .from("nominee_votes")
        .select("nominee_id")
        .eq("voter_id", user.user?.id || '');

      const userVotedNominees = new Set(userVotes?.map(vote => vote.nominee_id));

      // Transform the data to match NomineeData interface
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

  // Fetch available users for nomination
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

  // Mutation to vote for a nominee
  const voteMutation = useMutation({
    mutationFn: async ({ nomineeId, isVoting }: { nomineeId: string; isVoting: boolean }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      if (isVoting) {
        const { error } = await supabase
          .from("nominee_votes")
          .insert({
            nominee_id: nomineeId,
            voter_id: user.user.id,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("nominee_votes")
          .delete()
          .eq("nominee_id", nomineeId)
          .eq("voter_id", user.user.id);

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
      toast({
        title: "Error",
        description: "Failed to process vote. Please try again.",
        variant: "destructive",
      });
      console.error("Error processing vote:", error);
    },
  });

  // Mutation to nominate a new user
  const nominateMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!expandedAward) throw new Error("No award selected");

      const { error } = await supabase
        .from("nominees")
        .insert({
          award_id: expandedAward,
          nominee_id: userId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nominees"] });
      queryClient.invalidateQueries({ queryKey: ["availableUsers"] });
      setSearchQuery("");
      toast({
        title: "Nominee added",
        description: "The user has been successfully nominated.",
      });
    },
  });

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
            <Link to="/suggested-awards">
              <Award className="mr-2" />
              Suggested Awards
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {awards?.map((award) => (
          <Card key={award.id} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer"
              onClick={() => setExpandedAward(expandedAward === award.id ? null : award.id)}
            >
              <div className="flex items-center justify-between">
                <CardTitle>{award.name}</CardTitle>
                {expandedAward === award.id ? <ChevronUp /> : <ChevronDown />}
              </div>
              <CardDescription>{award.description}</CardDescription>
            </CardHeader>

            <AnimatePresence>
              {expandedAward === award.id && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users to nominate..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                      {searchQuery && availableUsers && availableUsers.length > 0 && (
                        <Card className="absolute w-full mt-1 z-10">
                          <CardContent className="p-2">
                            {availableUsers.map((user) => (
                              <Button
                                key={user.id}
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => nominateMutation.mutate(user.id)}
                              >
                                {user.discord_username}
                              </Button>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <div className="grid gap-2">
                      {nominees?.map((nominee) => (
                        <Card
                          key={nominee.id}
                          className={`cursor-pointer transition-colors ${
                            nominee.has_voted 
                              ? "bg-accent/50 hover:bg-accent/60" 
                              : "hover:bg-accent"
                          }`}
                          onClick={() => voteMutation.mutate({ 
                            nomineeId: nominee.id, 
                            isVoting: !nominee.has_voted 
                          })}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">
                                {nominee.nominee.discord_username}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <CardDescription>
                                  {nominee._count.votes} votes
                                </CardDescription>
                                <ThumbsUp 
                                  className={nominee.has_voted ? "text-primary" : "text-muted-foreground"} 
                                  size={16}
                                />
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  );
}