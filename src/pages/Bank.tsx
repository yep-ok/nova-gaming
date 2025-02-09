
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import BalanceCard from "@/components/bank/BalanceCard";
import TransactionForm from "@/components/bank/TransactionForm";

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
        .select("id, discord_username")
        .neq("id", currentUser.id);

      if (error) throw error;
      
      return data.map(user => ({
        ...user,
        discord_username: user.discord_username.replace(/#0$/, '')
      }));
    },
    enabled: !!currentUser,
  });

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
          filter: `id=eq.${currentUser.id} AND column=balance`
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
        <BalanceCard balance={currentUser?.balance || 0} />
        
        <TransactionForm
          users={users}
          isLoadingUsers={isLoadingUsers}
          recipientUsername={recipientUsername}
          amount={amount}
          message={message}
          action={action}
          onActionChange={setAction}
          onRecipientChange={setRecipientUsername}
          onAmountChange={setAmount}
          onMessageChange={setMessage}
          onSubmit={handleTransaction}
        />
      </div>
    </div>
  );
};

export default Bank;
