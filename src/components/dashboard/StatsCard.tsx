
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  color: string;
}

export function StatsCard({ title, value, description, icon: Icon, color }: StatsCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-700">{title}</CardTitle>
          <div className={`p-2 rounded-full ${color} bg-opacity-10`}>
            <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color.replace('bg-', 'text-')} mb-1`}>
          {value}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}
