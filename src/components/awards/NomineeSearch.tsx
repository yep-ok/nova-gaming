import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NomineeSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableUsers?: Array<{
    id: string;
    discord_username: string;
  }>;
  onNominate: (userId: string) => void;
}

export function NomineeSearch({
  searchQuery,
  onSearchChange,
  availableUsers,
  onNominate,
}: NomineeSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search users to nominate..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
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
                onClick={() => onNominate(user.id)}
              >
                {user.discord_username}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}