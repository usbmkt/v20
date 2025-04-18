// components/dashboard/StatCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeLabel?: string;
  // Definir explicitamente que o ícone aceita props SVG
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  valueColorClass?: string;
  useInsetStyle?: boolean;
  isLoading?: boolean;
  isCompact?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    change,
    changeLabel,
    icon: IconComponent,
    valueColorClass = 'text-white',
    useInsetStyle = false,
    isLoading = false,
    isCompact = false,
}) => {
    const changeIsPositive = change && change.startsWith('+');
    const changeIsNegative = change && change.startsWith('-');
    const cardBaseClass = "bg-[#141414] border-none shadow-[5px_5px_10px_rgba(0,0,0,0.4),-5px_-5px_10px_rgba(255,255,255,0.05)] rounded-lg";
    const neonColor = '#1E90FF'; // Azul neon como exemplo

  return (
    <Card className={cn(cardBaseClass, isLoading && "opacity-60", "p-3 min-h-[95px]", "overflow-visible flex flex-col")}>
      {/* Reduce bottom padding on header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 flex-shrink-0">
        <CardTitle
         className="text-xs font-medium text-gray-300"
         style={{ textShadow: `0 0 4px ${neonColor}` }}
        >
            {title}
        </CardTitle>
        {/* Agora IconComponent aceita className e style */}
        {IconComponent && <IconComponent
            className="h-4 w-4 text-white"
            style={{ filter: `drop-shadow(0 0 4px ${neonColor})` }}
        />}
      </CardHeader>
      {/* Reduce top padding on content */}
      <CardContent className="pt-0 pb-1 flex-grow flex flex-col justify-center">
         {isLoading ? (
            <div className="flex items-center h-[20px]">
                <Loader2
                 className="h-4 w-4 animate-spin text-gray-400"
                 style={{ filter: `drop-shadow(0 0 4px ${neonColor})`}}
                />
            </div>
         ) : (
            <div>
                <div
                 className={cn("font-bold text-lg", valueColorClass)} // Kept text-lg for value
                 style={{ textShadow: `0 0 5px ${neonColor}, 0 0 8px ${neonColor}` }}
                 >
                    {value}
                 </div>
                {change && !isLoading && (
                  <div
                   className="flex items-center text-xs text-muted-foreground mt-1" // Kept mt-1 for change indicator
                   style={{ textShadow: `0 0 4px ${neonColor}` }}
                  >
                    <span className={cn( "flex items-center text-xs", changeIsPositive ? 'text-green-400' : changeIsNegative ? 'text-red-400' : '' )}>
                        {changeIsPositive && <ArrowUpIcon className="h-3 w-3 mr-1" style={{ filter: `drop-shadow(0 0 3px ${neonColor})`}}/>}
                        {changeIsNegative && <ArrowDownIcon className="h-3 w-3 mr-1" style={{ filter: `drop-shadow(0 0 3px ${neonColor})`}}/>}
                        {change}
                    </span>
                     {changeLabel && <span className="ml-1 text-xs whitespace-nowrap">{changeLabel}</span>}
                  </div>
                )}
            </div>
         )}
      </CardContent>
    </Card>
  );
};

export default StatCard;