
import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
  const [open, setOpen] = useState(false);
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
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled
        >
          Loading users...
        </Button>
      </div>
    );
  }

  // Ensure users is an array and contains valid data
  const safeUsers = Array.isArray(users) ? users.filter(user => user && user.discord_username) : [];

  return (
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
            {selectedUsername || "Select a user..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {safeUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    onSelect(user.discord_username);
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
  );
};

export default UserSelect;
