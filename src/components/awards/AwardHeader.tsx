import { Link } from "react-router-dom";
import { Award, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AwardHeader() {
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
          <Link to="/suggested-awards">
            <Award className="mr-2" />
            Suggested Awards
          </Link>
        </Button>
      </div>
    </div>
  );
}