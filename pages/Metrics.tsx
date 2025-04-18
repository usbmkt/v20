// pages/Metrics.tsx
import React, { useState, useEffect, useCallback, Fragment } from 'react';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Layout from '@/components/layout';
import { Campaign } from '@/entities/Campaign';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Import RECHARTS components used
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, Download, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon, ArrowUpCircle, ArrowDownCircle, Activity, Loader2, AlertTriangle } from 'lucide-react';
import { format, subDays, parseISO, isValid, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import axios from 'axios';
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal } from 'lucide-react';
// Import custom components (ensure paths are correct)
import GaugeChart from '@/components/dashboard/GaugeChart';
import StatCard from '@/components/dashboard/StatCard';
import RadialDeviceChart from '@/components/dashboard/RadialDeviceChart';

// --- Tipos ---
interface MetricsTotals { clicks: number; impressions: number; conversions: number; cost: number; revenue: number; ctr: number; cpc: number; conversionRate: number; costPerConversion: number; roi: number; }
interface DailyMetric { date: string; clicks: number; impressions?: number; conversions: number; cost: number; revenue: number; roi?: number; ctr?: number; cpc?: number; conversionRate?: number; costPerConversion?: number; }
interface MetricsData { totals: MetricsTotals; dailyData: DailyMetric[]; chartImageUrl?: string | null; }
type CampaignOption = Pick<Campaign, 'id' | 'name'>;

// --- Constantes ---
const DEFAULT_PERIOD_DAYS = 30;
const DATE_FORMAT_DISPLAY = 'dd/MM/yyyy'; const DATE_FORMAT_AXIS = 'dd/MM'; const DATE_FORMAT_API = 'yyyy-MM-dd';

// --- Funções Auxiliares Globais ---
const fetchMetricsData = async (startDate: string, endDate: string, campaignId: string | null = null): Promise<MetricsData | null> => { try { const response = await axios.get('/api/metrics', { params: { startDate, endDate, campaignId } }); return response.data; } catch (error) { console.error("Erro ao buscar métricas da API:", error); throw error; } };
const formatMetricValue = (metricKey: string, value: any): string => { const numValue = Number(value); if (value === undefined || value === null || isNaN(numValue)) return 'N/A'; if (!isFinite(numValue)) return value > 0 ? '+Inf' : '-Inf'; const lowerMetricKey = metricKey.toLowerCase(); if (lowerMetricKey.includes('click') || lowerMetricKey.includes('impression') || lowerMetricKey.includes('conversion')) { return numValue.toLocaleString('pt-BR'); } if (lowerMetricKey.includes('ctr') || lowerMetricKey.includes('rate') || lowerMetricKey.includes('roi')) { return `${numValue.toFixed(1)}%`; } if (lowerMetricKey.includes('cpc') || lowerMetricKey.includes('cost') || lowerMetricKey.includes('revenue')) { return `R$ ${numValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`; } return numValue.toLocaleString('pt-BR', {maximumFractionDigits: 2}); };
const formatAxisTick = (value: any) => typeof value === 'number' ? value.toLocaleString('pt-BR', {maximumFractionDigits: 0}) : value;
const formatTooltipValue = (value: number, name: string) => [formatMetricValue(name, value), name];
const formatXAxis = (tickItem: string): string => { try { const date = parseISO(tickItem); return isValid(date) ? format(date, DATE_FORMAT_AXIS, { locale: ptBR }) : ''; } catch { return ''; } };


