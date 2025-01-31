import { useNavigate } from "react-router-dom";
import { Trophy, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export function AwardHeader() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A1F2C] flex items-center gap-2">
          <Trophy className="size-6 text-[#FF4500]" />
          {!isMobile && "Awards"}
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate("/suggested-awards")}
          className="gap-2"
        >
          <PlusCircle />
          {!isMobile && "Suggest Award"}
        </Button>
      </div>
      <p className="text-[#8E9196]">
        Vote for your favorite community members in these categories!
      </p>
    </div>
  );
}