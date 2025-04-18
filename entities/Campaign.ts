// Campaign.ts

// Interface para tipagem de uma campanha
export interface Campaign {
    id: number | string;
    name: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    status?: string;
    revenue?: number;
    leads?: number;
    clicks?: number;
    sales?: number;
    platform?: string;
    objective?: string;
    daily_budget?: number;
    duration?: number;
    industry?: string | null;
    targetAudience?: string | null;
    segmentation?: string | null;
    adFormat?: string | null;
    // Métricas aninhadas (se usadas)
    metrics?: {
      cost?: number;
      impressions?: number;
      ctr?: number;
      cpc?: number;
    };
    // Dados diários (usado no processamento do gráfico)
    dailyData?: {
        date: string;
        revenue?: number;
        clicks?: number;
        leads?: number;
        cost?: number;
    }[];
    // *** CORREÇÃO: Campos para LTV adicionados como opcionais ***
    avgTicket?: number;
    purchaseFrequency?: number;
    customerLifespan?: number;
}


// Função para listar campanhas via API (mantida como exemplo)
export async function list(): Promise<Campaign[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    console.log(`[Campaign Entity] Fetching from: ${baseUrl}/api/campaigns`);
    const response = await fetch(`${baseUrl}/api/campaigns`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
       let errorBody = 'Erro desconhecido';
       try {
           errorBody = await response.text();
       } catch (_) {}
      console.error(`Erro ${response.status}: ${response.statusText}. Body: ${errorBody}`);
      throw new Error(`Erro ao buscar campanhas (${response.status})`);
    }

    const data = await response.json();
     console.log(`[Campaign Entity] Received ${data?.length ?? 0} campaigns.`);
    return data as Campaign[];
  } catch (error) {
    console.error('[Campaign Entity] Erro ao listar campanhas:', error);
    return [];
  }
}

// Função de inicialização (mantida como comentário)
export async function init(): Promise<void> {
  // console.log('Inicialização de campanhas deve ser feita no servidor.');
}
