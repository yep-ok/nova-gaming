import { useEffect, useRef, useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleNominate = (userId: string) => {
    onNominate(userId);
    setIsOpen(false);
  };

  const formatUsername = (username: string) => {
    return username.split('#')[0];
  };

  const showSuggestions = isOpen && availableUsers && availableUsers.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search users to nominate..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={handleInputFocus}
        className="pl-9 bg-white border-[#E5E7EB] focus:border-[#FF4500] focus:ring-[#FF4500]"
      />
      {showSuggestions && (
        <Card className="absolute w-full mt-1 z-10 border-[#E5E7EB]">
          <CardContent className="p-2">
            <div className="space-y-1">
              {availableUsers.map((user) => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="w-full justify-start text-[#1A1F2C] hover:bg-[#FF4500]/10"
                  onClick={() => handleNominate(user.id)}
                >
                  {formatUsername(user.discord_username)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}