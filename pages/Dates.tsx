// pages/Dates.tsx
import React, { useState, useEffect } from 'react'; // Adicionado useEffect
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext'; // <<< AUTENTICAÇÃO
import { useRouter } from 'next/router';       // <<< AUTENTICAÇÃO
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Layout from '@/components/layout';
import { CalendarDays, LineChart, BarChartHorizontal, Loader2 } from 'lucide-react'; // <<< AUTENTICAÇÃO (Loader2)
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Importar Tooltip

// --- Interfaces e Funções Auxiliares (como antes) ---
interface ComparisonPoint { day: number; period1?: number; period2?: number; }
interface ChartPoint { x: number; y: number; value: number; day: number; }
interface TooltipState { x: number; y: number; visible: boolean; value: number; day: number; period: string; }

export default function DatesPage() {
  // --- Autenticação e Roteamento ---
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  // --- Estados da Página ---
  const [period1, setPeriod1] = useState({ startDate: '2025-03-01', endDate: '2025-03-10' });
  const [period2, setPeriod2] = useState({ startDate: '2025-03-11', endDate: '2025-03-20' });
  const [comparisonData, setComparisonData] = useState<ComparisonPoint[]>([]);
  const [totalDifference, setTotalDifference] = useState(0);
  const [percentDifference, setPercentDifference] = useState(0);
  const [hasCompared, setHasCompared] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>({ x: -100, y: -100, visible: false, value: 0, day: 0, period: '' });
  const [loadingPageData, setLoadingPageData] = useState(true); // Loading específico da página

  // --- Constantes de Estilo (como antes) ---
  const neonColor = '#3a7ebf'; const neonColorMuted = '#2d62a3'; const neonGreenColor = '#4CAF50'; const neonRedColor = '#FF4444';
  const cardStyle = "bg-[#141414]/80 backdrop-blur-sm shadow-[5px_5px_10px_rgba(0,0,0,0.4),-5px_-5px_10px_rgba(255,255,255,0.05)] rounded-lg border border-[#2d62a3]/20";
  const neumorphicInputStyle = "bg-[#141414] text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] placeholder:text-gray-500 border border-[#2d62a3]/40 focus:ring-2 focus:ring-[#3a7ebf] focus:ring-offset-2 focus:ring-offset-[#0e1015]";
  const primaryButtonStyle = `bg-gradient-to-r from-[${neonColor}] to-[${neonColorMuted}] hover:from-[${neonColorMuted}] hover:to-[${neonColor}] text-white font-semibold shadow-[0_4px_10px_rgba(45,98,163,0.4)] transition-all duration-300 ease-in-out transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0e1015] focus:ring-[#5ca2e2]`;
  const labelStyle = "text-sm text-gray-300";
  const valueStyle = "font-semibold text-white text-3xl";
  const titleStyle = "text-base font-semibold text-white";

  // --- Lógica de Proteção de Rota ---
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log(`[Auth Guard /Dates] Usuário não autenticado, redirecionando para /login`);
      router.push('/login');
    }
    // Marca que o carregamento da página (após auth) pode começar
    if (!authLoading && isAuthenticated) {
        setLoadingPageData(false); // Permite renderizar o conteúdo da página
    }
  }, [authLoading, isAuthenticated, router]);

  // --- Funções da Página (como antes) ---
  const handleInputChange = (periodNum: 1 | 2, field: 'startDate' | 'endDate', value: string) => { const setter = periodNum === 1 ? setPeriod1 : setPeriod2; setter(prev => ({ ...prev, [field]: value })); };
  const generateRandomData = (startDate: string, endDate: string, baseValue: number): { date: string, value: number }[] => { const start = new Date(startDate + 'T00:00:00'); const end = new Date(endDate + 'T00:00:00'); if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) { return []; } const dayDiff = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) + 1; return Array.from({ length: dayDiff }).map((_, index) => { const currentDate = new Date(start); currentDate.setDate(start.getDate() + index); const dateStr = currentDate.toISOString().split('T')[0]; const randomFactor = 0.7 + Math.random() * 0.6; const value = Math.round(baseValue * randomFactor); return { date: dateStr, value }; }); };
  const comparePeriods = () => { const start1 = new Date(period1.startDate + 'T00:00:00'); const end1 = new Date(period1.endDate + 'T00:00:00'); const start2 = new Date(period2.startDate + 'T00:00:00'); const end2 = new Date(period2.endDate + 'T00:00:00'); if (isNaN(start1.getTime()) || isNaN(end1.getTime()) || isNaN(start2.getTime()) || isNaN(end2.getTime())) { alert("Datas inválidas."); return; } if (end1 < start1 || end2 < start2) { alert("Data final antes da inicial."); return; } const baseValue = 1000 + Math.random() * 5000; const period1Data = generateRandomData(period1.startDate, period1.endDate, baseValue); const period2Data = generateRandomData(period2.startDate, period2.endDate, baseValue * (0.8 + Math.random() * 0.4)); if (!period1Data.length && !period2Data.length) { alert("Não foi possível gerar dados."); return; } const total1 = period1Data.reduce((sum, item) => sum + item.value, 0); const total2 = period2Data.reduce((sum, item) => sum + item.value, 0); const difference = total2 - total1; const percentChange = total1 !== 0 ? (difference / total1) * 100 : (total2 > 0 ? Infinity : 0); const formattedData: ComparisonPoint[] = []; const maxLength = Math.max(period1Data.length, period2Data.length); for (let i = 0; i < maxLength; i++) { const dayObj: ComparisonPoint = { day: i + 1 }; if (i < period1Data.length) dayObj.period1 = period1Data[i].value; if (i < period2Data.length) dayObj.period2 = period2Data[i].value; formattedData.push(dayObj); } setComparisonData(formattedData); setTotalDifference(difference); setPercentDifference(isFinite(percentChange) ? percentChange : (difference > 0 ? 100 : -100)); setHasCompared(true); setTooltip({ ...tooltip, visible: false }); };
  const renderLineChart = () => { if (comparisonData.length === 0) return null; const width = 600; const height = 300; const padding = 45; const maxValue = Math.max( ...comparisonData.flatMap(d => [d.period1 ?? 0, d.period2 ?? 0]), 1 ); const maxDays = comparisonData.length; const effectiveMaxDays = maxDays > 1 ? maxDays : 2; const xScale = (day: number) => padding + ((day - 1) / (effectiveMaxDays - 1)) * (width - 2 * padding); const yScale = (value: number) => height - padding - Math.max(0, (value / maxValue)) * (height - 2 * padding); const getBezierPath = (points: ChartPoint[]) => { if (points.length < 1) return ''; if (points.length === 1) return `M ${points[0].x},${points[0].y}`; let path = `M ${points[0].x},${points[0].y}`; for (let i = 0; i < points.length - 1; i++) { const x1 = points[i].x; const y1 = points[i].y; const x2 = points[i + 1].x; const y2 = points[i + 1].y; const cx1 = x1 + (x2 - x1) * 0.4; const cy1 = y1; const cx2 = x1 + (x2 - x1) * 0.6; const cy2 = y2; path += ` C ${cx1.toFixed(2)},${cy1.toFixed(2)} ${cx2.toFixed(2)},${cy2.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`; } return path; }; const period1Points: ChartPoint[] = comparisonData .map((data) => data.period1 !== undefined ? { x: xScale(data.day), y: yScale(data.period1), value: data.period1, day: data.day } : null) .filter((p): p is ChartPoint => p !== null); const period2Points: ChartPoint[] = comparisonData .map((data) => data.period2 !== undefined ? { x: xScale(data.day), y: yScale(data.period2), value: data.period2, day: data.day } : null) .filter((p): p is ChartPoint => p !== null); const period1Path = getBezierPath(period1Points); const period2Path = getBezierPath(period2Points); const gridLines = []; for (let i = 0; i <= 5; i++) { const yVal = (i / 5) * maxValue; const y = yScale(yVal); gridLines.push(<line key={`grid-y-${i}`} x1={padding} y1={y} x2={width - padding} y2={y} stroke={neonColorMuted} strokeWidth="0.5" opacity="0.3" strokeDasharray="3 3" />); gridLines.push(<text key={`label-y-${i}`} x={padding - 8} y={y + 4} fill="#a0a0a0" fontSize="10" textAnchor="end">{yVal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</text>); } const xLabelInterval = Math.max(1, Math.ceil(maxDays / 10)); if (maxDays > 0) { for (let i = 1; i <= maxDays; i += xLabelInterval) { const currentDay = (i + xLabelInterval > maxDays && i !== maxDays) ? maxDays : i; const x = xScale(currentDay); gridLines.push(<line key={`grid-x-${currentDay}`} x1={x} y1={padding} x2={x} y2={height - padding} stroke={neonColorMuted} strokeWidth="0.5" opacity="0.3" strokeDasharray="3 3" />); gridLines.push(<text key={`label-x-${currentDay}`} x={x} y={height - padding + 18} fill="#a0a0a0" fontSize="10" textAnchor="middle">{currentDay}</text>); if (currentDay === maxDays) break; } } const handleMouseOver = (point: ChartPoint, period: string) => { setTooltip({ x: point.x, y: point.y, visible: true, value: point.value, day: point.day, period }); }; const handleMouseOut = () => { setTooltip(prev => ({ ...prev, visible: false })); }; return ( <div className="relative"> <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}> <defs> <filter id="neon-glow-p1" x="-50%" y="-50%" width="200%" height="200%"> <feGaussianBlur stdDeviation="2" result="coloredBlur"/> <feMerge> <feMergeNode in="coloredBlur"/> <feMergeNode in="SourceGraphic"/> </feMerge> </filter> <filter id="neon-glow-p2" x="-50%" y="-50%" width="200%" height="200%"> <feGaussianBlur stdDeviation="2" result="coloredBlur"/> <feMerge> <feMergeNode in="coloredBlur"/> <feMergeNode in="SourceGraphic"/> </feMerge> </filter> </defs> <g> {gridLines} <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cccccc" strokeWidth="1"/> <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cccccc" strokeWidth="1"/> <text x={width / 2} y={height - 8} fill="#cccccc" fontSize="12" textAnchor="middle" > Dia </text> <text x={padding - 30} y={height/2} fill="#cccccc" fontSize="12" textAnchor="middle" transform={`rotate(-90 ${padding-30},${height/2})`} > Faturamento (R$) </text> </g> {period1Path && <path d={period1Path} fill="none" stroke={neonColor} strokeWidth="2.5" className="stroke-dash-[1000] stroke-dashoffset-[1000] animate-line-draw" style={{ animationDuration: '1.5s' }} />} {period2Path && <path d={period2Path} fill="none" stroke={neonGreenColor} strokeWidth="2.5" className="stroke-dash-[1000] stroke-dashoffset-[1000] animate-line-draw" style={{ animationDelay: '0.2s', animationDuration: '1.5s' }} />} {period1Points.map((point, index) => ( <circle key={`p1-${index}`} cx={point.x} cy={point.y} r="4" fill={neonColor} stroke="#0e1015" strokeWidth="1.5" className="cursor-pointer transition-all duration-150 ease-out hover:r-6" onMouseOver={() => handleMouseOver(point, 'Período 1')} onMouseOut={handleMouseOut} /> ))} {period2Points.map((point, index) => ( <circle key={`p2-${index}`} cx={point.x} cy={point.y} r="4" fill={neonGreenColor} stroke="#0e1015" strokeWidth="1.5" className="cursor-pointer transition-all duration-150 ease-out hover:r-6" onMouseOver={() => handleMouseOver(point, 'Período 2')} onMouseOut={handleMouseOut} /> ))} </svg> <div className={cn( "absolute z-10 pointer-events-none", "bg-[#13151a]/90 backdrop-blur-sm", "border border-[#2d62a3]/50 rounded-md shadow-lg", "px-3 py-2 text-xs text-white whitespace-nowrap", "transition-opacity duration-200 ease-out", tooltip.visible ? "opacity-100" : "opacity-0", "transform -translate-x-1/2 -translate-y-[calc(100%+10px)]" )} style={{ left: tooltip.x, top: tooltip.y }} > <span className="font-semibold" style={{ color: tooltip.period === 'Período 1' ? neonColor : neonGreenColor }}> {tooltip.period} </span> - Dia {tooltip.day}: <br/> <span className="font-bold">R$ {tooltip.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> </div> </div> ); };

  // --- Renderização Condicional (Auth Loading) ---
  if (authLoading || loadingPageData) {
    return (
      <Layout>
         <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">
               {authLoading ? 'Verificando acesso...' : 'Carregando...'}
            </span>
        </div>
      </Layout>
    );
  }
  if (!isAuthenticated) { return null; } // Proteção

  // --- Renderização Principal ---
  return (
    <Layout>
      <Head><title>Comparativo de Datas - USBMKT</title></Head>
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-white mb-6" style={{ textShadow: `0 0 8px ${neonColor}` }}> Comparativo de Datas </h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna de Seleção de Datas */}
          <Card className={cn(cardStyle, "lg:col-span-1 p-5")}>
            <CardHeader className="p-0 pb-4 mb-5 border-b border-[#2d62a3]/30"> <CardTitle className="text-lg font-semibold text-white flex items-center" style={{ textShadow: `0 0 6px ${neonColor}` }}> <CalendarDays size={20} className="mr-2" style={{ filter: `drop-shadow(0 0 4px ${neonColor})` }}/> Selecionar Períodos </CardTitle> </CardHeader>
            <CardContent className="p-0 space-y-6">
              {/* Período 1 */}
              <div className="space-y-3"> <h3 className="font-bold text-base text-white border-b border-[#2d62a3]/20 pb-1.5" style={{ textShadow: `0 0 4px ${neonColor}` }}>Período 1</h3> <Card className={cn( "bg-[#141414]/60", "shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.04)]", "rounded-md p-3", "border border-[#2d62a3]/20", "flex flex-col gap-1" )}> <Label htmlFor="startDate1" className="text-sm text-gray-300" style={{ textShadow: `0 0 3px ${neonColor}` }}>Data Inicial</Label> <Input id="startDate1" type="date" value={period1.startDate} onChange={(e) => handleInputChange(1, 'startDate', e.target.value)} className={cn(neumorphicInputStyle, "h-9 px-3 py-2 text-sm")} /> </Card> <Card className={cn( "bg-[#141414]/60", "shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.04)]", "rounded-md p-3", "border border-[#2d62a3]/20", "flex flex-col gap-1" )}> <Label htmlFor="endDate1" className="text-sm text-gray-300" style={{ textShadow: `0 0 3px ${neonColor}` }}>Data Final</Label> <Input id="endDate1" type="date" value={period1.endDate} onChange={(e) => handleInputChange(1, 'endDate', e.target.value)} className={cn(neumorphicInputStyle, "h-9 px-3 py-2 text-sm")} /> </Card> </div>
              {/* Período 2 */}
              <div className="space-y-3"> <h3 className="font-bold text-base text-white border-b border-[#2d62a3]/20 pb-1.5" style={{ textShadow: `0 0 4px ${neonColor}` }}>Período 2</h3> <Card className={cn( "bg-[#141414]/60", "shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.04)]", "rounded-md p-3", "border border-[#2d62a3]/20", "flex flex-col gap-1" )}> <Label htmlFor="startDate2" className="text-sm text-gray-300" style={{ textShadow: `0 0 3px ${neonColor}` }}>Data Inicial</Label> <Input id="startDate2" type="date" value={period2.startDate} onChange={(e) => handleInputChange(2, 'startDate', e.target.value)} className={cn(neumorphicInputStyle, "h-9 px-3 py-2 text-sm")} /> </Card> <Card className={cn( "bg-[#141414]/60", "shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2),inset_-1px_-1px_3px_rgba(255,255,255,0.04)]", "rounded-md p-3", "border border-[#2d62a3]/20", "flex flex-col gap-1" )}> <Label htmlFor="endDate2" className="text-sm text-gray-300" style={{ textShadow: `0 0 3px ${neonColor}` }}>Data Final</Label> <Input id="endDate2" type="date" value={period2.endDate} onChange={(e) => handleInputChange(2, 'endDate', e.target.value)} className={cn(neumorphicInputStyle, "h-9 px-3 py-2 text-sm")} /> </Card> </div>
              <Button onClick={comparePeriods} className={cn(primaryButtonStyle, "w-full mt-2 py-2.5")}> <BarChartHorizontal size={16} className="mr-2" /> Comparar Períodos </Button>
            </CardContent>
          </Card>
          {/* Coluna Resultados e Gráfico */}
          <div className="lg:col-span-2 space-y-6">
            {hasCompared ? (
              <> <div className="grid grid-cols-1 md:grid-cols-2 gap-5"> <Card className={cn(cardStyle, "p-5 text-center")}> <CardHeader className="p-0 mb-1.5"> <CardTitle className="text-sm text-gray-400 font-medium" style={{ textShadow: `0 0 4px ${neonColor}` }}>Diferença Total</CardTitle> </CardHeader> <CardContent className="p-0"> <p className={`text-2xl font-bold ${totalDifference >= 0 ? "text-green-400" : "text-red-400"}`} style={{ textShadow: `0 0 6px ${totalDifference >= 0 ? neonGreenColor : neonRedColor}` }}> R$ {totalDifference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} </p> </CardContent> </Card> <Card className={cn(cardStyle, "p-5 text-center")}> <CardHeader className="p-0 mb-1.5"> <CardTitle className="text-sm text-gray-400 font-medium" style={{ textShadow: `0 0 4px ${neonColor}` }}>Variação Percentual</CardTitle> </CardHeader> <CardContent className="p-0"> <p className={`text-2xl font-bold ${percentDifference >= 0 ? "text-green-400" : "text-red-400"}`} style={{ textShadow: `0 0 6px ${percentDifference >= 0 ? neonGreenColor : neonRedColor}` }}> {percentDifference >= 0 ? "↑" : "↓"} {Math.abs(percentDifference).toFixed(2)}% </p> </CardContent> </Card> </div> <Card className={cn(cardStyle, "p-5")}> <CardHeader className="p-0 mb-4 border-b border-[#2d62a3]/30 pb-3"> <CardTitle className="text-lg font-semibold text-white flex items-center" style={{ textShadow: `0 0 6px ${neonColor}` }}> <LineChart size={20} className="mr-2" style={{ filter: `drop-shadow(0 0 4px ${neonColor})` }}/> Comparativo Diário </CardTitle> </CardHeader> <CardContent className="p-0"> <div className="flex items-center gap-4 mb-4 text-xs"> <div className="flex items-center"> <div className="w-3 h-3 rounded-sm mr-1.5" style={{ backgroundColor: neonColor }}></div> <span className="text-gray-300"> Período 1 ({period1.startDate} a {period1.endDate}) </span> </div> <div className="flex items-center"> <div className="w-3 h-3 rounded-sm mr-1.5" style={{ backgroundColor: neonGreenColor }}></div> <span className="text-gray-300"> Período 2 ({period2.startDate} a {period2.endDate}) </span> </div> </div> <div className="h-[300px] w-full overflow-hidden"> {renderLineChart()} </div> </CardContent> </Card> </>
            ) : (
              <Card className={cn(cardStyle, "flex items-center justify-center h-[400px] p-6")}> <div className="text-center"> <CalendarDays size={48} className="text-[#3a7ebf] opacity-30 mx-auto mb-4" style={{ filter: `drop-shadow(0 0 8px ${neonColor})` }}/> <p className="text-lg text-gray-300" style={{ textShadow: `0 0 4px ${neonColorMuted}` }}> Selecione dois períodos e clique em </p> <p className="text-lg font-semibold text-[#5ca2e2] mb-1" style={{ textShadow: `0 0 6px ${neonColor}` }}>"Comparar Períodos"</p> <p className="text-sm text-gray-500">para visualizar o comparativo de faturamento.</p> </div> </Card>
            )}
          </div>
        </div>
      </div>
      {/* Keyframes para animação do gráfico */}
      <style jsx global>{` @keyframes line-draw { to { stroke-dashoffset: 0; } } .animate-line-draw { animation: line-draw 1.5s ease-in-out forwards; } input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6) brightness(100%) sepia(100%) hue-rotate(180deg) saturate(500%); cursor: pointer; opacity: 0.8; transition: opacity 0.2s; } input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; } `}</style>
    </Layout>
  );
}