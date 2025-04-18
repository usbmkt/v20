// pages/Suggestions.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import type { Campaign } from '@/entities/Campaign';
// import { InvokeLLM } from '@/integrations/core'; // Assuming this exists, though not used directly
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, TrendingUp, DollarSign, Target, Copy as CopyIcon, RefreshCw, BrainCircuit, Save, Clock, Star, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import Layout from '@/components/layout';
import { cn } from "@/lib/utils";
import axios from 'axios';

interface Suggestion {
  id?: string;
  title?: string;
  description?: string;
  justification?: string;
  estimated_impact?: string;
  recommended_action?: string;
  budget_allocation?: string;
  expected_roi?: string;
  implementation_timeline?: string;
  ad_title?: string;
  ad_description?: string;
  cta?: string;
  target_audience?: string;
  persuasion_technique?: string;
  strategy_title?: string;
  recommended_segments?: string;
  estimated_audience_size?: string;
  type?: string;
  date?: string;
  content?: string;
}

interface ExtendedCampaign extends Campaign {
  impressions?: number;
  clicks?: number;
  leads?: number;
  sales?: number;
  revenue?: number;
  objective?: string;
  platform?: string;
  industry?: string;
  targetAudience?: string;
  segmentation?: string;
  daily_budget?: number;
  duration?: number;
}

interface CampaignWithCopies extends ExtendedCampaign {
  copies?: any[];
}

type CampaignOption = Pick<Campaign, 'id' | 'name'>;

