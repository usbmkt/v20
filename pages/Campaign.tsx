// pages/Campaign.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext'; // <<< AUTENTICAÇÃO
import { useRouter } from 'next/router';       // <<< AUTENTICAÇÃO
import Layout from '@/components/layout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Campaign } from '@/entities/Campaign';
import axios from 'axios';
import { Trash2, Edit, PlusCircle, Loader2, ChevronUp, ChevronDown } from 'lucide-react'; // <<< AUTENTICAÇÃO (Loader2)
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { MultiSelectPopover } from "@/components/ui/multi-select-popover";

interface CampaignPageProps {
  initialCampaigns?: Campaign[];
}

// Componente FormFieldCard (como antes)
interface FormFieldCardProps { children: React.ReactNode; className?: string; }
const FormFieldCard: React.FC<FormFieldCardProps> = ({ children, className }) => ( <Card className={cn( "bg-[#141414]/50", "shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.03)]", "rounded-md p-2", "border-none", "flex flex-col gap-1", className )}> {children} </Card> );

// Opções Multi-Select (como antes)
const platformOptions = [ { value: "google_ads", label: "Google Ads" }, { value: "meta_ads", label: "Meta Ads" }, { value: "tiktok_ads", label: "TikTok Ads" }, { value: "linkedin_ads", label: "LinkedIn Ads" }, { value: "other", label: "Outra" }, ];
const objectiveOptions = [ { value: "conversao", label: "Conversão" }, { value: "leads", label: "Leads" }, { value: "trafego", label: "Tráfego" }, { value: "reconhecimento", label: "Reconhecimento" }, { value: "vendas_catalogo", label: "Vendas Catálogo" }, ];
const adFormatOptions = [ { value: "imagem", label: "Imagem" }, { value: "video", label: "Vídeo" }, { value: "carrossel", label: "Carrossel" }, { value: "colecao", label: "Coleção" }, { value: "search", label: "Search" }, { value: "display", label: "Display" }, ];