export default function MetricsPage() {
    // --- Estados e Hooks ---
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
    const [timeframe, setTimeframe] = useState<string>("30d");
    const [chartType, setChartType] = useState<string>("line");
    const [metricType, setMetricType] = useState<string>("performance");
    const [metricsData, setMetricsData] = useState<DailyMetric[]>([]);
    const [keyMetrics, setKeyMetrics] = useState<MetricsTotals>({ clicks: 0, impressions: 0, conversions: 0, ctr: 0, cpc: 0, conversionRate: 0, costPerConversion: 0, cost: 0, revenue: 0, roi: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [campaignsLoading, setCampaignsLoading] = useState<boolean>(true);
    const { toast } = useToast();
    const [error, setError] = useState<string | null>(null);
    const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});

    // --- Estilos ---
    const neonColor = '#1E90FF';
    const cardStyle = "bg-[#141414]/80 backdrop-blur-sm shadow-[5px_5px_10px_rgba(0,0,0,0.4),-5px_-5px_10px_rgba(255,255,255,0.05)] rounded-lg border-none";
    const neumorphicInputStyle = "bg-[#141414] text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] placeholder:text-gray-500 border-none focus:ring-2 focus:ring-[#1E90FF] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]";
    const neumorphicButtonStyle = "bg-[#141414] border-none text-white shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] hover:bg-[#1E90FF]/80 active:scale-[0.98] active:brightness-95 transition-all duration-150 ease-out";
    const neumorphicButtonPrimaryStyle = cn(neumorphicButtonStyle, "bg-[#1E90FF]/80 hover:bg-[#1E90FF]/100");
    const labelStyle = "text-sm text-gray-300";
    const titleStyle = "text-lg font-semibold text-white";
    const popoverContentStyle = `bg-[#1e2128] border-[${neonColor}]/30 text-white`;

    // --- Lógica ---
    useEffect(() => { if (!authLoading && !isAuthenticated) { router.push('/login'); return; } if (!authLoading && isAuthenticated) { if (campaigns.length === 0 && campaignsLoading) loadCampaigns(); else if (campaigns.length > 0) setCampaignsLoading(false); } }, [authLoading, isAuthenticated, router]); // Deps corretas
    const loadCampaigns = useCallback(async () => { setCampaignsLoading(true); try { const response = await axios.get<CampaignOption[]>('/api/campaigns?fields=id,name'); setCampaigns(response.data || []); } catch (error) { console.error('Erro ao carregar campanhas:', error); toast({ title: "Erro", description: "Falha ao carregar campanhas.", variant: "destructive" }); } finally { setCampaignsLoading(false); } }, [toast]);
    const loadMetricsData = useCallback(async (isRefresh = false) => { if (!isAuthenticated) return; if (!isRefresh) setLoading(true); else setRefreshing(true); setError(null); const days = parseInt(timeframe.replace('d', ''), 10); const endDate = new Date(); const startDate = subDays(endDate, days - 1); const startDateStr = format(startDate, DATE_FORMAT_API); const endDateStr = format(endDate, DATE_FORMAT_API); const campIdToSend = selectedCampaignId === 'all' ? null : selectedCampaignId; try { console.log(`[Load Metrics] Fetching for: ${startDateStr} to ${endDateStr}, Camp: ${campIdToSend || 'All'}`); const data = await fetchMetricsData(startDateStr, endDateStr, campIdToSend); if (data && data.totals && data.dailyData) { setMetricsData(data.dailyData || []); setKeyMetrics(data.totals); if (isRefresh) toast({ title: "Métricas Atualizadas", duration: 2000 }); console.log("[Load Metrics] Data loaded:", data); } else { console.warn("[Load Metrics] No data returned from API."); setMetricsData([]); setKeyMetrics({ clicks: 0, impressions: 0, conversions: 0, ctr: 0, cpc: 0, conversionRate: 0, costPerConversion: 0, cost: 0, revenue: 0, roi: 0 }); setError("Nenhum dado encontrado para os filtros selecionados."); } } catch (error: any) { console.error('Erro ao carregar métricas:', error); setError(error.message || 'Falha ao buscar dados.'); toast({ title: "Erro Métricas", description: error.message || "Falha ao carregar dados.", variant: "destructive" }); setMetricsData([]); setKeyMetrics({ clicks: 0, impressions: 0, conversions: 0, ctr: 0, cpc: 0, conversionRate: 0, costPerConversion: 0, cost: 0, revenue: 0, roi: 0 }); } finally { if (!isRefresh) setLoading(false); else setRefreshing(false); } }, [timeframe, selectedCampaignId, toast, isAuthenticated]);
    useEffect(() => { if (isAuthenticated) { loadMetricsData(); } }, [selectedCampaignId, timeframe, isAuthenticated, loadMetricsData]);
    const getChartData = () => metricsData;
    const getChartConfig = () => { const colors = { clicks: "#3b82f6", conversions: "#22c55e", ctr: "#eab308", cpc: "#f97316", costPerConversion: "#a855f7", cost: "#ef4444", revenue: "#0ea5e9", roi: "#14b8a6" }; const metricsMap: { [key: string]: { key: keyof DailyMetric | keyof MetricsTotals; name: string; color: string }[] } = { performance: [ { key: "clicks", name: "Cliques", color: colors.clicks }, { key: "conversions", name: "Conversões", color: colors.conversions }, { key: "ctr", name: "CTR (%)", color: colors.ctr } ], costs: [ { key: "cpc", name: "CPC (R$)", color: colors.cpc }, { key: "costPerConversion", name: "Custo/Conv. (R$)", color: colors.costPerConversion }, { key: "cost", name: "Custo Total (R$)", color: colors.cost } ], revenue: [ { key: "revenue", name: "Receita (R$)", color: colors.revenue }, { key: "roi", name: "ROI (%)", color: colors.roi } ] }; return metricsMap[metricType] || metricsMap.performance; };
    const toggleCardExpansion = (cardId: string) => { setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] })); };
    const getKeyMetricStatus = (metric: keyof MetricsTotals): 'positive' | 'neutral' | 'negative' => { const value = keyMetrics[metric]; if (!Number.isFinite(value)) return 'neutral'; switch (metric) { case 'ctr': return value > 2 ? 'positive' : value > 1 ? 'neutral' : 'negative'; case 'cpc': return value < 1 ? 'positive' : value < 2 ? 'neutral' : 'negative'; case 'conversionRate': return value > 5 ? 'positive' : value > 2 ? 'neutral' : 'negative'; case 'roi': return value > 200 ? 'positive' : value > 100 ? 'neutral' : 'negative'; default: return 'neutral'; } };

    // --- Renderização do Chart (CORRIGIDO COM FRAGMENT EM TODOS) ---
    const renderChart = () => {
        const data = getChartData();
        const config = getChartConfig();
        const axisTickColor = "#a0aec0"; const gridColor = "#1E90FF33";
        const tooltipBg = "rgba(20, 20, 20, 0.85)"; const tooltipBorder = `${neonColor}66`;
        if (!data || data.length === 0) return <div className="flex items-center justify-center h-[400px] text-gray-500">Sem dados para exibir para o período/campanha.</div>;

        if (chartType === "line") {
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={data} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                        {/* Envolve com Fragment */}
                        <Fragment>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fill: axisTickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={formatAxisTick} tick={{ fill: axisTickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '6px', backdropFilter: 'blur(4px)', boxShadow: '5px 5px 10px rgba(0,0,0,0.4)' }} labelStyle={{ color: '#a0aec0', fontSize: '11px', marginBottom: '4px' }} itemStyle={{ color: 'white', fontSize: '12px' }} formatter={formatTooltipValue} />
                            <Legend wrapperStyle={{ color: axisTickColor, fontSize: '11px', paddingTop: '10px' }} />
                            {config.map(metric => ( <Line key={metric.key} type="monotone" dataKey={metric.key} name={metric.name} stroke={metric.color} strokeWidth={2.5} dot={false} activeDot={{ r: 6, strokeWidth: 1, fill: metric.color, stroke: '#fff' }} style={{ filter: `drop-shadow(0 0 4px ${metric.color})` }}/> ))}
                        </Fragment>
                    </LineChart>
                </ResponsiveContainer>
            );
        } else if (chartType === "bar") {
             return (
                 <ResponsiveContainer width="100%" height={400}>
                     <BarChart data={data} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                         {/* Envolve com Fragment */}
                         <Fragment>
                             <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                             <XAxis dataKey="date" tickFormatter={formatXAxis} tick={{ fill: axisTickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                             <YAxis tickFormatter={formatAxisTick} tick={{ fill: axisTickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                             <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '6px', backdropFilter: 'blur(4px)', boxShadow: '5px 5px 10px rgba(0,0,0,0.4)' }} labelStyle={{ color: '#a0aec0', fontSize: '11px', marginBottom: '4px' }} itemStyle={{ color: 'white', fontSize: '12px' }} formatter={formatTooltipValue} />
                             <Legend wrapperStyle={{ color: axisTickColor, fontSize: '11px', paddingTop: '10px' }} />
                             {config.map(metric => ( <Bar key={metric.key} dataKey={metric.key} name={metric.name} fill={metric.color} radius={[3, 3, 0, 0]} fillOpacity={0.8} style={{ filter: `drop-shadow(0 0 3px ${metric.color}88)` }}/> ))}
                         </Fragment>
                     </BarChart>
                 </ResponsiveContainer>
             );
        } else if (chartType === "pie") {
            const pieData = config.map(metric => { const totalValue = keyMetrics[metric.key as keyof typeof keyMetrics] ?? 0; if (['ctr', 'cpc', 'conversionRate', 'costPerConversion', 'roi'].includes(metric.key as string)) { return null; } return { name: metric.name, value: totalValue, color: metric.color }; }).filter((d): d is { name: string; value: number; color: string } => d !== null && d.value > 0);
            if (pieData.length === 0) return <div className="flex items-center justify-center h-[400px] text-gray-500">Sem dados agregados para gráfico Pizza</div>;
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                         {/* Envolve com Fragment */}
                        <Fragment>
                            <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={140} innerRadius={60} fill="#8884d8" dataKey="value" paddingAngle={2} stroke="none" >
                                {pieData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} style={{ filter: `drop-shadow(0 0 5px ${entry.color})` }}/> ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '6px', backdropFilter: 'blur(4px)', boxShadow: '5px 5px 10px rgba(0,0,0,0.4)' }} labelStyle={{ color: '#a0aec0', fontSize: '11px', marginBottom: '4px' }} itemStyle={{ color: 'white', fontSize: '12px' }} formatter={(value: number, name: string) => [formatMetricValue(name, value), name]} />
                            <Legend wrapperStyle={{ color: axisTickColor, fontSize: '11px', paddingTop: '10px' }} />
                        </Fragment>
                    </PieChart>
                </ResponsiveContainer>
            );
        }
        return null;
    };
    // -----------------------------------------------------

    // --- Renderização ---
    if (authLoading || loading) { /* ... (loading JSX) ... */ }
    if (!isAuthenticated) { return null; }

    return (
        <Layout>
            <Head> <title>Métricas - USBMKT</title> </Head>
            <div className="space-y-4 p-4 md:p-6">
                <h1 className="text-2xl font-black text-white mb-4" style={{ textShadow: `0 0 8px ${neonColor}` }}> Métricas de Campanha </h1>
                <div className="flex flex-col space-y-4">
                    {/* Controls Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                         <Card className={cn(cardStyle)}> <CardContent className="p-3"> <Label htmlFor="campaign_select_metrics" className={cn(labelStyle, "mb-1 block")} style={{ textShadow: `0 0 4px ${neonColor}` }}>Campanha</Label> <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId} disabled={loading || campaignsLoading}> <SelectTrigger id="campaign_select_metrics" className={cn(neumorphicInputStyle, "w-full h-9 px-3 py-2 text-sm")}> <SelectValue placeholder={campaignsLoading ? "Carregando..." : "Selecione..."} /> </SelectTrigger> <SelectContent className="bg-[#1e2128] border-[#1E90FF]/30 text-white"> {campaignsLoading ? ( <SelectItem value="loading" disabled>Carregando...</SelectItem> ) : ( <> <SelectItem value="all" className="text-xs hover:bg-[#1E90FF]/20 focus:bg-[#1E90FF]/20">Todas Campanhas</SelectItem> {campaigns.length > 0 ? campaigns.map((c) => ( <SelectItem key={c.id} value={c.id.toString()} className="text-xs hover:bg-[#1E90FF]/20 focus:bg-[#1E90FF]/20">{c.name}</SelectItem> )) : ( <SelectItem value="no-camps" disabled>Nenhuma</SelectItem> )} </> )} </SelectContent> </Select> </CardContent> </Card>
                         <Card className={cn(cardStyle)}> <CardContent className="p-3"> <Label htmlFor="timeframe_select_metrics" className={cn(labelStyle, "mb-1 block")} style={{ textShadow: `0 0 4px ${neonColor}` }}>Período</Label> <Select value={timeframe} onValueChange={setTimeframe}> <SelectTrigger id="timeframe_select_metrics" className={cn(neumorphicInputStyle, "w-full h-9 px-3 py-2 text-sm")}> <SelectValue /> </SelectTrigger> <SelectContent className="bg-[#1e2128] border-[#1E90FF]/30 text-white"> <SelectItem value="7d" className="text-xs hover:bg-[#1E90FF]/20 focus:bg-[#1E90FF]/20">Últimos 7 dias</SelectItem> <SelectItem value="14d" className="text-xs hover:bg-[#1E90FF]/20 focus:bg-[#1E90FF]/20">Últimos 14 dias</SelectItem> <SelectItem value="30d" className="text-xs hover:bg-[#1E90FF]/20 focus:bg-[#1E90FF]/20">Últimos 30 dias</SelectItem> <SelectItem value="90d" className="text-xs hover:bg-[#1E90FF]/20 focus:bg-[#1E90FF]/20">Últimos 90 dias</SelectItem> </SelectContent> </Select> </CardContent> </Card>
                         <Card className={cn(cardStyle)}> <CardContent className="p-3"> <Label htmlFor="metric_type_select_metrics" className={cn(labelStyle, "mb-1 block")} style={{ textShadow: `0 0 4px ${neonColor}` }}>Tipo Métrica</Label> <Select value={metricType} onValueChange={setMetricType}> <SelectTrigger id="metric_type_select_metrics" className={cn(neumorphicInputStyle, "w-full h-9 px-3 py-2 text-sm")}> <SelectValue /> </SelectTrigger> <SelectContent className="bg-[#1e2128] border-[#1E90FF]/30 text-white"> <SelectItem value="performance" className="text-xs hover:bg-[#1E90FF]/20 focus:bg-[#1E90FF]/20">Performance</SelectItem> <SelectItem value="costs" className="text-xs hover:bg-[#1E90FF]/20 focus:bg-[#1E90FF]/20">Custos</SelectItem> <SelectItem value="revenue" className="text-xs hover:bg-[#1E90FF]/20 focus:bg-[#1E90FF]/20">Receita & ROI</SelectItem> </SelectContent> </Select> </CardContent> </Card>
                         <Card className={cn(cardStyle)}> <CardContent className="p-3"> <Label className={cn(labelStyle, "mb-1 block")} style={{ textShadow: `0 0 4px ${neonColor}` }}>Visualização</Label> <div className="flex space-x-2"> <Button variant="outline" size="icon" className={cn(chartType === "line" ? neumorphicButtonPrimaryStyle : neumorphicButtonStyle, "h-9 w-9")} onClick={() => setChartType("line")} title="Gráfico de Linha"> <LineChartIcon className="h-4 w-4" style={{ filter: `drop-shadow(0 0 3px ${neonColor})` }}/> </Button> <Button variant="outline" size="icon" className={cn(chartType === "bar" ? neumorphicButtonPrimaryStyle : neumorphicButtonStyle, "h-9 w-9")} onClick={() => setChartType("bar")} title="Gráfico de Barra"> <BarChart2 className="h-4 w-4" style={{ filter: `drop-shadow(0 0 3px ${neonColor})` }}/> </Button> <Button variant="outline" size="icon" className={cn(chartType === "pie" ? neumorphicButtonPrimaryStyle : neumorphicButtonStyle, "h-9 w-9")} onClick={() => setChartType("pie")} title="Gráfico de Pizza"> <PieChartIcon className="h-4 w-4" style={{ filter: `drop-shadow(0 0 3px ${neonColor})` }}/> </Button> <Button variant="outline" size="icon" className={cn(neumorphicButtonStyle, "ml-auto h-9 w-9")} onClick={() => loadMetricsData(true)} disabled={refreshing || loading || !selectedCampaignId} title="Atualizar Dados"> <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} style={{ filter: `drop-shadow(0 0 3px ${neonColor})` }}/> </Button> </div> </CardContent> </Card>
                    </div>

                    {/* Key Metrics Row */}
                    {!loading && !error && Object.keys(keyMetrics).length > 0 && (
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* ... Cards Key Metrics ... */}
                         </div>
                     )}

                    {/* Error State */}
                     {!loading && error && ( <Card className="flex flex-col justify-center items-center py-8 text-center bg-[#141414] border-none shadow-[5px_5px_10px_rgba(0,0,0,0.4),-5px_-5px_10px_rgba(255,255,255,0.05)] rounded-lg"> {/* ... Error Content ... */} </Card> )}

                    {/* Main Chart Card */}
                    <Card className={cn(cardStyle)}>
                        <CardHeader className="pt-4 pb-2"> <CardTitle className={cn(titleStyle)} style={{ textShadow: `0 0 6px ${neonColor}` }}> {metricType === "performance" ? "Visão de Performance" : metricType === "costs" ? "Análise de Custos" : "Análise de Receita & ROI"} <span className="text-sm font-normal text-gray-400 ml-2">({timeframe === "7d" ? "7 dias" : timeframe === "14d" ? "14 dias" : timeframe === "30d" ? "30 dias" : "90 dias"})</span> </CardTitle> </CardHeader>
                        <CardContent> {loading && !refreshing ? ( <div className="flex flex-col items-center justify-center h-[400px] text-center"> <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" /> <span className="text-sm text-gray-400">Carregando dados...</span> </div> ) : refreshing ? ( <div className="flex items-center justify-center h-[400px]"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div> ) : ( renderChart() )} </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}