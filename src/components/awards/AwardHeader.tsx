import { NavigationButtons } from "@/components/common/NavigationButtons";

export function AwardHeader() {
  return (
    <div className="space-y-4">
      <NavigationButtons />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Accepted Awards</h1>
      </div>
    </div>
  );
}