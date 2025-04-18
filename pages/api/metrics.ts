// pages/api/metrics.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { format, addDays, parseISO, differenceInDays, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';

// Estruturas e Formatação
type MetricsTotals = { clicks: number; impressions: number; conversions: number; cost: number; revenue: number; ctr: number; cpc: number; conversionRate: number; costPerConversion: number; roi: number; };
type DailyMetric = { date: string; clicks: number; impressions: number; conversions: number; cost: number; revenue: number; };
type MetricsData = { totals: MetricsTotals; dailyData: DailyMetric[]; chartImageUrl?: string | null; }; // <--- CAMPO PARA IMAGEM
const formatCurrency = (v: any): string => v == null || isNaN(v) ? 'R$ 0,00' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatNumber = (v: any): string => v == null || isNaN(v) ? '0' : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 });

// Configuração do Chart.js
const chartWidth = 700;
const chartHeight = 300;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: chartWidth, height: chartHeight, backgroundColour: '#ffffff' });

const generateLineChart = async (dailyData: DailyMetric[]): Promise<string | null> => {
    if (!dailyData || dailyData.length === 0) return null;

    // Ordena por data para o gráfico
    const sortedData = [...dailyData].sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    const labels = sortedData.map(d => format(parseISO(d.date), 'dd/MM', { locale: ptBR })); // Formato Eixo X

    const config: ChartConfiguration = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Receita (R$)',
                    data: sortedData.map(d => d.revenue),
                    borderColor: '#0d6efd', // Azul
                    backgroundColor: 'rgba(13, 110, 253, 0.1)', // Azul com transparência
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3, // Curva suave
                    yAxisID: 'yRevenue', // Eixo Y esquerdo
                },
                {
                    label: 'Custo (R$)',
                    data: sortedData.map(d => d.cost),
                    borderColor: '#dc3545', // Vermelho
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 1.5,
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'yRevenue', // Mesmo eixo da receita
                },
                 {
                    label: 'Cliques',
                    data: sortedData.map(d => d.clicks),
                    borderColor: '#ffc107', // Amarelo
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 1.5,
                    fill: false, // Sem preenchimento para cliques
                    tension: 0.3,
                    yAxisID: 'yClicks', // Eixo Y direito
                    hidden: true, // Oculto por padrão, pode ser ligado na legenda
                }
            ]
        },
        options: {
            responsive: false, animation: false,
            interaction: { mode: 'index', intersect: false }, // Tooltip mostra todos no mesmo ponto X
            scales: {
                x: { ticks: { font: { size: 10 } } },
                yRevenue: { // Eixo Esquerdo para Receita/Custo
                    type: 'linear',
                    position: 'left',
                    ticks: {
                        font: { size: 10 },
                        callback: function(value) { // Formata para R$ K
                            if (Number(value) >= 1000) return 'R$' + (Number(value) / 1000) + 'k';
                            return 'R$' + value;
                        }
                    },
                    grid: { // Linhas de grade sutis
                       color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                yClicks: { // Eixo Direito para Cliques
                     type: 'linear',
                     position: 'right',
                     ticks: { font: { size: 10 } },
                     grid: { drawOnChartArea: false }, // Não desenha grade para este eixo
                     beginAtZero: true
                }
            },
            plugins: {
                legend: { position: 'top', labels:{ boxWidth: 12, font: { size: 10 }}},
                title: { display: true, text: 'Evolução Diária', font: { size: 14, weight: 'bold' }},
                tooltip: { enabled: false }
            }
        }
    };

     try {
        console.log('[Chart Gen] Gerando gráfico de linha...');
        const dataUrl = await chartJSNodeCanvas.renderToDataURL(config);
        console.log('[Chart Gen] Gráfico de linha gerado.');
        return dataUrl;
    } catch (error) {
        console.error('[Chart Gen] Erro ao gerar gráfico de linha:', error);
        return null;
    }
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MetricsData | { message: string }>
) {
  if (req.method === 'GET') {
    try {
      const { startDate, endDate, campaignId } = req.query;
      console.log(`[API /api/metrics] GET Req:`, { startDate, endDate, campaignId });

      if (typeof startDate !== 'string' || typeof endDate !== 'string' || !startDate || !endDate) { return res.status(400).json({ message: 'Datas obrigatórias.' }); }
      const start = parseISO(startDate); const end = parseISO(endDate);
      if (!isValid(start) || !isValid(end) || end < start) { return res.status(400).json({ message: `Datas inválidas.` }); }

      const days = differenceInDays(end, start) + 1;
      const isAll = !campaignId || campaignId === 'all'; const factor = isAll ? 1 : 0.2 + Math.random() * 0.6;

      // --- LÓGICA MOCK (Igual antes) ---
      const mockDailyData: DailyMetric[] = [];
      let totalClicks=0, totalImpressions=0, totalConversions=0, totalCost=0, totalRevenue=0;
      for (let i = 0; i < days; i++) { const date=addDays(start, i); const dateStr=format(date,'yyyy-MM-dd'); const imp=Math.floor((10000+Math.random()*40000)*factor/days); const clk=Math.floor(imp*(0.01+Math.random()*0.04)); const cost=clk*(0.50+Math.random()*1.50); const conv=Math.floor(clk*(0.02+Math.random()*0.08)); const rev=conv*(50+Math.random()*150); mockDailyData.push({date:dateStr,clicks:clk,impressions:imp,conversions:conv,cost:parseFloat(cost.toFixed(2)),revenue:parseFloat(rev.toFixed(2))}); totalClicks+=clk; totalImpressions+=imp; totalConversions+=conv; totalCost+=cost; totalRevenue+=rev; }
      const ctr=totalImpressions>0?(totalClicks/totalImpressions)*100:0; const cpc=totalClicks>0?totalCost/totalClicks:0; const cRate=totalClicks>0?(totalConversions/totalClicks)*100:0; const cpcConv=totalConversions>0?totalCost/totalConversions:0; const roi=totalCost>0?((totalRevenue-totalCost)/totalCost)*100:(totalRevenue>0?Infinity:0);
      const mockTotals:MetricsTotals={clicks:totalClicks,impressions:totalImpressions,conversions:totalConversions,cost:parseFloat(totalCost.toFixed(2)),revenue:parseFloat(totalRevenue.toFixed(2)),ctr:parseFloat(ctr.toFixed(2)),cpc:parseFloat(cpc.toFixed(2)),conversionRate:parseFloat(cRate.toFixed(2)),costPerConversion:parseFloat(cpcConv.toFixed(2)),roi:isFinite(roi)?parseFloat(roi.toFixed(1)):(roi===Infinity?10000:0)};
      // --- FIM MOCK ---

      // --- GERAR GRÁFICO ---
      const imageUrl = await generateLineChart(mockDailyData);
      // --------------------

      const responseData: MetricsData = { totals: mockTotals, dailyData: mockDailyData, chartImageUrl: imageUrl };

      res.status(200).json(responseData);

    } catch (error: any) {
      console.error("[API /api/metrics] Erro:", error);
      res.status(500).json({ message: `Erro Interno: ${error.message || 'Erro'}` });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Método ${req.method} Não Permitido` });
  }
}