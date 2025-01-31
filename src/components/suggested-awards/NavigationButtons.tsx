import { Link } from "react-router-dom";
import { Home, Award, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationButtonsProps {
  onNewAward: () => void;
}

export function NavigationButtons({ onNewAward }: NavigationButtonsProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link to="/">
            <Home className="mr-2" />
            Home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/awards">
            <Award className="mr-2" />
            Accepted Awards
          </Link>
        </Button>
      </div>
      <Button onClick={onNewAward}>
        <Plus className="mr-2" />
        New Award
      </Button>
    </div>
  );
}