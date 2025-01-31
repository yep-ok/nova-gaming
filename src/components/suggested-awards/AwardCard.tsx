import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AwardCardProps {
  award: {
    id: string;
    name: string;
    description: string;
    has_voted?: boolean;
    _count: {
      votes: number;
    };
  };
  onClick: () => void;
}

export function AwardCard({ award, onClick }: AwardCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        award.has_voted 
          ? "bg-primary/20 hover:bg-primary/30 border-primary shadow-lg transform hover:-translate-y-1" 
          : "hover:bg-accent"
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={award.has_voted ? "text-primary" : ""}>
            {award.name}
          </CardTitle>
          <CardDescription>
            {award._count.votes} / 3 votes
          </CardDescription>
        </div>
        <CardDescription>{award.description}</CardDescription>
      </CardHeader>
    </Card>
  );
}