import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationButtons } from "@/components/common/NavigationButtons";
import { useIsMobile } from "@/hooks/use-mobile";

export function AwardHeader() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <NavigationButtons />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Accepted Awards</h1>
        <Button asChild variant="outline">
          <Link to="/suggested-awards" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            {!isMobile && "Suggest Award"}
          </Link>
        </Button>
      </div>
    </div>
  );
}