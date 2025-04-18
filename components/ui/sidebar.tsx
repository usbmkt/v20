// components/ui/sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
// <<< REMOVER useRouter de 'next/router', USAR 'next/navigation' para App Router
import { usePathname } from 'next/navigation'; // <<< USAR usePathname
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutDashboard, Target, DollarSign, BarChart3, CalendarDays, FileText,
  Lightbulb, LineChart, TrendingUp, Bell, MessageSquare, Settings, LifeBuoy, Power,
  Filter, Upload, ChevronLeft, ChevronRight, Image as ImageIcon, Video, Type, ListChecks, Clock, Variable, Waypoints, HelpCircle, RadioTower,
  UserCheck, LogOut, Workflow, Users, BarChart2, Square, Eye, Map, Share2, Pencil, // <<< ADICIONAR Pencil
  Check, X, GripVertical, List, Grid, ExternalLink, Paperclip, Save, Sparkles, Bot
} from "lucide-react";
import Image from "next/image";

interface NavItem {
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

const neonColor = '#1E90FF';
const neonColorHex = '#1E90FF';

const navItems: NavItem[] = [
    { href: "/", icon: LayoutDashboard, label: "Visão Geral" },
    { href: "/Campaign", icon: Target, label: "Campanhas" },
    { href: "/Budget", icon: DollarSign, label: "Orçamento" },
    { href: "/Metrics", icon: BarChart3, label: "Métricas" },
    { href: "/Funnel", icon: Filter, label: "Funil" },
    { href: "/Dates", icon: CalendarDays, label: "Datas" },
    { href: "/CopyPage", icon: FileText, label: "Copy" },
    { href: "/Suggestions", icon: Lightbulb, label: "Sugestões IA" },
    { href: "/Projection", icon: TrendingUp, label: "Projeção" },
    { href: "/ltv", icon: LineChart, label: "LTV" },
    { href: "/alerts", icon: Bell, label: "Alertas" },
    { href: "/creatives", icon: ImageIcon, label: "Criativos" },
    { href: "/Chat", icon: MessageSquare, label: "Chat IA" },
    { href: "/zap", icon: MessageSquare, label: "Zap" },
    { href: "/builder", icon: Pencil, label: "Webpage" }, // <<< NOVO ITEM BUILDER
    { href: "/export", icon: Upload, label: "Exportar" },
];

interface SidebarProps { isCollapsed: boolean; toggleSidebar: () => void; }

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  // const router = useRouter(); // <<< REMOVER
  const pathname = usePathname(); // <<< USAR usePathname
  const sidebarWidthClass = isCollapsed ? "w-16" : "w-60";

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn( "fixed inset-y-0 left-0 z-50 flex h-full flex-col", "bg-[#101218] text-white border-r border-gray-800/50 shadow-[5px_0px_15px_rgba(0,0,0,0.5)]", sidebarWidthClass, "transition-all duration-300 ease-in-out" )}>
        {/* Header com Logo */}
        <div className={cn( "flex items-center border-b border-[#2D62A3]/20 p-2 relative", isCollapsed ? "h-16 justify-center" : "h-20 justify-center" )}>
          <Link href="/" className={cn( "flex items-center justify-center w-full h-full", isCollapsed ? 'max-w-[44px]' : 'max-w-[180px]' )}>
            <div className={cn("relative", isCollapsed ? "w-[44px] h-[44px]" : "w-[180px] h-[50px]")}>
                 <Image src="/logo.png" alt="Logo USBMKT" fill className="object-contain" style={{ filter: `drop-shadow(0 0 10px ${neonColor})` }} priority sizes={isCollapsed ? "44px" : "180px"} />
            </div>
          </Link>
        </div>

        {/* Navegação Principal */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1">
           {navItems.map((item) => {
              const isActive = pathname === item.href;
              const linkContent = (
                <>
                  <item.icon
                    className={cn( "h-4 w-4 shrink-0 transition-colors pointer-events-none",
                     isCollapsed ? "" : "mr-2", isActive ? `text-white` : `text-[${neonColorHex}]` )}
                    style={ isActive ? { filter: `drop-shadow(0 0 4px rgba(255,255,255,0.7))` } : { filter: `drop-shadow(0 0 4px ${neonColorHex})` } }
                  />
                  {!isCollapsed && (
                    <span className={cn("truncate pointer-events-none",
                     isActive ? "text-white font-semibold" : "text-gray-400 group-hover:text-white")}>
                      {item.label}
                    </span>
                  )}
                </>
              );
              const baseStyle = cn(
                "group flex items-center rounded-md h-8 text-xs font-medium transition-all duration-200 ease-out relative w-full",
                isCollapsed ? "justify-center px-1" : "justify-start pl-3",
                !isActive && "bg-[#141414] text-gray-400 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.05)]",
                !isActive && `hover:text-white hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.06),0_0_12px_${neonColorHex}]`,
                isActive && `bg-[${neonColorHex}] text-white shadow-[0_0_15px_${neonColorHex}]`
               );

              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger
                    className={cn(baseStyle, "block w-full")}
                    role="link"
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Link href={item.href} className="flex items-center w-full h-full" tabIndex={-1}>
                       {linkContent}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" sideOffset={5} className="bg-[#141414] text-white border-none shadow-[5px_5px_15px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.05)] rounded text-xs px-2 py-1">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
        </nav>

        {/* Botão Recolher/Expandir */}
        <div className="border-t border-[#2D62A3]/20 p-2 mt-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className={cn( "group flex items-center rounded-md h-8 text-xs font-medium transition-all duration-200 ease-out w-full", "bg-[#141414] text-gray-400 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.05)]", `hover:text-white hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.4),inset_-2px_-2px_5px_rgba(255,255,255,0.06),0_0_12px_${neonColorHex}]`, isCollapsed ? "justify-center" : "justify-start pl-3" )}
                  aria-label={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
                >
                    {isCollapsed ? ( <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-white" /> ) : ( <> <ChevronLeft className="h-4 w-4 mr-2 text-gray-500 group-hover:text-white" /> <span className="group-hover:text-white">Recolher</span> </> )}
                </button>
              </TooltipTrigger>
              {isCollapsed && ( <TooltipContent side="right" sideOffset={5} className="bg-[#141414] text-white border-none shadow-[5px_5px_15px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.05)] rounded text-xs px-2 py-1"> Expandir </TooltipContent> )}
            </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;