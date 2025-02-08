
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface BalanceCardProps {
  balance: number;
}

const BalanceCard = ({ balance }: BalanceCardProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-2xl text-[#222222]">Bank</CardTitle>
        <CardDescription className="text-lg text-[#555555]">
          Balance: ${balance?.toFixed(2) || "0.00"}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export default BalanceCard;
