
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, HandCoins } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface User {
  id: string;
  discord_username: string;
  balance: number;
}

const Bank = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [recipientUsername, setRecipientUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<"send" | "request">("send");
  const [open, setOpen] = useState(false);

  const { data: currentUser, isLoading: isLoadingCurrentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, discord_username, balance")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      return data as User;
    },
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      if (!currentUser?.id) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("id, discord_username");

      if (error) throw error;
      
      // Filter out current user and clean up usernames
      return data
        .filter(user => user.id !== currentUser.id)
        .map(user => ({
          ...user,
          discord_username: user.discord_username.replace(/#0$/, '')
        }));
    },
    enabled: !!currentUser, // Only fetch users when we have the current user
  });

  // Set up real-time subscription for balance updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUser.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'money_requests',
          filter: `requested_from_id=eq.${currentUser.id}`
        },
        (payload) => {
          const requester = users.find(u => u.id === payload.new.requester_id);
          if (requester) {
            toast({
              title: "New Money Request",
              description: `${requester.discord_username} requested $${payload.new.amount}`,
            });
          }
          queryClient.invalidateQueries({ queryKey: ["moneyRequests"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, queryClient, users, toast]);

  const handleTransaction = async () => {
    try {
      if (!amount || !recipientUsername) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      // Find recipient
      const { data: recipient, error: recipientError } = await supabase
        .from("profiles")
        .select("id, discord_username")
        .eq("discord_username", recipientUsername + "#0")
        .single();

      if (recipientError || !recipient) {
        toast({
          title: "Error",
          description: "Recipient not found",
          variant: "destructive",
        });
        return;
      }

      if (action === "send") {
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert({
            sender_id: currentUser?.id,
            recipient_id: recipient.id,
            amount: amountNum,
            description: message || undefined,
          });

        if (transactionError) throw transactionError;

        toast({
          title: "Success",
          description: `Successfully sent $${amountNum} to ${recipientUsername}`,
        });
      } else {
        const { error: requestError } = await supabase
          .from("money_requests")
          .insert({
            requester_id: currentUser?.id,
            requested_from_id: recipient.id,
            amount: amountNum,
            description: message || undefined,
          });

        if (requestError) throw requestError;

        toast({
          title: "Success",
          description: `Successfully requested $${amountNum} from ${recipientUsername}`,
        });
      }

      // Reset form
      setRecipientUsername("");
      setAmount("");
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoadingCurrentUser || isLoadingUsers) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-[#F3F3F3]">
        <div className="max-w-2xl mx-auto">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#F3F3F3]">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl text-[#222222]">Bank</CardTitle>
            <CardDescription className="text-lg text-[#555555]">
              Balance: ${currentUser?.balance?.toFixed(2) || "0.00"}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex gap-4 mb-4">
              <Button
                variant={action === "send" ? "default" : "outline"}
                onClick={() => setAction("send")}
              >
                <Send className="mr-2 h-4 w-4" />
                Send Money
              </Button>
              <Button
                variant={action === "request" ? "default" : "outline"}
                onClick={() => setAction("request")}
              >
                <HandCoins className="mr-2 h-4 w-4" />
                Request Money
              </Button>
            </div>
            <CardTitle className="text-xl text-[#222222]">
              {action === "send" ? "Send Money" : "Request Money"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient's Username</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {recipientUsername || "Select a user..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {users?.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => {
                            setRecipientUsername(user.discord_username);
                            setOpen(false);
                          }}
                        >
                          {user.discord_username}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message..."
              />
            </div>
            <Button
              className="w-full"
              onClick={handleTransaction}
            >
              {action === "send" ? "Send Money" : "Request Money"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Bank;
