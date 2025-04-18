// pages/campaigns/index.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { Campaign } from '@/entities/Campaign'; // Importa a INTERFACE
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export default function CampaignsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]); // <--- Esta linha precisa de .tsx
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estilos
  const neonColor = '#1E90FF';
  const cardStyle = "bg-[#141414]/80 backdrop-blur-sm shadow-lg rounded-lg border border-blue-900/30";
  const primaryButtonStyle = `bg-gradient-to-r from-[${neonColor}] to-[#4682B4] hover:from-[#4682B4] hover:to-[${neonColor}] text-white font-semibold shadow-[0_4px_10px_rgba(30,144,255,0.4)] transition-all duration-300 ease-in-out transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0e1015] focus:ring-[#5ca2e2]`;
  const neumorphicButtonStyle = `bg-[#141414] border border-[hsl(var(--border))]/30 text-white shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] hover:bg-[hsl(var(--primary))]/10 active:scale-[0.98] active:brightness-95 transition-all duration-150 ease-out`;


  // --- Autenticação e Carregamento Inicial ---
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated) {
      fetchCampaigns();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, router]);

  // --- Busca de Dados ---
  const fetchCampaigns = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const response = await axios.get<Campaign[]>('/api/campaigns');
      setCampaigns(response.data || []);
    } catch (err: any) {
      console.error("Erro ao buscar campanhas:", err);
      const errorMsg = err.response?.data?.message || err.message || "Falha ao carregar campanhas.";
      setError(errorMsg);
      toast({ title: "Erro", description: errorMsg, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  };

  // --- Handlers ---
  const handleAddCampaign = () => {
     router.push('/campaigns/new'); // Ajuste se o caminho for diferente
  };

  const handleEditCampaign = (id: string | number) => {
     router.push(`/campaigns/edit/${id}`); // Ajuste se o caminho for diferente
  };

  const handleDeleteCampaign = async (id: string | number) => {
     if (!confirm(`Tem certeza que deseja excluir a campanha ${id}?`)) return;
     try {
       await axios.delete(`/api/campaigns?id=${id}`);
       toast({ title: "Sucesso", description: "Campanha excluída." });
       setCampaigns(prev => prev.filter(c => c.id !== id));
     } catch (err: any) {
       console.error("Erro ao excluir:", err);
       const errorMsg = err.response?.data?.message || "Falha ao excluir campanha.";
       toast({ title: "Erro", description: errorMsg, variant: "destructive" });
     }
  };


  // --- Renderização ---
  if (authLoading) {
    return (
        <div className="flex h-[calc(100vh-100px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
      <Head>
        <title>Gerenciar Campanhas - USBMKT</title>
      </Head>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white" style={{ textShadow: `0 0 8px ${neonColor}` }}>
            Gerenciar Campanhas
          </h1>
          <Button onClick={handleAddCampaign} className={primaryButtonStyle}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Campanha
          </Button>
        </div>

        {isLoadingData && (
          <div className="text-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-gray-400 mt-2">Carregando campanhas...</p>
          </div>
        )}

        {!isLoadingData && error && (
          <Card className={cardStyle}>
            <CardContent className="p-6 text-center text-red-400">
              <p>{error}</p>
              <Button onClick={fetchCampaigns} variant="outline" size="sm" className={cn(neumorphicButtonStyle, "mt-4")}>
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoadingData && !error && campaigns.length === 0 && (
          <Card className={cardStyle}>
            <CardContent className="p-6 text-center text-gray-400">
              <p>Nenhuma campanha encontrada. Clique em "Nova Campanha" para começar.</p>
            </CardContent>
          </Card>
        )}

        {!isLoadingData && !error && campaigns.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className={cn(cardStyle, "flex flex-col")}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                     <CardTitle className="text-base text-white truncate flex-1" title={campaign.name}>
                         {campaign.name}
                     </CardTitle>
                     <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full uppercase font-medium tracking-wider flex-shrink-0',
                         campaign.status === 'active' ? 'bg-green-600/70 text-green-100 border border-green-500/50'
                         : campaign.status === 'paused' ? 'bg-yellow-600/70 text-yellow-100 border border-yellow-500/50'
                         : campaign.status === 'archived' ? 'bg-slate-600/70 text-slate-300 border border-slate-500/50'
                         : 'bg-gray-600/70 text-gray-300 border border-gray-500/50' // Default to draft style
                        )}>
                         {campaign.status || 'rascunho'}
                      </span>
                  </div>
                    <p className="text-xs text-gray-400 pt-1">
                       ID: <span className="font-mono">{campaign.id}</span> |
                       Plataforma: <span className="font-medium">{campaign.platform || 'N/A'}</span>
                    </p>
                </CardHeader>
                <CardContent className="text-xs text-gray-300 flex-grow space-y-1 pt-1">
                  <p>Orçamento Total: <span className="font-semibold">{campaign.budget?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'N/A'}</span></p>
                  <p>Receita Gerada: <span className="font-semibold">{campaign.revenue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'}</span></p>
                   <p>Objetivo: <span className="font-medium">{campaign.objective || 'Não definido'}</span></p>
                </CardContent>
                 <div className="flex justify-end gap-2 p-3 border-t border-blue-900/20 mt-2">
                    <Button variant="ghost" size="sm" className={cn(neumorphicButtonStyle, "h-7 px-2 text-xs")} onClick={() => handleEditCampaign(campaign.id)}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    <Button variant="destructive" size="sm" className={cn(neumorphicButtonStyle, "!bg-red-900/50 !text-red-300 hover:!bg-red-700/70 h-7 px-2 text-xs")} onClick={() => handleDeleteCampaign(campaign.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                    </Button>
                 </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
}
