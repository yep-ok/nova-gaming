import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { NomineeSearch } from "./NomineeSearch";
import { NomineeList } from "./NomineeList";
import { useEffect, useRef } from "react";

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
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && cardRef.current) {
      const yOffset = -20; // Add some padding at the top
      const element = cardRef.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [isExpanded]);

  return (
    <Card className="overflow-hidden" ref={cardRef}>
      <CardHeader
        className="cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <CardTitle>{award.name}</CardTitle>
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </div>
        <CardDescription>{award.description}</CardDescription>
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