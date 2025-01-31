import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { NomineeSearch } from "./NomineeSearch";
import { NomineeList } from "./NomineeList";

interface AwardCardProps {
  award: {
    id: string;
    name: string;
    description: string;
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableUsers?: Array<{
    id: string;
    discord_username: string;
  }>;
  nominees?: Array<{
    id: string;
    nominee: {
      discord_username: string;
    };
    _count: {
      votes: number;
    };
    has_voted?: boolean;
  }>;
  onNominate: (userId: string) => void;
  onVote: (nomineeId: string, isVoting: boolean) => void;
}

export function AwardCard({
  award,
  isExpanded,
  onToggleExpand,
  searchQuery,
  onSearchChange,
  availableUsers,
  nominees,
  onNominate,
  onVote,
}: AwardCardProps) {
  // Find the nominee with the most votes
  const topNominee = nominees?.sort((a, b) => b._count.votes - a._count.votes)[0];

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>{award.name}</CardTitle>
            <CardDescription>{award.description}</CardDescription>
            {topNominee && (
              <CardDescription className="font-medium text-primary">
                Leading: {topNominee.nominee.discord_username} ({topNominee._count.votes} votes)
              </CardDescription>
            )}
          </div>
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="space-y-4">
              <NomineeSearch
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                availableUsers={availableUsers}
                onNominate={onNominate}
              />
              <NomineeList
                nominees={nominees?.sort((a, b) => b._count.votes - a._count.votes) || []}
                onVote={onVote}
              />
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}