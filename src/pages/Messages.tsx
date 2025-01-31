import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface Message {
  id: string;
  content: string;
  created_at: string;
  author: {
    discord_username: string;
  };
}

export default function Messages() {
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch messages
  const { data: messages } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          created_at,
          author:author_id(discord_username)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
  });

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("messages")
        .insert({
          content: newMessage,
          author_id: user.user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages"] });
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
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newMessage.trim()) {
              createMessageMutation.mutate();
            }
          }}
        />
        <Button
          onClick={() => createMessageMutation.mutate()}
          disabled={!newMessage.trim()}
        >
          Send
        </Button>
      </div>

      <div className="grid gap-4">
        {messages?.map((message) => (
          <Card key={message.id}>
            <CardHeader>
              <CardTitle className="text-base font-normal">
                <span className="font-bold">{message.author.discord_username}: </span>
                {message.content}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}