// pages/api/funnel.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js'; // Importar ChartConfiguration
import { format, addDays, parseISO, differenceInDays, isValid } from 'date-fns'; // Adicionado para cálculo mock

// Estruturas e Funções de Formatação
interface FunnelStage { name: string; value: number; displayValue: string; color?: string; }
interface PeriodResult { daily: number; weekly: number; monthly: number; }
interface FunnelData { clientName?: string; productName?: string; funnelData?: FunnelStage[]; volume?: PeriodResult; revenue?: PeriodResult; profit?: PeriodResult; chartImageUrl?: string | null; }
const formatCurrency = (value: number): string => isNaN(value) ? 'R$ 0,00' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatNumber = (value: number): string => isNaN(value) ? '0' : value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

// Configuração Chart.js
const chartWidth = 450; const chartHeight = 300;
// Cria uma única instância (melhor performance)
const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: chartWidth,
    height: chartHeight,
    backgroundColour: '#ffffff', // Fundo branco
    chartCallback: (ChartJS) => {
        // Registra plugins ou customizações globais do Chart.js se necessário
        // ChartJS.defaults.font.family = 'Arial';
    }
});


const generateFunnelBarChart = async (stages: FunnelStage[]): Promise<string | null> => {
    if (!stages || stages.length === 0) return null;
    const validStages = stages.filter(s => typeof s.value === 'number' && s.value > 0);
    if (validStages.length === 0) return null;

    // Cores com mais contraste e sem alpha direto (o Chart.js aplica)
    const defaultColors = ['#6c757d', '#0d6efd', '#17a2b8', '#198754', '#ffc107', '#dc3545'];

    const config: ChartConfiguration = {
        type: 'bar',
        data: {
            labels: validStages.map(s => s.name),
            datasets: [{
                label: 'Volume/Valor',
                data: validStages.map(s => s.value),
                backgroundColor: validStages.map((s, i) => s.color || defaultColors[i % defaultColors.length]), // Cores base
                borderColor: validStages.map((s, i) => s.color || defaultColors[i % defaultColors.length]),
                borderWidth: 1,
                // axis: 'y', // Removido
            }]
        },
        options: {
            indexAxis: 'y', // Define como barra horizontal
            responsive: false,
            maintainAspectRatio: false, // Permite definir altura/largura fixas
            animation: false,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 10 },
                        color: '#333', // Cor do texto do eixo X
                        // Formatação K/M para valores grandes
                        callback: (value) => {
                            const numValue = Number(value);
                            if (numValue >= 1000000) return (numValue / 1000000).toFixed(1).replace('.0','') + 'M';
                            if (numValue >= 1000) return (numValue / 1000).toFixed(0) + 'k';
                            return numValue.toLocaleString('pt-BR');
                        }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' } // Linhas de grade sutis
                },
                y: {
                    ticks: {
                        font: { size: 10 },
                        color: '#333' // Cor do texto do eixo Y
                    },
                    grid: { drawOnChartArea: false } // Remove linhas de grade verticais
                }
            },
            plugins: {
                legend: { display: false }, // Esconde legenda
                title: {
                    display: true,
                    text: 'Representação do Funil',
                    font: { size: 14, weight: 'bold' },
                    color: '#212529', // Cor do título
                    padding: { top: 10, bottom: 15 }
                },
                tooltip: { enabled: false } // Desabilita tooltip na imagem
            }
        }
    };
    try {
        console.log('[Chart Gen] Gerando gráfico de barras do funil...');
        const dataUrl = await chartJSNodeCanvas.renderToDataURL(config);
        console.log('[Chart Gen] Gráfico de barras do funil gerado.');
        return dataUrl;
    } catch (e) {
        console.error('[Chart Gen] Erro ao gerar gráfico de barras do funil:', e);
        return null;
    }
};

// --- Handler da API ---
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FunnelData | { message: string }>
) {
  if (req.method === 'GET') {
    try {
      const { startDate, endDate, campaignId } = req.query;
      console.log(`[API /api/funnel] GET Req:`, { startDate, endDate, campaignId });

      // --- LÓGICA MOCK (Como antes) ---
      const isAllCampaigns = !campaignId || campaignId === 'all';
      const factor = isAllCampaigns ? 1 : 0.2 + Math.random() * 0.6;
      const dailyInv = (isAllCampaigns?500:100+Math.random()*200)*factor;
      const cpc=1.00+Math.random()*1.50; const pPrice=97+Math.random()*100; const orgReach=(isAllCampaigns?20000:5000+Math.random()*10000)*factor;
      const reachClkConv=1.5+Math.random()*2.0; const siteConv=2.0+Math.random()*3.0;
      const clkPagos=cpc>0?dailyInv/cpc:0; const vPagos=clkPagos; const vOrg=orgReach*(reachClkConv/100); const totVisit=vPagos+vOrg; const vendas=totVisit*(siteConv/100); const fat=vendas*pPrice; const lucro=fat-dailyInv;
      const funnelStepsData: FunnelStage[] = [ { name: "Investimento", value: dailyInv, displayValue: formatCurrency(dailyInv), color: '#6c757d' }, { name: "Visitantes Totais", value: totVisit, displayValue: formatNumber(totVisit), color: '#0d6efd' }, { name: "Vendas", value: vendas, displayValue: formatNumber(vendas), color: '#198754'}, { name: "Faturamento", value: fat, displayValue: formatCurrency(fat), color: '#ffc107'}, ];
      const mockFunnelData: Omit<FunnelData, 'chartImageUrl'> = { clientName: `Cliente ${isAllCampaigns ? 'Mock' : campaignId?.toString().slice(-3)}`, productName: `Produto #${Math.floor(100 + Math.random() * 900)}`, funnelData: funnelStepsData, volume: { daily: vendas, weekly: vendas*7, monthly: vendas*30 }, revenue: { daily: fat, weekly: fat*7, monthly: fat*30 }, profit: { daily: lucro, weekly: lucro*7, monthly: lucro*30 } };
      // --- FIM MOCK ---

      const imageUrl = await generateFunnelBarChart(mockFunnelData.funnelData ?? []);
      const responseData: FunnelData = { ...mockFunnelData, chartImageUrl: imageUrl };

      res.status(200).json(responseData);

    } catch (error: any) {
      console.error("[API /api/funnel] Erro:", error);
      res.status(500).json({ message: `Erro Interno: ${error.message || 'Erro desconhecido'}` });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Método ${req.method} Não Permitido` });
  }
}