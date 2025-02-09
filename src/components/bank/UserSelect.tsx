
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  discord_username: string;
}

interface UserSelectProps {
  users: User[];
  isLoading: boolean;
  selectedUsername: string;
  onSelect: (username: string) => void;
}

const UserSelect = ({ users, isLoading, selectedUsername, onSelect }: UserSelectProps) => {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="recipient">Recipient's Username</Label>
        <Select disabled>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Loading users..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  // Ensure users is an array and contains valid data
  const safeUsers = Array.isArray(users) ? users.filter(user => user && user.discord_username) : [];

  return (
    <div className="space-y-2">
      <Label htmlFor="recipient">Recipient's Username</Label>
      <Select value={selectedUsername} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a user..." />
        </SelectTrigger>
        <SelectContent>
          {safeUsers.map((user) => (
            <SelectItem key={user.id} value={user.discord_username}>
              {user.discord_username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserSelect;
