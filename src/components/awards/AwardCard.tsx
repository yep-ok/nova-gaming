import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { NomineeSearch } from "./NomineeSearch";
import { NomineeList } from "./NomineeList";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader
        className="cursor-pointer hover:bg-accent/50"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between gap-4">
          <CardTitle className={`${isMobile ? 'text-lg' : 'text-2xl'} text-[#1A1F2C]`}>
            {award.name}
          </CardTitle>
          {isExpanded ? <ChevronUp className="text-muted-foreground" /> : <ChevronDown className="text-muted-foreground" />}
        </div>
        <CardDescription className="text-[#8E9196]">{award.description}</CardDescription>
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
            <CardContent className="space-y-4 p-4">
              <NomineeSearch
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                availableUsers={availableUsers}
                onNominate={onNominate}
              />
              <NomineeList
                nominees={nominees || []}
                onVote={onVote}
              />
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}