export default function SuggestionsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedCampaignData, setSelectedCampaignData] = useState<CampaignWithCopies | null>(null);
  const [metrics, setMetrics] = useState({ ctr: 0, cpc: 0, conversionRate: 0, roi: 0, costPerLead: 0 });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [generatingSuggestions, setGeneratingSuggestions] = useState<boolean>(false);
  const [savedSuggestions, setSavedSuggestions] = useState<Suggestion[]>([]);
  const [suggestionType, setSuggestionType] = useState<string>("performance");
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState<boolean>(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const { toast } = useToast();

  const neonColor = '#1E90FF'; const neonColorMuted = '#4682B4';
  const cardStyle = "bg-[#141414]/80 backdrop-blur-sm shadow-[5px_5px_10px_rgba(0,0,0,0.4),-5px_-5px_10px_rgba(255,255,255,0.05)] rounded-lg border-none";
  const neumorphicInputStyle = "bg-[#141414] text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] placeholder:text-gray-500 border-none focus:ring-2 focus:ring-[#1E90FF] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]";
  const neumorphicButtonStyle = "bg-[#141414] border-none text-white shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] hover:bg-[#1E90FF]/80 active:scale-[0.98] active:brightness-95 transition-all duration-150 ease-out";
  const neumorphicOutlineButtonStyle = cn(neumorphicButtonStyle, "bg-transparent border border-[#1E90FF]/30 hover:bg-[#1E90FF]/20 text-[#1E90FF] hover:text-white");
  const titleStyle = "text-lg font-semibold text-white";

  const fetchCampaignOptionsClient = useCallback(async () => { setIsLoadingCampaigns(true); try { const response = await axios.get<CampaignOption[]>('/api/campaigns?fields=id,name'); setCampaignOptions(response.data || []); if (response.data && response.data.length > 0 && !selectedCampaignId) { /* No auto-select */ } else if (!response.data || response.data.length === 0) { setSelectedCampaignId(''); } } catch (error: any) { console.error('Erro ao buscar opções de campanha:', error); toast({ title: "Erro", description: "Falha ao buscar campanhas.", variant: "destructive" }); setCampaignOptions([]); } finally { setIsLoadingCampaigns(false); } }, [toast, selectedCampaignId]);
  const loadSavedSuggestions = useCallback(() => { try { const saved = localStorage.getItem('savedSuggestions'); setSavedSuggestions(saved ? JSON.parse(saved) : []); } catch (error) { console.error("Failed to load/parse saved suggestions:", error); localStorage.removeItem('savedSuggestions'); setSavedSuggestions([]);} }, []);
  const loadCampaignDataAndMetrics = useCallback(async (campaignId: string) => { if (!campaignId) { setSelectedCampaignData(null); setMetrics({ ctr: 0, cpc: 0, conversionRate: 0, roi: 0, costPerLead: 0 }); setSuggestions([]); return; } setIsLoadingDetails(true); setSuggestions([]); try { const campResponse = await axios.get(`/api/campaigns?id=${campaignId}`); if (!campResponse.data) throw new Error('Campanha não encontrada.'); const campaignData: ExtendedCampaign = campResponse.data; const copiesResponse = await axios.get(`/api/copies?campaign_id=${campaignId}`); const copiesData: any[] = copiesResponse.data || []; const campaignWithCopies: CampaignWithCopies = { ...campaignData, copies: copiesData }; setSelectedCampaignData(campaignWithCopies); const { impressions = 0, clicks = 0, leads = 0, sales = 0, budget = 0, revenue = 0 } = campaignWithCopies; const imps = impressions || Math.random() * 10000 + 5000; const clks = clicks || imps * (Math.random() * 0.03 + 0.01); const lds = leads || clks * (Math.random() * 0.1 + 0.05); const sls = sales || lds * (Math.random() * 0.2 + 0.05); const bud = budget || Math.random() * 500 + 100; const rev = revenue || sls * (Math.random() * 50 + 20); const calculatedCtr = imps > 0 ? (clks / imps * 100) : 0; const calculatedCpc = clks > 0 ? (bud / clks) : 0; const calculatedConvRate = lds > 0 ? (sls / lds * 100) : 0; const calculatedRoi = bud > 0 ? ((rev - bud) / bud * 100) : 0; const calculatedCpl = lds > 0 ? (bud / lds) : 0; setMetrics({ ctr: parseFloat(calculatedCtr.toFixed(1)) || 0, cpc: parseFloat(calculatedCpc.toFixed(2)) || 0, conversionRate: parseFloat(calculatedConvRate.toFixed(1)) || 0, roi: parseFloat(calculatedRoi.toFixed(0)) || 0, costPerLead: parseFloat(calculatedCpl.toFixed(2)) || 0 }); } catch (error: any) { console.error('Erro ao carregar dados/métricas da campanha:', error); toast({ title: "Erro", description: `Falha ao carregar dados: ${error.message}`, variant: "destructive" }); setSelectedCampaignData(null); setMetrics({ ctr: 0, cpc: 0, conversionRate: 0, roi: 0, costPerLead: 0 }); } finally { setIsLoadingDetails(false); } }, [toast]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log(`[Auth Guard /Suggestions] Usuário não autenticado, redirecionando para /login`);
      router.push('/login');
    }
    if (!authLoading && isAuthenticated) {
      fetchCampaignOptionsClient(); // Fetch on load if authenticated
      loadSavedSuggestions(); // Load saved on load if authenticated
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, router]); // Removed internal state setters from deps

  useEffect(() => {
    if (isAuthenticated && selectedCampaignId) {
      loadCampaignDataAndMetrics(selectedCampaignId);
    } else if (!selectedCampaignId) {
      setSelectedCampaignData(null);
      setMetrics({ ctr: 0, cpc: 0, conversionRate: 0, roi: 0, costPerLead: 0 });
      setSuggestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId, isAuthenticated]); // loadCampaignDataAndMetrics is stable due to useCallback

  const generateSuggestions = async () => { if (!selectedCampaignData) { toast({ title: "Aviso", description: "Selecione uma campanha.", variant: "default" }); return; } setGeneratingSuggestions(true); setSuggestions([]); const promptContext = ` Campanha: ${selectedCampaignData.name || 'N/A'} Objetivo: ${selectedCampaignData.objective || 'N/A'} Plataforma: ${selectedCampaignData.platform || 'N/A'} Indústria: ${selectedCampaignData.industry || 'N/A'} Público: ${selectedCampaignData.targetAudience || 'N/A'} Segmentação: ${selectedCampaignData.segmentation || 'N/A'} Orçamento Total: R$ ${selectedCampaignData.budget?.toFixed(2) || 'N/A'} Orçamento Diário: R$ ${selectedCampaignData.daily_budget?.toFixed(2) || 'N/A'} Duração: ${selectedCampaignData.duration || 'N/A'} dias Métricas: CTR: ${metrics.ctr.toFixed(1)}%, CPC: R$ ${metrics.cpc.toFixed(2)}, Conv. Lead->Venda: ${metrics.conversionRate.toFixed(1)}%, ROI: ${metrics.roi.toFixed(0)}%, CPL: R$ ${metrics.costPerLead.toFixed(2)} Cópias: ${selectedCampaignData.copies && selectedCampaignData.copies.length > 0 ? selectedCampaignData.copies.map((copy, i) => `Cópia ${i + 1}: Título:"${copy.title}", CTA:"${copy.cta}"`).join('; ') : 'Nenhuma.'} Gere 3 a 5 sugestões detalhadas de ${suggestionType} para otimizar esta campanha. Justifique com base nos dados. Formato: array JSON de objetos com campos relevantes (type, title, description, justification, estimated_impact, recommended_action, etc.). `; try { const llmResponse = await axios.post('/api/llm', { prompt: promptContext, temperature: 0.7, maxTokens: 800 }); let generatedSuggestions: Suggestion[] = []; if (llmResponse.data?.response) { try { let responseText = llmResponse.data.response.trim(); if (responseText.startsWith('```json')) { responseText = responseText.substring(7); } if (responseText.endsWith('```')) { responseText = responseText.substring(0, responseText.length - 3); } responseText = responseText.trim(); const parsed = JSON.parse(responseText); generatedSuggestions = Array.isArray(parsed) ? parsed : [parsed]; } catch (parseError) { console.error("Erro parsear IA:", parseError, "\nResposta:", llmResponse.data.response); generatedSuggestions = [{ id: 's-err', type: 'error', title: 'Erro Formato IA', description: 'Resposta em formato inesperado.', justification: llmResponse.data.response.substring(0, 200) + '...' }]; } } else { throw new Error("Resposta IA vazia."); } setSuggestions(generatedSuggestions.map((s, i) => ({ ...s, id: s.id || `s-${Date.now()}-${i}`, type: s.type || suggestionType }))); toast({ title: "Sucesso", description: `Sugestões geradas.` }); } catch (error: any) { console.error('Erro gerar sugestões:', error); toast({ title: "Erro IA", description: `Falha: ${error.response?.data?.error || error.message}`, variant: "destructive" }); setSuggestions([]); } finally { setGeneratingSuggestions(false); } };

  // *** CHECK THIS FUNCTION CAREFULLY FOR BRACES ***
  const saveSuggestion = (suggestion: Suggestion) => {
    const now = new Date();
    const suggestionWithMeta: Suggestion = { // Ensure Suggestion type includes date/content or use a different type
      ...suggestion,
      id: suggestion.id || `s-${Date.now()}`,
      date: now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'}),
      content: suggestion.description || suggestion.recommended_action || 'Detalhes indisponíveis',
    };
    const updatedSaved = [suggestionWithMeta, ...savedSuggestions];
    setSavedSuggestions(updatedSaved);
    try {
      localStorage.setItem('savedSuggestions', JSON.stringify(updatedSaved));
      toast({ title: "Salvo", description: `Sugestão salva.` });
    } catch (error) { // Make sure this block is complete
      console.error("Failed to save suggestions to localStorage:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a sugestão localmente.", variant: "destructive" });
    } // <<< THIS BRACE MUST EXIST AND MATCH THE 'try'
  }; // <<< THIS BRACE MUST EXIST AND MATCH THE FUNCTION DEFINITION

  const getTypeIcon = (type: string | undefined) => { const iconProps = { className: "h-5 w-5 text-[#1E90FF] mt-0.5 shrink-0", style: { filter: `drop-shadow(0 0 3px ${neonColor})` } }; switch (type) { case 'performance': return <TrendingUp {...iconProps} />; case 'budget': return <DollarSign {...iconProps} />; case 'copy': return <CopyIcon {...iconProps} />; case 'targeting': return <Target {...iconProps} />; default: return <Lightbulb {...iconProps} />; } };
  const renderSuggestionContent = (suggestion: Suggestion) => { const fields = [ { label: "Descrição", value: suggestion.description }, { label: "Justificativa", value: suggestion.justification }, { label: "Impacto Estimado", value: suggestion.estimated_impact }, { label: "Ação Recomendada", value: suggestion.recommended_action }, { label: "Título Anúncio", value: suggestion.ad_title, type: 'copy' }, { label: "Descrição Anúncio", value: suggestion.ad_description, type: 'copy' }, { label: "CTA", value: suggestion.cta, type: 'copy' }, { label: "Público Alvo (Copy)", value: suggestion.target_audience, type: 'copy' }, { label: "Técnica de Persuasão", value: suggestion.persuasion_technique, type: 'copy' }, { label: "Título Estratégia", value: suggestion.strategy_title, type: 'targeting' }, { label: "Segmentos Recomendados", value: suggestion.recommended_segments, type: 'targeting' }, { label: "Alocação Orçamento", value: suggestion.budget_allocation, type: 'budget' }, { label: "ROI Esperado", value: suggestion.expected_roi, type: 'budget' }, { label: "Período Implementação", value: suggestion.implementation_timeline, type: 'budget' }, ]; const filteredFields = fields.filter(f => f.value && (!f.type || f.type === suggestion.type)); return ( <div className="space-y-2"> <div className="flex justify-between items-start"> <div className="flex items-start gap-2"> {getTypeIcon(suggestion.type)} <h4 className="text-base font-semibold text-white" style={{ textShadow: `0 0 4px ${neonColorMuted}` }}>{suggestion.title || "Sugestão"}</h4> </div> <Button variant="ghost" size="sm" className={cn(neumorphicOutlineButtonStyle, "h-7 px-2")} onClick={() => saveSuggestion(suggestion)}> <Save className="h-3.5 w-3.5 mr-1" /> Salvar </Button> </div> {filteredFields.map(field => ( <div key={field.label} className="text-sm"> <strong className="text-gray-300 font-medium block mb-0.5">{field.label}:</strong> <p className="text-gray-400 whitespace-pre-wrap">{field.value}</p> </div> ))} </div> ); };

  const isLoading = isLoadingCampaigns || isLoadingDetails || generatingSuggestions;

  if (authLoading) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Verificando acesso...</span>
        </div>
      </Layout>
    );
  }
  if (!isAuthenticated) { return null; } // Or a redirect component/logic

  return (
    <Layout>
      <Head> <title>Sugestões Inteligentes - USBMKT</title> </Head>
      <div className="space-y-4 p-4 md:p-6"> {/* Added padding */}
        <h1 className="text-2xl font-black text-white mb-4" style={{ textShadow: `0 0 8px ${neonColor}` }}> Sugestões Inteligentes </h1>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Controls Column */}
          <div className="lg:col-span-1 space-y-4">
            <Card className={cn(cardStyle, "p-3")}>
              <CardHeader className="p-0 pb-3 mb-3 border-b border-[#1E90FF]/20"> <CardTitle className={titleStyle} style={{ textShadow: `0 0 6px ${neonColor}` }}> Controles </CardTitle> </CardHeader>
              <CardContent className="p-0 space-y-3">
                {/* Campaign Select */}
                <div className="space-y-1">
                  <Label htmlFor="campaign_select_sugg" className="text-sm text-gray-300 pl-1" style={{ textShadow: `0 0 4px ${neonColorMuted}` }}>Campanha</Label>
                  <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId} disabled={isLoadingCampaigns || generatingSuggestions}>
                    <SelectTrigger id="campaign_select_sugg" className={cn(neumorphicInputStyle, "w-full h-9 px-3 py-2 text-sm")}>
                      <SelectValue placeholder={isLoadingCampaigns ? "Carregando..." : "Selecione..."} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141414] border-[#1E90FF]/50 text-white shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                      {isLoadingCampaigns && <div className="px-3 py-2 text-sm text-gray-500 flex items-center"><Loader2 className="h-4 w-4 animate-spin mr-2"/>Carregando...</div>}
                      {!isLoadingCampaigns && campaignOptions.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">Nenhuma campanha encontrada.</div>}
                      {campaignOptions.map(campaign => (
                        <SelectItem key={String(campaign.id)} value={String(campaign.id)} className="hover:bg-[#1E90FF]/20 focus:bg-[#1E90FF]/30 text-sm cursor-pointer">
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="bg-[#1E90FF]/20" />
                {/* Current Metrics */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2 pl-1" style={{ textShadow: `0 0 4px ${neonColorMuted}` }}>Métricas Atuais</h3>
                  {isLoadingDetails ? (
                    <div className="text-xs text-gray-500 px-1 py-4 text-center flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin mr-1" /> Carregando...</div>
                  ) : selectedCampaignData ? (
                    <div className="space-y-1.5 px-1">
                      <div className="flex justify-between text-xs"><span className="text-gray-400">CTR:</span> <span className="text-white">{metrics.ctr.toFixed(1)}%</span></div>
                      <Progress value={metrics.ctr * 10} className="h-1 bg-[#141414] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] [&>div]:bg-[#1E90FF]" />
                      <div className="flex justify-between text-xs"><span className="text-gray-400">CPC:</span> <span className="text-white">R$ {metrics.cpc.toFixed(2)}</span></div>
                      <Progress value={Math.max(0, 100 - (metrics.cpc / 5 * 100))} className="h-1 bg-[#141414] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] [&>div]:bg-[#1E90FF]" />
                      <div className="flex justify-between text-xs"><span className="text-gray-400">Conversão:</span> <span className="text-white">{metrics.conversionRate.toFixed(1)}%</span></div>
                      <Progress value={metrics.conversionRate * 10} className="h-1 bg-[#141414] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] [&>div]:bg-[#1E90FF]" />
                      <div className="flex justify-between text-xs"><span className="text-gray-400">ROI:</span> <span className="text-white">{metrics.roi.toFixed(0)}%</span></div>
                      <Progress value={Math.min(100, Math.max(0, metrics.roi / 3))} className="h-1 bg-[#141414] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] [&>div]:bg-[#1E90FF]" />
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 px-1 py-4 text-center italic">Selecione uma campanha para ver as métricas.</div>
                  )}
                </div>
                <Separator className="bg-[#1E90FF]/20" />
                {/* Suggestion Type */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-gray-300 pl-1" style={{ textShadow: `0 0 4px ${neonColorMuted}` }}>Tipo de Sugestão</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { value: 'performance', label: 'Performance', icon: TrendingUp },
                      { value: 'budget', label: 'Orçamento', icon: DollarSign },
                      { value: 'copy', label: 'Copys', icon: CopyIcon },
                      { value: 'targeting', label: 'Targeting', icon: Target }
                    ].map(type => (
                      <Button
                        key={type.value}
                        variant="outline"
                        size="sm"
                        className={cn(
                          neumorphicButtonStyle,
                          "justify-start gap-2 text-sm h-8",
                          suggestionType === type.value ? 'bg-[#1E90FF]/30 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)]' : 'bg-[#141414]/50 hover:bg-[#1E90FF]/10'
                        )}
                        onClick={() => setSuggestionType(type.value)}
                        disabled={generatingSuggestions}
                      >
                        <type.icon className="h-3.5 w-3.5" style={{ filter: `drop-shadow(0 0 3px ${neonColorMuted})` }} />
                        <span style={{ textShadow: `0 0 4px ${neonColorMuted}` }}>{type.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Generate Button */}
                <Button
                  onClick={generateSuggestions}
                  disabled={isLoading || !selectedCampaignId || !selectedCampaignData}
                  className={cn(neumorphicButtonStyle, "w-full mt-3 bg-[#1E90FF]/80 hover:bg-[#1E90FF] h-9")}
                >
                  {generatingSuggestions ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" style={{ filter: `drop-shadow(0 0 3px ${neonColor})` }} />
                      <span style={{ textShadow: `0 0 4px ${neonColor}` }}>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="mr-2 h-4 w-4" style={{ filter: `drop-shadow(0 0 3px ${neonColor})` }} />
                      <span style={{ textShadow: `0 0 4px ${neonColor}` }}>Gerar Sugestões</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Saved Suggestions */}
            <Card className={cn(cardStyle, "p-3")}>
              <CardHeader className="p-0 pb-3 mb-3 border-b border-[#1E90FF]/20">
                <CardTitle className={titleStyle} style={{ textShadow: `0 0 6px ${neonColor}` }}> Sugestões Salvas </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[200px] pr-2">
                  {savedSuggestions.length === 0 ? (
                    <div className="text-center py-6">
                      <Star className="mx-auto h-7 w-7 text-gray-500 mb-1.5" style={{ filter: `drop-shadow(0 0 3px ${neonColorMuted})` }} />
                      <p className="text-gray-400 text-sm">Nenhuma sugestão salva ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {savedSuggestions.map(suggestion => (
                        <Card key={suggestion.id} className="bg-[#141414]/50 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.03)] border-none cursor-pointer hover:bg-[#1E90FF]/10 transition-colors">
                          <CardContent className="p-2 space-y-0.5">
                            <div className="flex items-start gap-1.5">
                              {getTypeIcon(suggestion.type)}
                              <div>
                                <h4 className="text-sm font-medium text-white leading-tight">{suggestion.title}</h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {suggestion.date}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2">{suggestion.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Generated Suggestions Column */}
          <div className="lg:col-span-2">
            <Card className={cn(cardStyle, "p-3")}>
              <CardHeader className="p-0 pb-3 mb-3 border-b border-[#1E90FF]/20">
                <CardTitle className={titleStyle} style={{ textShadow: `0 0 6px ${neonColor}` }}>
                  Sugestões Geradas ({suggestionType.charAt(0).toUpperCase() + suggestionType.slice(1)})
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm" style={{ textShadow: `0 0 4px ${neonColorMuted}` }}>
                  Baseadas na campanha e métricas selecionadas.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {generatingSuggestions ? (
                  <div className="py-10 text-center min-h-[550px] flex flex-col items-center justify-center">
                    <Loader2 className="mx-auto h-9 w-9 text-[#1E90FF] animate-spin" style={{ filter: `drop-shadow(0 0 4px ${neonColor})` }} />
                    <p className="mt-3 text-gray-300" style={{ textShadow: `0 0 4px ${neonColorMuted}` }}>Analisando dados e gerando insights...</p>
                    <Progress value={45} className="mt-3 w-56 mx-auto h-1.5 bg-[#141414] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] [&>div]:bg-[#1E90FF]" />
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="py-12 text-center min-h-[550px] flex flex-col items-center justify-center">
                    <Lightbulb className="mx-auto h-10 w-10 text-gray-500 mb-3" style={{ filter: `drop-shadow(0 0 4px ${neonColorMuted})` }} />
                    <p className="text-gray-300 text-lg" style={{ textShadow: `0 0 4px ${neonColorMuted}` }}>Pronto para otimizar?</p>
                    <p className="text-gray-500 text-sm mt-1.5 max-w-md mx-auto">
                      {selectedCampaignId ? 'Selecione um tipo e clique em "Gerar Sugestões".' : 'Selecione uma campanha, tipo e clique em "Gerar Sugestões".'}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[550px] pr-2">
                    <div className="space-y-4">
                      {suggestions.map((suggestion) => (
                        <Card key={suggestion.id} className={cn(cardStyle, "p-3 border-l-4")} style={{ borderLeftColor: neonColor }}>
                          <CardContent className="p-0">
                            {renderSuggestionContent(suggestion)}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} // <<< ESTA É A LINHA FINAL ESPERADA DO COMPONENTE
