
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, HandCoins } from "lucide-react";
import UserSelect from "./UserSelect";

interface User {
  id: string;
  discord_username: string;
}

interface TransactionFormProps {
  users: User[];
  isLoadingUsers: boolean;
  recipientUsername: string;
  amount: string;
  message: string;
  action: "send" | "request";
  onActionChange: (action: "send" | "request") => void;
  onRecipientChange: (username: string) => void;
  onAmountChange: (amount: string) => void;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
}

const TransactionForm = ({
  users,
  isLoadingUsers,
  recipientUsername,
  amount,
  message,
  action,
  onActionChange,
  onRecipientChange,
  onAmountChange,
  onMessageChange,
  onSubmit,
}: TransactionFormProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex gap-4 mb-4">
          <Button
            variant={action === "send" ? "default" : "outline"}
            onClick={() => onActionChange("send")}
          >
            <Send className="mr-2 h-4 w-4" />
            Send Money
          </Button>
          <Button
            variant={action === "request" ? "default" : "outline"}
            onClick={() => onActionChange("request")}
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
        <UserSelect
          users={users}
          isLoading={isLoadingUsers}
          selectedUsername={recipientUsername}
          onSelect={onRecipientChange}
        />
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($)</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Message (optional)</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Add a message..."
          />
        </div>
        <Button className="w-full" onClick={onSubmit}>
          {action === "send" ? "Send Money" : "Request Money"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
