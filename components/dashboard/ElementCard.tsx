// C:\Users\ADM\Desktop\USB MKT PRO V3\components\dashboard\ElementCard.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card"; // Usando card padrão, aplicar estilo via className
import { cn } from '@/lib/utils';
import { LucideProps } from 'lucide-react'; // Importar LucideProps

// Definir um tipo mais específico para o ícone que aceita className e strokeWidth
type IconType = React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;

interface ElementCardProps {
  icon: IconType; // Usar o tipo mais específico
  label: string;
  onClick?: () => void;
  iconColorClass?: string;
  children?: React.ReactNode;
  value?: string | number; // Prop separada para valor, se necessário
}

const ElementCard: React.FC<ElementCardProps> = ({
    icon: IconComponent,
    label,
    onClick,
    iconColorClass = 'text-primary',
    children,
    value // Recebe o valor
}) => {
  // Aplicar classes neumórficas diretamente aqui
  const cardClasses = cn(
    "card", // Usa a classe base que definimos em globals.css
    "p-3", // Padding ajustado
    "flex flex-col items-center justify-center",
    "h-28 w-full", // Altura ajustada
    "text-center",
    onClick ? "cursor-pointer card-interactive" : "" // Usa classe interativa
  );

  return (
    <Card className={cardClasses} onClick={onClick}>
      <CardContent className="p-0 flex flex-col items-center justify-center gap-1">
         {/* Passa as classes corretas para o ícone */}
        <IconComponent className={cn("h-6 w-6 mb-1", iconColorClass)} strokeWidth={1.5} />
        <span className="text-xs font-semibold text-muted-foreground">{label}</span> {/* Usando muted foreground */}
         {/* Mostra o valor se existir */}
         {value !== undefined && (
             <span className="text-lg font-bold text-foreground mt-0.5">{value}</span>
         )}
        {children} {/* Mantém children se precisar de algo mais complexo */}
      </CardContent>
    </Card>
  );
};

export default ElementCard;