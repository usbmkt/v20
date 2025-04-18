// pages/api/budget.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';

// Funções de formatação
const formatCurrency = (value: number): string => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatPercentage = (value: number): string => `${Number(value).toFixed(1)}%`;

// Estrutura da resposta
type BudgetData = {
  totalBudget?: number; totalBudgetFmt?: string;
  trafficCost?: number; trafficCostFmt?: string; trafficPerc?: number;
  creativeCost?: number; creativeCostFmt?: string; creativePerc?: number;
  operationalCost?: number; operationalCostFmt?: string; opPerc?: number;
  expectedProfit?: number; profitFmt?: string; profitPerc?: number;
  unallocatedValue?: number; unallocatedFmt?: string; unallocatedPerc?: number;
  chartImageUrl?: string | null; // <--- CAMPO PARA IMAGEM BASE64
};

// Configuração para gerar gráfico (fora do handler para reutilização)
const chartWidth = 400;
const chartHeight = 250;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: chartWidth, height: chartHeight, backgroundColour: '#ffffff' }); // Fundo branco para o gráfico

const generatePieChart = async (data: { label: string; value: number; color: string }[]): Promise<string | null> => {
    if (!data || data.length === 0) return null;

    const config: ChartConfiguration = {
        type: 'doughnut', // Ou 'pie'
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                label: 'Distribuição Orçamento',
                data: data.map(d => d.value),
                backgroundColor: data.map(d => d.color),
                borderColor: '#fff', // Borda branca entre fatias
                borderWidth: 1
            }]
        },
        options: {
            responsive: false, // Necessário para chartjs-node-canvas
            animation: false, // Necessário para chartjs-node-canvas
            plugins: {
                legend: {
                    position: 'bottom', // Posição da legenda
                    labels: {
                         boxWidth: 12,
                         font: { size: 10 },
                         padding: 15
                    }
                },
                title: { // Adiciona título ao gráfico
                    display: true,
                    text: 'Distribuição Percentual do Orçamento',
                    font: { size: 14, weight: 'bold' },
                    padding: { top: 10, bottom: 10 }
                },
                 tooltip: { enabled: false } // Desativa tooltip padrão na imagem
            }
        }
    };

    try {
        console.log('[Chart Gen] Gerando gráfico de pizza...');
        const dataUrl = await chartJSNodeCanvas.renderToDataURL(config);
        console.log('[Chart Gen] Gráfico de pizza gerado (data URL).');
        return dataUrl;
    } catch (error) {
        console.error('[Chart Gen] Erro ao gerar gráfico de pizza:', error);
        return null;
    }
};

// Handler da API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BudgetData | { message: string }>
) {
  if (req.method === 'GET') {
    try {
      const { startDate, endDate, campaignId } = req.query;
      console.log(`[API /api/budget] GET Req:`, { startDate, endDate, campaignId });

      // --- LÓGICA MOCK (igual antes) ---
      const baseBudget = 10000 + Math.random() * 15000;
      const trafficP = 45 + Math.random() * 15;
      const creativeP = 10 + Math.random() * 10;
      const opP = 8 + Math.random() * 7;
      const profitP = Math.max(0, 100 - trafficP - creativeP - opP);
      const unallocatedP = Math.max(0, 100 - (trafficP + creativeP + opP + profitP)); // Garante > 0
      const trafficCost = baseBudget * (trafficP / 100);
      const creativeCost = baseBudget * (creativeP / 100);
      const operationalCost = baseBudget * (opP / 100);
      const expectedProfit = baseBudget * (profitP / 100);
      const unallocatedValue = baseBudget * (unallocatedP / 100);

      const mockData: Omit<BudgetData, 'chartImageUrl'> = { // Omit temporariamente
        totalBudget: baseBudget, totalBudgetFmt: formatCurrency(baseBudget),
        trafficCost: trafficCost, trafficCostFmt: formatCurrency(trafficCost), trafficPerc: parseFloat(trafficP.toFixed(1)),
        creativeCost: creativeCost, creativeCostFmt: formatCurrency(creativeCost), creativePerc: parseFloat(creativeP.toFixed(1)),
        operationalCost: operationalCost, operationalCostFmt: formatCurrency(operationalCost), opPerc: parseFloat(opP.toFixed(1)),
        expectedProfit: expectedProfit, profitFmt: formatCurrency(expectedProfit), profitPerc: parseFloat(profitP.toFixed(1)),
        unallocatedValue: parseFloat(unallocatedValue.toFixed(2)), unallocatedFmt: formatCurrency(unallocatedValue), unallocatedPerc: parseFloat(unallocatedP.toFixed(1)),
      };
      // --- FIM MOCK ---

      // --- GERAR GRÁFICO ---
      const chartData = [
        { label: 'Tráfego', value: mockData.trafficPerc ?? 0, color: '#0d6efd' }, // Azul
        { label: 'Criativos', value: mockData.creativePerc ?? 0, color: '#198754' }, // Verde
        { label: 'Operacional', value: mockData.opPerc ?? 0, color: '#ffc107' }, // Amarelo
        { label: 'Lucro Esp.', value: mockData.profitPerc ?? 0, color: '#6f42c1' } // Roxo
      ];
      if(mockData.unallocatedPerc && mockData.unallocatedPerc > 0.1) {
          chartData.push({ label: 'Ñ Alocado', value: mockData.unallocatedPerc, color: '#6c757d' }); // Cinza
      }
      const imageUrl = await generatePieChart(chartData.filter(d => d.value > 0)); // Filtra valores zerados
      // --- FIM GRÁFICO ---

      // Adiciona a imagem aos dados
      const responseData: BudgetData = { ...mockData, chartImageUrl: imageUrl };

      res.status(200).json(responseData);

    } catch (error: any) {
      console.error("[API /api/budget] Erro:", error);
      res.status(500).json({ message: `Erro Interno: ${error.message || 'Erro'}` });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Método ${req.method} Não Permitido` });
  }
}