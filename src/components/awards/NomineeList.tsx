import { ThumbsUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface NomineeListProps {
  nominees: Array<{
    id: string;
    nominee: {
      discord_username: string;
    };
    _count: {
      votes: number;
    };
    has_voted?: boolean;
  }>;
  onVote: (nomineeId: string, isVoting: boolean) => void;
}

export function NomineeList({ nominees, onVote }: NomineeListProps) {
  // Sort nominees by vote count in descending order
  const sortedNominees = [...nominees].sort((a, b) => b._count.votes - a._count.votes);

  return (
    <div className="grid gap-2">
      {sortedNominees.map((nominee) => (
        <Card
          key={nominee.id}
          className={`cursor-pointer transition-all ${
            nominee.has_voted 
              ? "bg-primary/20 hover:bg-primary/30 border-primary shadow-lg transform hover:-translate-y-1" 
              : "hover:bg-accent"
          }`}
          onClick={() => onVote(nominee.id, !nominee.has_voted)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={`text-lg ${nominee.has_voted ? "text-primary" : ""}`}>
                {nominee.nominee.discord_username}
              </CardTitle>
              <div className="flex items-center gap-2">
                <CardDescription>
                  {nominee._count.votes} votes
                </CardDescription>
                <ThumbsUp 
                  className={nominee.has_voted ? "text-primary" : "text-muted-foreground"} 
                  size={16}
                />
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}