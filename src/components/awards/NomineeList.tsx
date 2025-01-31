import { ThumbsUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const sortedNominees = [...nominees].sort((a, b) => b._count.votes - a._count.votes);

  return (
    <div className="grid gap-2">
      {sortedNominees.map((nominee) => (
        <Card
          key={nominee.id}
          className={`cursor-pointer transition-all ${
            nominee.has_voted 
              ? "bg-[#FF4500]/10 hover:bg-[#FF4500]/20 border-[#FF4500] shadow-lg transform hover:-translate-y-1" 
              : "hover:bg-accent"
          }`}
          onClick={() => onVote(nominee.id, !nominee.has_voted)}
        >
          <CardHeader className={`p-4 ${isMobile ? 'space-y-1' : 'space-y-2'}`}>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} ${nominee.has_voted ? "text-[#FF4500]" : "text-[#1A1F2C]"}`}>
                {nominee.nominee.discord_username}
              </CardTitle>
              <div className="flex items-center gap-2">
                <CardDescription className={nominee.has_voted ? "text-[#FF4500]" : "text-[#8E9196]"}>
                  {nominee._count.votes} votes
                </CardDescription>
                <ThumbsUp 
                  className={nominee.has_voted ? "text-[#FF4500]" : "text-[#8E9196]"} 
                  size={isMobile ? 14 : 16}
                />
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}