export default function CampaignPage({ initialCampaigns = [] }: CampaignPageProps) {
  // --- Autenticação e Roteamento ---
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  // --- Estados da Página ---
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const initialFormData = { name: '', industry: '', targetAudience: '', platform: [], objective: [], budget: '0', daily_budget: '0', segmentation: '', adFormat: [], duration: '0' };
  const [formData, setFormData] = useState<any>(initialFormData);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading de dados da página
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // --- Constantes de Estilo (como antes) ---
  const neonColor = '#1E90FF'; const neonColorMuted = '#4682B4'; const neonRedColor = '#FF4444';
  const cardStyle = "bg-[#141414]/80 backdrop-blur-sm shadow-[5px_5px_10px_rgba(0,0,0,0.4),-5px_-5px_10px_rgba(255,255,255,0.05)] rounded-lg border-none";
  const neumorphicInputStyle = "bg-[#141414] text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] placeholder:text-gray-500 border-none focus:ring-2 focus:ring-[#1E90FF] focus:ring-offset-2 focus:ring-offset-[#0e1015] h-9 text-sm px-3 py-2";
  const neumorphicTextAreaStyle = cn(neumorphicInputStyle, "min-h-[80px] py-2");
  const neumorphicButtonStyle = "bg-[#141414] border-none text-white shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] hover:bg-[#1E90FF]/80 active:scale-[0.98] active:brightness-95 transition-all duration-150 ease-out h-9 px-3 text-sm";
  const primaryNeumorphicButtonStyle = cn(neumorphicButtonStyle, "bg-[#1E90FF]/80 hover:bg-[#1E90FF]/100");
  const stepperButtonStyle = cn( "bg-[#141414]/70 border-none text-white shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05)]", "h-5 w-5 p-0 min-w-0 rounded", "hover:brightness-110 hover:bg-[#1E90FF]/20", "active:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.03)] active:scale-[0.97] active:brightness-90", "text-blue-400 hover:text-blue-300", );
  const iconStyle = { filter: `drop-shadow(0 0 3px ${neonColorMuted})` };
  const primaryIconStyle = { filter: `drop-shadow(0 0 3px ${neonColor})` };
  const labelStyle = "text-xs text-gray-300 mb-0.5";

  // --- Lógica de Proteção de Rota ---
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log(`[Auth Guard /Campaign] Usuário não autenticado, redirecionando para /login`);
      router.push('/login');
    }
    // Carrega dados da página *após* confirmar autenticação
    if (!authLoading && isAuthenticated && (!initialCampaigns || initialCampaigns.length === 0)) {
        fetchCampaignsEffect();
    }
    // Se initialCampaigns foi fornecido e está autenticado, define o estado
    else if (!authLoading && isAuthenticated && initialCampaigns && initialCampaigns.length > 0 && campaigns.length === 0) {
        setCampaigns(initialCampaigns);
        setIsLoading(false); // Marca como não carregando se dados iniciais foram usados
    }
  }, [authLoading, isAuthenticated, router, initialCampaigns]); // Adicionado initialCampaigns


  // --- Funções da Página (fetchCampaignsEffect, handlers, resetForm como antes) ---
  const fetchCampaignsEffect = useCallback(async () => { setIsLoading(true); setError(null); try { const response = await axios.get('/api/campaigns', { headers: { 'Cache-Control': 'no-cache' } }); const fetchedCampaigns = response.data.map((camp: any) => ({ ...camp, platform: Array.isArray(camp.platform) ? camp.platform : (camp.platform ? [String(camp.platform)] : []), objective: Array.isArray(camp.objective) ? camp.objective : (camp.objective ? [String(camp.objective)] : []), adFormat: Array.isArray(camp.adFormat) ? camp.adFormat : (camp.adFormat ? [String(camp.adFormat)] : []), })); setCampaigns(fetchedCampaigns); } catch (err: any) { setError("Falha ao carregar campanhas."); toast({ title: "Erro", description: "Falha ao carregar campanhas.", variant: "destructive" }); } finally { setIsLoading(false); } }, [toast]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setFormData((prev: any) => ({ ...prev, [name]: value })); };
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; if (value === '' || value === '-' || /^-?\d*\.?\d*$/.test(value)) { setFormData((prev: any) => ({ ...prev, [name]: value })); } };
  const handleMultiSelectChange = (name: string) => (selectedValues: string[]) => { setFormData((prev: any) => ({ ...prev, [name]: selectedValues, })); };
  const handleStepChange = (name: 'budget' | 'daily_budget' | 'duration', direction: 'up' | 'down') => { setFormData((prev: any) => { const currentValue = parseFloat(prev[name] || '0'); const step = name === 'duration' ? 1 : (name === 'budget' ? 10 : 1); const precision = (name === 'duration') ? 0 : 2; let newValue = direction === 'up' ? currentValue + step : currentValue - step; newValue = Math.max(0, newValue); return { ...prev, [name]: newValue.toFixed(precision) }; }); };
  const handleSave = async (e: React.FormEvent) => { e.preventDefault(); setIsLoading(true); setError(null); const budgetValue = parseFloat(formData.budget || '0'); const dailyBudgetValue = parseFloat(formData.daily_budget || '0'); const durationValue = parseInt(formData.duration || '0', 10); if (!formData.name) { setError("O nome da campanha é obrigatório."); setIsLoading(false); toast({ title: "Erro", description: "O nome da campanha é obrigatório.", variant: "destructive" }); return; } if (isNaN(budgetValue) || isNaN(dailyBudgetValue) || isNaN(durationValue) || budgetValue < 0 || dailyBudgetValue < 0 || durationValue < 0) { setError("Orçamento e duração devem ser números válidos e não negativos."); setIsLoading(false); toast({ title: "Erro", description: "Orçamento e duração devem ser números válidos.", variant: "destructive" }); return; } const campaignData = { ...formData, budget: budgetValue, daily_budget: dailyBudgetValue, duration: durationValue, }; console.log('Dados enviados para o backend:', campaignData); try { if (selectedCampaign) { await axios.put(`/api/campaigns?id=${selectedCampaign.id}`, campaignData); toast({ title: "Campanha Atualizada", description: `Campanha "${formData.name}" atualizada.` }); } else { await axios.post('/api/campaigns', campaignData); toast({ title: "Campanha Criada", description: `Campanha "${formData.name}" criada.` }); } resetForm(); await fetchCampaignsEffect(); } catch (error: any) { console.error("Erro ao salvar campanha:", error.response?.data || error.message); const errorMsg = error.response?.data?.message || "Falha ao salvar campanha."; setError(errorMsg); toast({ title: "Erro", description: errorMsg, variant: "destructive" }); } finally { setIsLoading(false); } };
  const handleEdit = (campaign: Campaign) => { setSelectedCampaign(campaign); setFormData({ ...campaign, platform: Array.isArray(campaign.platform) ? campaign.platform : (campaign.platform ? [String(campaign.platform)] : []), objective: Array.isArray(campaign.objective) ? campaign.objective : (campaign.objective ? [String(campaign.objective)] : []), adFormat: Array.isArray(campaign.adFormat) ? campaign.adFormat : (campaign.adFormat ? [String(campaign.adFormat)] : []), budget: campaign.budget?.toString() ?? '0', daily_budget: campaign.daily_budget?.toString() ?? '0', duration: campaign.duration?.toString() ?? '0' }); setError(null); };
  const handleDelete = async (id: string | number) => { if (!confirm("Tem certeza que deseja excluir esta campanha?")) return; setIsLoading(true); setError(null); try { await axios.delete(`/api/campaigns?id=${id}`); resetForm(); await fetchCampaignsEffect(); toast({ title: "Campanha Excluída" }); } catch (error: any) { const errorMsg = error.response?.data?.message || "Falha ao excluir campanha."; setError(errorMsg); toast({ title: "Erro", description: errorMsg, variant: "destructive" }); } finally { setIsLoading(false); } };
  const resetForm = () => { setFormData(initialFormData); setSelectedCampaign(null); setError(null); };

  // --- Renderização Condicional ---
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

  if (!isAuthenticated) {
    return null; // O useEffect deve ter redirecionado
  }

  // --- Renderização Principal da Página ---
  return (
    <> {/* Adicionado Fragment aqui */}
      <Head>
        <title>Configurações de Campanha - USBMKT</title>
      </Head>
      <Layout> {/* Layout agora é o elemento pai */}
        <div className="space-y-4">
          <h1 className="text-2xl font-black text-white mb-4" style={{ textShadow: `0 0 8px ${neonColor}` }}>
            Configurações de Campanha
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Coluna Lista de Campanhas */}
            <Card className={cn(cardStyle, "lg:col-span-1 p-3")}>
              <CardHeader className="p-0 pb-3 mb-3 border-b border-[#1E90FF]/20">
                <CardTitle className="text-lg font-semibold text-white" style={{ textShadow: `0 0 6px ${neonColor}` }}>Campanhas</CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-80 overflow-y-auto pr-1">
                {(isLoading && campaigns.length === 0) && <p className='text-gray-400 text-xs p-2' style={{ textShadow: `0 0 4px ${neonColor}` }}>Carregando...</p>}
                {!isLoading && campaigns.length === 0 && <p className="text-gray-400 text-xs p-2" style={{ textShadow: `0 0 4px ${neonColor}` }}>Nenhuma campanha encontrada.</p>}
                <ul className="space-y-1.5">
                  {campaigns.map((campaign) => (
                    <li key={campaign.id} className={cn( `p-2 rounded-md flex justify-between items-center group bg-[#141414]/50 backdrop-blur-sm shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.03)] transition-all duration-200 hover:bg-[#1E90FF]/20 cursor-pointer`, "border-none", selectedCampaign?.id === campaign.id ? 'bg-[#1E90FF]/30 ring-1 ring-[#1E90FF]/50' : '' )} onClick={() => handleEdit(campaign)}>
                      <span className="text-xs font-medium text-white truncate pr-2" style={{ textShadow: `0 0 4px ${neonColorMuted}` }}>{campaign.name}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-[#6495ED] hover:text-[#87CEFA]" onClick={(e) => { e.stopPropagation(); handleEdit(campaign); }}><Edit size={12} style={{ filter: `drop-shadow(0 0 3px ${neonColor})` }}/></Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-[#FF6347] hover:text-[#F08080]" onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id); }}><Trash2 size={12} style={{ filter: `drop-shadow(0 0 3px ${neonRedColor})` }}/></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <Button variant="outline" size="sm" className={cn(neumorphicButtonStyle, "w-full mt-3")} onClick={resetForm}>
                <PlusCircle size={14} className="mr-1.5" style={{ filter: `drop-shadow(0 0 3px ${neonColor})` }}/>
                <span style={{ textShadow: `0 0 4px ${neonColor}` }}>Nova Campanha</span>
              </Button>
            </Card>

            {/* Coluna Formulário */}
            <div className="lg:col-span-2 space-y-3">
              <form onSubmit={handleSave} className="space-y-3">
                <Card className={cn(cardStyle, "p-3")}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Campos do Formulário (Nome, Indústria, etc. como antes) */}
                    <FormFieldCard className="md:col-span-2"> <Label htmlFor="name" className={labelStyle} style={{ textShadow: `0 0 4px ${neonColor}` }}>Nome da Campanha *</Label> <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nome principal da sua campanha" required className={cn(neumorphicInputStyle, "text-base")} /> </FormFieldCard>
                    <FormFieldCard> <Label htmlFor="industry" className={labelStyle} style={{ textShadow: `0 0 4px ${neonColor}` }}>Indústria</Label> <Input id="industry" name="industry" value={formData.industry || ''} onChange={handleInputChange} placeholder="Ex: Varejo, Educação" className={cn(neumorphicInputStyle)} /> </FormFieldCard>
                    <FormFieldCard> <Label htmlFor="segmentation" className={labelStyle} style={{ textShadow: `0 0 4px ${neonColor}` }}>Segmentação</Label> <Input id="segmentation" name="segmentation" value={formData.segmentation || ''} onChange={handleInputChange} placeholder="Ex: Idade, Interesses" className={cn(neumorphicInputStyle)} /> </FormFieldCard>
                    <FormFieldCard className="md:col-span-2"> <Label htmlFor="targetAudience" className={labelStyle} style={{ textShadow: `0 0 4px ${neonColor}` }}>Público-Alvo</Label> <Textarea id="targetAudience" name="targetAudience" value={formData.targetAudience || ''} onChange={handleInputChange} placeholder="Descreva o público..." className={cn(neumorphicTextAreaStyle, "min-h-[60px]")} /> </FormFieldCard>
                    <FormFieldCard> <Label htmlFor="platform" className={labelStyle} style={{ textShadow: `0 0 4px ${neonColor}` }}>Plataforma(s)</Label> <MultiSelectPopover options={platformOptions} selectedValues={formData.platform} onChange={handleMultiSelectChange('platform')} placeholder="Selecione..." triggerClassName="h-8 text-sm" /> </FormFieldCard>
                    <FormFieldCard> <Label htmlFor="objective" className={labelStyle} style={{ textShadow: `0 0 4px ${neonColor}` }}>Objetivo(s)</Label> <MultiSelectPopover options={objectiveOptions} selectedValues={formData.objective} onChange={handleMultiSelectChange('objective')} placeholder="Selecione..." triggerClassName="h-8 text-sm" /> </FormFieldCard>
                    <FormFieldCard> <Label htmlFor="adFormat" className={labelStyle} style={{ textShadow: `0 0 4px ${neonColor}` }}>Formato(s) de Anúncio</Label> <MultiSelectPopover options={adFormatOptions} selectedValues={formData.adFormat} onChange={handleMultiSelectChange('adFormat')} placeholder="Selecione..." triggerClassName="h-8 text-sm" /> </FormFieldCard>
                    <FormFieldCard> <Label htmlFor="budget" className={labelStyle} style={{ textShadow: `0 0 4px ${neonColor}` }}>Orçamento Total (R$)</Label> <div className="flex items-center gap-1"> <Input id="budget" name="budget" type="text" inputMode='decimal' value={formData.budget} onChange={handleNumberInputChange} placeholder="0.00" className={cn(neumorphicInputStyle, "flex-1 w-auto")} /> <div className="flex flex-col gap-0.5"> <Button type="button" variant="ghost" className={stepperButtonStyle} onClick={() => handleStepChange('budget', 'up')}> <ChevronUp size={12} style={iconStyle} /> </Button> <Button type="button" variant="ghost" className={stepperButtonStyle} onClick={() => handleStepChange('budget', 'down')}> <ChevronDown size={12} style={iconStyle} /> </Button> </div> </div> </FormFieldCard>
                    <FormFieldCard> <Label htmlFor="daily_budget" className={labelStyle} style={{ textShadow: `0 0 4px ${neonColor}` }}>Orçamento Diário (R$)</Label> <div className="flex items-center gap-1"> <Input id="daily_budget" name="daily_budget" type="text" inputMode='decimal' value={formData.daily_budget} onChange={handleNumberInputChange} placeholder="0.00" className={cn(neumorphicInputStyle, "flex-1 w-auto")} /> <div className="flex flex-col gap-0.5"> <Button type="button" variant="ghost" className={stepperButtonStyle} onClick={() => handleStepChange('daily_budget', 'up')}> <ChevronUp size={12} style={iconStyle} /> </Button> <Button type="button" variant="ghost" className={stepperButtonStyle} onClick={() => handleStepChange('daily_budget', 'down')}> <ChevronDown size={12} style={iconStyle} /> </Button> </div> </div> </FormFieldCard>
                    <FormFieldCard> <Label htmlFor="duration" className={labelStyle} style={{ textShadow: `0 0 4px ${neonColor}` }}>Duração (Dias)</Label> <div className="flex items-center gap-1"> <Input id="duration" name="duration" type="text" inputMode='numeric' value={formData.duration} onChange={handleNumberInputChange} placeholder="0" className={cn(neumorphicInputStyle, "flex-1 w-auto")} /> <div className="flex flex-col gap-0.5"> <Button type="button" variant="ghost" className={stepperButtonStyle} onClick={() => handleStepChange('duration', 'up')}> <ChevronUp size={12} style={iconStyle} /> </Button> <Button type="button" variant="ghost" className={stepperButtonStyle} onClick={() => handleStepChange('duration', 'down')}> <ChevronDown size={12} style={iconStyle} /> </Button> </div> </div> </FormFieldCard>
                  </div>
                  {/* Mensagem de Erro */}
                  {error && <div className="mt-3 p-2 bg-red-900/30 rounded border border-red-700/50 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.03)]"> <p className="text-red-400 text-xs text-center" style={{ textShadow: `0 0 4px ${neonRedColor}` }}>{error}</p> </div>}
                  {/* Botões Salvar/Cancelar */}
                  <div className="flex justify-end gap-2 pt-3">
                    <Button type="button" variant="outline" onClick={resetForm} className={cn(neumorphicButtonStyle, "text-gray-300")}> <span style={{ textShadow: `0 0 4px ${neonColorMuted}` }}>Cancelar</span> </Button>
                    <Button type="submit" disabled={isLoading} className={cn(primaryNeumorphicButtonStyle)}> {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" style={primaryIconStyle}/> : null} <span style={{ textShadow: `0 0 4px ${neonColor}` }}> {isLoading ? 'Salvando...' : (selectedCampaign ? 'Salvar Alterações' : 'Salvar Campanha')} </span> </Button>
                  </div>
                </Card>
              </form>
            </div>
          </div>
        </div>
      </Layout> {/* Layout agora é o elemento pai */}
    </> // <-- Tag de fechamento do Fragment movida para a última linha antes do );
  );
}
