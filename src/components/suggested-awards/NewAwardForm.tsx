import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface NewAwardFormProps {
  showForm: boolean;
  onClose: () => void;
  userId: string;
}

export function NewAwardForm({ showForm, onClose, userId }: NewAwardFormProps) {
  const [newAwardName, setNewAwardName] = useState("");
  const [newAwardDescription, setNewAwardDescription] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query to get existing award names
  const { data: existingAwards } = useQuery({
    queryKey: ["existingAwardNames"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("awards")
        .select("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  const createAwardMutation = useMutation({
    mutationFn: async () => {
      // First create the award
      const { data: newAward, error: awardError } = await supabase
        .from("awards")
        .insert({
          name: newAwardName,
          description: newAwardDescription,
          created_by: userId,
          status: "suggested"
        })
        .select()
        .single();

      if (awardError) throw awardError;

      // Then automatically vote for it
      const { error: voteError } = await supabase
        .from("award_votes")
        .insert({
          award_id: newAward.id,
          voter_id: userId,
        });

      if (voteError) throw voteError;

      return newAward;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestedAwards"] });
      onClose();
      setNewAwardName("");
      setNewAwardDescription("");
      toast({
        title: "Award suggested",
        description: "Your award has been successfully suggested and received your vote.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to suggest award. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating award:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAwardName || !newAwardDescription) {
      toast({
        title: "Error",
        description: "Please fill in both name and description.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate award name locally
    const existingAward = existingAwards?.find(
      award => award.name.toLowerCase() === newAwardName.toLowerCase()
    );

    if (existingAward) {
      toast({
        title: "Duplicate Award Name",
        description: `An award called "${existingAward.name}" already exists. Please choose a different name for your award.`,
        variant: "destructive",
      });
      return;
    }

    createAwardMutation.mutate();
  };

  return (
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
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
  );
}