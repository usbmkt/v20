import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Layout from '@/components/layout';
import type { Campaign } from '@/entities/Campaign';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';
import { Send, User, Sparkles, Brain, Database, RefreshCw, Cpu, Zap, Upload, History, Trash2, Save, RotateCw, Loader2, Bot, Lightbulb, MessageSquare, Settings, Filter, Server, Globe, KeyRound } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import { Message } from '@/types/chat';
import { useAuth } from '@/context/AuthContext';

interface Conversation { id: string; title: string; date: string; messages: Message[]; }
interface SimpleCampaignChatInfo { id?: string; name?: string | null; platform?: string | null; daily_budget?: number | null; duration?: number | null; objective?: string | null; }
interface CopyInfo { id?: string; campaign_id?: string; title?: string | null; cta?: string | null; target_audience?: string | null; content?: string | null; }
interface ChatPageProps {}
type CampaignOption = Pick<Campaign, 'id' | 'name'>;
interface ModelSettings { providerType: 'local' | 'openai' | 'gemini' | 'custom'; localServerUrl: string; apiKey: string; customApiUrl: string; temperature: number; maxTokens: number; repetitionPenalty: number; localModelName?: string; }

export default function ChatPage({ }: ChatPageProps) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Olá! Sou o assistente USBABC IA. Como posso ajudar?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState('Aguardando dados...');
    const [modelSettings, setModelSettings] = useState<ModelSettings>({ providerType: 'local', localServerUrl: 'http://127.0.0.1:8001', apiKey: '', customApiUrl: '', temperature: 0.7, maxTokens: 1000, repetitionPenalty: 1.2, localModelName: undefined });
    const [modelStatus, setModelStatus] = useState('Verificando...');
    const [savedConversations, setSavedConversations] = useState<Conversation[]>([]);
    const [activeTab, setActiveTab] = useState("chat");
    const [promptInput, setPromptInput] = useState('');
    const [iaMessages, setIaMessages] = useState<Message[]>([]);
    const [iaChatLoading, setIaChatLoading] = useState(false);
    const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
    const [contextCampaignId, setContextCampaignId] = useState<string>("__general__");
    const [contextLoading, setContextLoading] = useState<boolean>(false);
    const [campaignsLoading, setCampaignsLoading] = useState<boolean>(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loadingModel, setLoadingModel] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [localModelOptions, setLocalModelOptions] = useState<string[]>(['TinyLlama-1.1B-Chat-v1.0', 'Mistral-7B-Instruct-v0.1', 'Gemma-2B-it']);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatIaEndRef = useRef<HTMLDivElement>(null);
    const chatIaScrollRef = useRef<HTMLDivElement>(null);
    const API_LLM_URL = '/api/llm';
    const API_CAMPAIGNS_URL = '/api/campaigns';
    const API_COPIES_URL = '/api/copies';

    const neonColor = '#1E90FF'; 
    const neonColorMuted = '#4682B4';
    const cardStyle = "bg-[#141414]/80 backdrop-blur-sm shadow-[5px_5px_10px_rgba(0,0,0,0.4),-5px_-5px_10px_rgba(255,255,255,0.05)] rounded-lg border-none";
    const insetCardStyle = "bg-[#141414]/50 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.03)] rounded-md border-none";
    const neumorphicInputStyle = "bg-[#141414] text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] placeholder:text-gray-500 border-none focus:ring-2 focus:ring-[#1E90FF] focus:ring-offset-2 focus:ring-offset-[#0e1015] h-9 text-sm px-3 py-2";
    const neumorphicTextAreaStyle = cn(neumorphicInputStyle, "min-h-[80px] py-2");
    const neumorphicButtonStyle = "bg-[#141414] border-none text-white shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] hover:bg-[#1E90FF]/80 active:scale-[0.98] active:brightness-95 transition-all duration-150 ease-out h-9 px-3 text-sm";
    const neumorphicGhostButtonStyle = cn(neumorphicButtonStyle, "bg-transparent shadow-none hover:bg-[#1E90FF]/20 hover:text-[#1E90FF] h-8 w-8 p-0");
    const primaryNeumorphicButtonStyle = cn(neumorphicButtonStyle, "bg-[#1E90FF]/80 hover:bg-[#1E90FF]/100");
    const tabsListStyle = "bg-[#141414]/70 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] rounded-lg p-1 h-auto";
    const tabsTriggerStyle = "data-[state=active]:bg-[#1E90FF]/30 data-[state=active]:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] data-[state=active]:text-white text-gray-400 hover:text-white hover:bg-[#1E90FF]/10 rounded-md px-3 py-1.5 text-sm transition-all duration-150";
    const iconStyle = { filter: `drop-shadow(0 0 3px ${neonColorMuted})` };
    const primaryIconStyle = { filter: `drop-shadow(0 0 3px ${neonColor})` };
    const neumorphicSliderStyle = "[&>span:first-child]:bg-[#141414] [&>span:first-child]:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] [&>span:first-child]:h-2 [&>span>span]:bg-[#1E90FF] [&>span>span]:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05)] [&>span>span]:h-4 [&>span>span]:w-4 [&>span>span]:border-none";

    const loadSettingsFromLocal = useCallback(() => {
        try {
            const savedSettings = localStorage.getItem('llmSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                setModelSettings(prev => ({ ...prev, ...parsedSettings }));
            }
        } catch (e) {
            console.error("Erro ao carregar configurações:", e);
        }
    }, []);

    const fetchCampaignOptions = useCallback(async () => {
        setCampaignsLoading(true);
        setPageError(null);
        try {
            const response = await axios.get<CampaignOption[]>(`${API_CAMPAIGNS_URL}?fields=id,name`);
            if (response.status !== 200 || !Array.isArray(response.data)) {
                throw new Error(`Falha ao buscar campanhas (Status: ${response.status})`);
            }
            setCampaignOptions(response.data);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || "Falha ao buscar campanhas.";
            setPageError(`Erro Crítico ao Carregar Campanhas: ${errorMsg}. Verifique console do servidor (API / DB).`);
            toast({ title: "Erro Crítico de Dados", description: errorMsg, variant: "destructive", duration: 10000 });
            setCampaignOptions([]);
        } finally {
            setCampaignsLoading(false);
        }
    }, [API_CAMPAIGNS_URL, toast]);

    const generateContext = useCallback(async () => {
        if (campaignsLoading || !isAuthenticated) return;
        
        setContextLoading(true);
        let contextData = "Contexto não disponível.";
        
        try {
            if (contextCampaignId === "__general__") {
                const campaignsResponse = await axios.get(`${API_CAMPAIGNS_URL}?limit=3&sort=created_at:desc`);
                const campaigns: SimpleCampaignChatInfo[] = campaignsResponse.data;
                
                let campaignSummary = "Resumo das 3 campanhas mais recentes:\n";
                if (campaigns.length === 0) {
                    campaignSummary += "Nenhuma campanha disponível.\n";
                } else {
                    campaigns.forEach((camp, i) => {
                        campaignSummary += `${i+1}. Nome: ${camp.name || 'N/A'}, Plataforma: ${camp.platform || 'N/A'}, Objetivo: ${camp.objective || 'N/A'}\n`;
                    });
                }
                
                const copiesResponse = await axios.get(`${API_COPIES_URL}?limit=3&sort=created_at:desc`);
                const copies: CopyInfo[] = copiesResponse.data;
                
                let copySummary = "\nResume dos 3 textos mais recentes:\n";
                if (copies.length === 0) {
                    copySummary += "Nenhum texto disponível.\n";
                } else {
                    copies.forEach((copy, i) => {
                        copySummary += `${i+1}. Título: ${copy.title || 'N/A'}, Público: ${copy.target_audience || 'N/A'}\n`;
                        if (copy.content) {
                            const shortContent = copy.content.length > 100 ? copy.content.substring(0, 100) + "..." : copy.content;
                            copySummary += `   Conteúdo: ${shortContent}\n`;
                        }
                    });
                }
                
                contextData = campaignSummary + copySummary;
            } else {
                const campaignResponse = await axios.get(`${API_CAMPAIGNS_URL}/${contextCampaignId}`);
                const campaign = campaignResponse.data;
                
                let campaignDetail = `Detalhes da Campanha "${campaign.name}":\n`;
                campaignDetail += `Plataforma: ${campaign.platform || 'N/A'}\n`;
                campaignDetail += `Orçamento: R$ ${campaign.daily_budget || 'N/A'} / dia\n`;
                campaignDetail += `Duração: ${campaign.duration || 'N/A'} dias\n`;
                campaignDetail += `Objetivo: ${campaign.objective || 'N/A'}\n`;
                
                const copiesResponse = await axios.get(`${API_COPIES_URL}?campaign_id=${contextCampaignId}`);
                const copies: CopyInfo[] = copiesResponse.data;
                
                let copySummary = "\nTextos desta campanha:\n";
                if (copies.length === 0) {
                    copySummary += "Nenhum texto disponível para esta campanha.\n";
                } else {
                    copies.forEach((copy, i) => {
                        copySummary += `${i+1}. Título: ${copy.title || 'N/A'}, CTA: ${copy.cta || 'N/A'}\n`;
                        copySummary += `   Público: ${copy.target_audience || 'N/A'}\n`;
                        if (copy.content) {
                            const shortContent = copy.content.length > 150 ? copy.content.substring(0, 150) + "..." : copy.content;
                            copySummary += `   Conteúdo: ${shortContent}\n`;
                        }
                    });
                }
                
                contextData = campaignDetail + copySummary;
            }
        } catch (error: any) {
            contextData = `Erro ao carregar contexto: ${error.message}`;
            toast({ title: "Erro ao carregar contexto", description: error.message, variant: "destructive" });
        } finally {
            setContext(contextData);
            setContextLoading(false);
        }
    }, [API_CAMPAIGNS_URL, API_COPIES_URL, contextCampaignId, toast, campaignOptions, campaignsLoading, isAuthenticated]);

    const checkModelStatus = useCallback(async () => {
        setModelStatus('Verificando...');
        
        try {
            if (modelSettings.providerType === 'local') {
                try {
                    const response = await axios.get(`${modelSettings.localServerUrl}/health`, { timeout: 3000 });
                    if (response.data?.status === 'ok') {
                        const modelName = response.data?.model || modelSettings.localModelName || 'padrão';
                        setModelStatus(`Local Ativo (${modelName})`);
                    } else {
                        setModelStatus('Servidor Local: Erro');
                    }
                } catch (error) {
                    setModelStatus('Servidor Local: offline');
                }
            } else if (modelSettings.providerType === 'openai') {
                if (modelSettings.apiKey) {
                    setModelStatus('API OpenAI configurada');
                } else {
                    setModelStatus('API OpenAI: Sem Chave!');
                }
            } else if (modelSettings.providerType === 'gemini') {
                if (modelSettings.apiKey) {
                    setModelStatus('API Gemini configurada');
                } else {
                    setModelStatus('API Gemini: Sem Chave!');
                }
            } else if (modelSettings.providerType === 'custom') {
                if (modelSettings.customApiUrl) {
                    setModelStatus('API Custom configurada');
                } else {
                    setModelStatus('API Custom: Sem URL!');
                }
            }
        } catch (error) {
            setModelStatus('Erro ao verificar');
        }
    }, [modelSettings.providerType, modelSettings.localServerUrl, modelSettings.localModelName, modelSettings.apiKey, modelSettings.customApiUrl]);

    const handleSettingsChange = (key: keyof ModelSettings, value: any) => {
        setModelSettings(prev => ({ ...prev, [key]: value }));
    };

    const saveSettingsToLocal = () => {
        try {
            localStorage.setItem('llmSettings', JSON.stringify(modelSettings));
            toast({ title: "Configurações salvas", description: "Suas preferências foram salvas localmente" });
            checkModelStatus();
        } catch (e) {
            toast({ title: "Erro ao salvar", description: "Não foi possível salvar as configurações", variant: "destructive" });
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (!input.trim() || loading) return;
        
        const userMessage = { role: 'user' as const, content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        setInput('');
        
        try {
            const contextInfo = `CONTEXTO DE MARKETING:\n${context}\n\nBASEADO NO CONTEXTO ACIMA, RESPONDA:`;
            const prompt = `${contextInfo}\n\n${userMessage.content}`;
            
            const response = await callApiLLM(prompt);
            const assistantResponse = { role: 'assistant' as const, content: response?.text || "Desculpe, não consegui processar sua solicitação." };
            
            setMessages(prev => [...prev, assistantResponse]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${error.message || 'Falha ao processar resposta'}` }]);
            toast({ title: "Erro", description: error.message || "Falha ao processar resposta", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const callApiLLM = async (prompt: string, response_json_schema?: object): Promise<any> => {
        let requestBody: any = { prompt };
        
        if (response_json_schema) {
            requestBody.response_format = { type: "json_object", schema: response_json_schema };
        }
        
        if (modelSettings.providerType === 'local') {
            requestBody.url = modelSettings.localServerUrl;
            requestBody.provider = 'local';
            if (modelSettings.localModelName) {
                requestBody.model = modelSettings.localModelName;
            }
        } else if (modelSettings.providerType === 'openai') {
            requestBody.provider = 'openai';
            requestBody.api_key = modelSettings.apiKey;
        } else if (modelSettings.providerType === 'gemini') {
            requestBody.provider = 'gemini';
            requestBody.api_key = modelSettings.apiKey;
        } else if (modelSettings.providerType === 'custom') {
            requestBody.provider = 'custom';
            requestBody.url = modelSettings.customApiUrl;
            requestBody.api_key = modelSettings.apiKey;
        }
        
        requestBody.temperature = modelSettings.temperature;
        requestBody.max_tokens = modelSettings.maxTokens;
        requestBody.repetition_penalty = modelSettings.repetitionPenalty;
        
        const response = await axios.post(API_LLM_URL, requestBody);
        return response.data;
    };

    const handleSendIaMessage = async () => {
        if (!promptInput.trim() || iaChatLoading) return;
        
        const userMessage = { role: 'user' as const, content: promptInput.trim() };
        setIaMessages(prev => [...prev, userMessage]);
        setIaChatLoading(true);
        setPromptInput('');
        
        try {
            const response = await callApiLLM(userMessage.content);
            const assistantResponse = { role: 'assistant' as const, content: response?.text || "Desculpe, não consegui processar sua solicitação." };
            
            setIaMessages(prev => [...prev, assistantResponse]);
        } catch (error: any) {
            setIaMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${error.message || 'Falha ao processar resposta'}` }]);
            toast({ title: "Erro", description: error.message || "Falha ao processar resposta", variant: "destructive" });
        } finally {
            setIaChatLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (activeTab === 'chat') {
                handleSendMessage();
            } else if (activeTab === 'ia-chat') {
                handleSendIaMessage();
            }
        }
    };

    const saveConversation = () => {
        if (messages.length <= 1) {
            toast({ title: "Conversa vazia", description: "Não há mensagens para salvar" });
            return;
        }
        
        const newConversation: Conversation = {
            id: Date.now().toString(),
            title: messages[1].content.substring(0, 30) + (messages[1].content.length > 30 ? '...' : ''),
            date: new Date().toISOString(),
            messages: [...messages]
        };
        
        const updatedConversations = [...savedConversations, newConversation];
        setSavedConversations(updatedConversations);
        localStorage.setItem('savedConversations', JSON.stringify(updatedConversations));
        
        toast({ title: "Conversa salva", description: "Você pode acessá-la na aba Histórico" });
    };

    const loadSavedConversations = () => {
        try {
            const saved = localStorage.getItem('savedConversations');
            if (saved) {
                setSavedConversations(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Erro ao carregar conversas:", e);
        }
    };

    const loadConversation = (id: string) => {
        const conversation = savedConversations.find(conv => conv.id === id);
        if (conversation) {
            setMessages(conversation.messages);
            setActiveTab('chat');
            toast({ title: "Conversa carregada", description: "Conversa restaurada do histórico" });
        }
    };

    const deleteConversation = (id: string) => {
        const updatedConversations = savedConversations.filter(conv => conv.id !== id);
        setSavedConversations(updatedConversations);
        localStorage.setItem('savedConversations', JSON.stringify(updatedConversations));
        toast({ title: "Conversa removida", description: "A conversa foi removida do histórico" });
    };

    const clearConversation = () => {
        setMessages([{ role: 'assistant', content: 'Chat limpo. Como posso ajudar?' }]);
        toast({ title: "Chat limpo", description: "Todas as mensagens foram removidas" });
    };

    const clearIaConversation = () => {
        setIaMessages([]);
        toast({ title: "Chat IA limpo", description: "Todas as mensagens foram removidas" });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const loadLocalModel = async () => {
        if (!selectedFile) return;
        
        setLoadingModel(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const modelName = selectedFile.name.replace(/\.(gguf|bin|onnx|safetensors)$/, '');
            handleSettingsChange('localModelName', modelName);
            
            setLocalModelOptions(prev => {
                if (!prev.includes(modelName)) {
                    return [...prev, modelName];
                }
                return prev;
            });
            
            toast({ title: "Modelo configurado", description: `Nome do modelo definido: ${modelName}`, duration: 5000 });
        } catch (e) {
            toast({ title: "Erro ao configurar modelo", description: "Ocorreu um erro ao definir o modelo", variant: "destructive" });
        } finally {
            setLoadingModel(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        } else if (!authLoading && isAuthenticated) {
            loadSavedConversations();
            loadSettingsFromLocal();
            fetchCampaignOptions();
        }
    }, [authLoading, isAuthenticated, router, loadSettingsFromLocal, fetchCampaignOptions]);

    useEffect(() => {
        if (isAuthenticated && !campaignsLoading && !pageError) {
            generateContext();
        }
    }, [isAuthenticated, campaignsLoading, pageError, contextCampaignId, generateContext]);

    useEffect(() => { 
        checkModelStatus(); 
    }, [checkModelStatus]);
    
    useEffect(() => { 
        scrollToBottom(); 
    }, [messages]);
    
    useEffect(() => { 
        chatIaEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
    }, [iaMessages]);

    if (authLoading || campaignsLoading) {
        return (
            <Layout>
                <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">{authLoading ? 'Verificando...' : 'Carregando dados...'}</span>
                </div>
            </Layout>
        );
    }
    
    if (!isAuthenticated) {
        return null;
    }
    
    if (pageError) {
        return (
            <Layout>
                <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center text-center text-red-400 p-6">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Erro Crítico</h2>
                        <p className="text-sm">{pageError}</p>
                        <Button onClick={fetchCampaignOptions} className='mt-4'>Tentar Recarregar</Button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Head>
                <title>Chat IA - USBMKT</title>
            </Head>
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-black text-white" style={{ textShadow: `0 0 8px ${neonColor}` }}>
                        USBABC IA MKT DIGITAL
                    </h1>
                    <div className={cn(insetCardStyle, "p-1.5 px-3 rounded-full flex items-center gap-1.5 text-xs")}>
                        <Zap className={cn("h-3.5 w-3.5", modelStatus.includes('Local Ativo') ? 'text-green-400 animate-pulse' : modelStatus.includes('API') ? 'text-blue-400' : modelStatus.includes('offline') || modelStatus.includes('Erro') || modelStatus.includes('Sem') ? 'text-red-400' : 'text-yellow-400')} style={primaryIconStyle}/>
                        <span className="text-gray-300">{modelStatus}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-400 hover:text-white p-0" onClick={checkModelStatus} title="Verificar Status Novamente">
                            <RefreshCw className="h-3 w-3"/>
                        </Button>
                    </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-4">
                    <div className="lg:col-span-3 space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className={cn(tabsListStyle, "grid grid-cols-4")}>
                                <TabsTrigger value="chat" className={tabsTriggerStyle}>Chat Principal</TabsTrigger>
                                <TabsTrigger value="ia-chat" className={tabsTriggerStyle}>Chat IA Direto</TabsTrigger>
                                <TabsTrigger value="history" className={tabsTriggerStyle}>Histórico</TabsTrigger>
                                <TabsTrigger value="settings" className={tabsTriggerStyle}>Configurações</TabsTrigger>
                            </TabsList>
                            <TabsContent value="chat">
                                <Card className={cn(cardStyle, "overflow-hidden")}>
                                    <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-[#1E90FF]/20">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(insetCardStyle, "p-1.5 rounded-md")}>
                                                <Brain className="h-5 w-5 text-primary" style={primaryIconStyle} />
                                            </div>
                                            <CardTitle className="text-base font-semibold text-white" style={{ textShadow: `0 0 5px ${neonColorMuted}` }} />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Select value={contextCampaignId} onValueChange={(val) => setContextCampaignId(val)}>
                                                <SelectTrigger className={cn(neumorphicInputStyle, "h-7 w-[180px] bg-[#141414]/60")}>
                                                    <SelectValue placeholder="Selecione o contexto" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__general__">Contexto Geral</SelectItem>
                                                    {campaignOptions.map(camp => (
                                                        <SelectItem key={camp.id} value={camp.id}>{camp.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={generateContext} variant="ghost" size="icon" className={cn(neumorphicGhostButtonStyle)} title="Recarregar Contexto">
                                                {contextLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="grid grid-cols-1 lg:grid-cols-3">
                                            <div className="col-span-2 overflow-hidden">
                                                <ScrollArea className="h-[calc(100vh-280px)] p-4">
                                                    <div className="space-y-4">
                                                        {messages.map((msg, i) => (
                                                            <ChatMessage key={i} message={msg} />
                                                        ))}
                                                        {loading && (
                                                            <div className="flex items-center justify-center py-2">
                                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                                <span className="ml-2 text-sm text-muted-foreground">Pensando...</span>
                                                            </div>
                                                        )}
                                                        <div ref={chatEndRef} />
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                            <div className={cn(insetCardStyle, "p-3")}>
                                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-primary">
                                                    <Database className="h-4 w-4" style={primaryIconStyle} />
                                                    Contexto de Marketing
                                                </h3>
                                                <ScrollArea className="h-[calc(100vh-330px)]">
                                                    <div className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                                                        {contextLoading ? (
                                                            <div className="flex items-center justify-center py-8">
                                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                                <span className="ml-2">Carregando dados...</span>
                                                            </div>
                                                        ) : context}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-2 flex items-center gap-2 border-t border-[#1E90FF]/20">
                                        <Input
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Digite sua mensagem..."
                                            className={cn(neumorphicInputStyle, "flex-1")}
                                            disabled={loading}
                                        />
                                        <Button onClick={handleSendMessage} className={cn(primaryNeumorphicButtonStyle, "min-w-[40px]")} disabled={loading || !input.trim()}>
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </Button>
                                        <Button onClick={saveConversation} variant="ghost" size="icon" className={cn(neumorphicGhostButtonStyle)} title="Salvar Conversa">
                                            <Save className="h-4 w-4" />
                                        </Button>
                                        <Button onClick={clearConversation} variant="ghost" size="icon" className={cn(neumorphicGhostButtonStyle)} title="Limpar Chat">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                            <TabsContent value="ia-chat">
                                <Card className={cn(cardStyle, "overflow-hidden")}>
                                    <CardHeader className="flex flex-row items-center justify-between p-3 border-b border-[#1E90FF]/20">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(insetCardStyle, "p-1.5 rounded-md")}>
                                                <Bot className="h-5 w-5 text-primary" style={primaryIconStyle} />
                                            </div>
                                            <CardTitle className="text-base font-semibold text-white" style={{ textShadow: `0 0 5px ${neonColorMuted}` }}>
                                                Chat IA Direto (Sem Contexto)
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <ScrollArea className="h-[calc(100vh-280px)] p-4" ref={chatIaScrollRef}>
                                            <div className="space-y-4">
                                                {iaMessages.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                                        <Lightbulb className="h-8 w-8 mb-2 text-primary/40" style={primaryIconStyle} />
                                                        <p className="text-center text-sm">
                                                            Este é um chat direto com a IA sem contexto de campanhas.<br/>
                                                            Faça perguntas sobre marketing digital ou solicite ideias.
                                                        </p>
                                                    </div>
                                                )}
                                                {iaMessages.map((msg, i) => (
                                                    <ChatMessage key={i} message={msg} />
                                                ))}
                                                {iaChatLoading && (
                                                    <div className="flex items-center justify-center py-2">
                                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                        <span className="ml-2 text-sm text-muted-foreground">Pensando...</span>
                                                    </div>
                                                )}
                                                <div ref={chatIaEndRef} />
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                    <CardFooter className="p-2 flex items-center gap-2 border-t border-[#1E90FF]/20">
                                        <Input
                                            value={promptInput}
                                            onChange={(e) => setPromptInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Digite sua pergunta..."
                                            className={cn(neumorphicInputStyle, "flex-1")}
                                            disabled={iaChatLoading}
                                        />
                                        <Button onClick={handleSendIaMessage} className={cn(primaryNeumorphicButtonStyle, "min-w-[40px]")} disabled={iaChatLoading || !promptInput.trim()}>
                                            {iaChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </Button>
                                        <Button onClick={clearIaConversation} variant="ghost" size="icon" className={cn(neumorphicGhostButtonStyle)} title="Limpar Chat">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                            <TabsContent value="history">
                                <Card className={cn(cardStyle)}>
                                    <CardHeader className="p-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                                <History className="h-5 w-5" style={primaryIconStyle} />
                                                Histórico de Conversas
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <ScrollArea className="h-[calc(100vh-300px)]">
                                            {savedConversations.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                                    <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                                                    <p className="text-center text-sm">Nenhuma conversa salva ainda.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {savedConversations.map((conv) => (
                                                        <Card key={conv.id} className={cn(insetCardStyle, "p-3")}>
                                                            <div className="flex items-center justify-between">
                                                                <div className="overflow-hidden">
                                                                    <h3 className="text-sm font-medium truncate">{conv.title}</h3>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {format(parseISO(conv.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        onClick={() => loadConversation(conv.id)}
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7"
                                                                    >
                                                                        <MessageSquare className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => deleteConversation(conv.id)}
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="settings">
                                <Card className={cn(cardStyle)}>
                                    <CardHeader className="p-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                                <Settings className="h-5 w-5" style={primaryIconStyle} />
                                                Configurações do Sistema IA
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4 pt-0 space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="provider-type">Tipo de Provedor IA</Label>
                                                <Select
                                                    value={modelSettings.providerType}
                                                    onValueChange={(val) => handleSettingsChange('providerType', val)}
                                                >
                                                    <SelectTrigger className={neumorphicInputStyle}>
                                                        <SelectValue placeholder="Selecione o tipo de modelo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="local">
                                                            <div className="flex items-center">
                                                                <Server className="mr-2 h-4 w-4" />
                                                                <span>Servidor Local</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="openai">
                                                            <div className="flex items-center">
                                                                <Globe className="mr-2 h-4 w-4" />
                                                                <span>OpenAI API</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="gemini">
                                                            <div className="flex items-center">
                                                                <Cpu className="mr-2 h-4 w-4" />
                                                                <span>Google Gemini API</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="custom">
                                                            <div className="flex items-center">
                                                                <Filter className="mr-2 h-4 w-4" />
                                                                <span>API Customizada</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {modelSettings.providerType === 'local' && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="local-model">Modelo Local</Label>
                                                    <Select
                                                        value={modelSettings.localModelName}
                                                        onValueChange={(val) => handleSettingsChange('localModelName', val)}
                                                    >
                                                        <SelectTrigger className={neumorphicInputStyle}>
                                                            <SelectValue placeholder="Selecione o modelo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {localModelOptions.map((model) => (
                                                                <SelectItem key={model} value={model}>{model}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {modelSettings.providerType === 'local' && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="local-server-url">URL do Servidor Local</Label>
                                                    <Input
                                                        id="local-server-url"
                                                        value={modelSettings.localServerUrl}
                                                        onChange={(e) => handleSettingsChange('localServerUrl', e.target.value)}
                                                        className={neumorphicInputStyle}
                                                        placeholder="http://127.0.0.1:8001"
                                                    />
                                                </div>
                                            )}

                                            {(modelSettings.providerType === 'openai' || modelSettings.providerType === 'gemini' || modelSettings.providerType === 'custom') && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="api-key" className="flex items-center gap-1">
                                                        <KeyRound className="h-3.5 w-3.5" />
                                                        Chave API
                                                    </Label>
                                                    <Input
                                                        id="api-key"
                                                        value={modelSettings.apiKey}
                                                        onChange={(e) => handleSettingsChange('apiKey', e.target.value)}
                                                        type="password"
                                                        className={neumorphicInputStyle}
                                                        placeholder="sk-xxxxxxxxxxxxxxxx"
                                                    />
                                                </div>
                                            )}

                                            {modelSettings.providerType === 'custom' && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="custom-api-url">URL API Customizada</Label>
                                                    <Input
                                                        id="custom-api-url"
                                                        value={modelSettings.customApiUrl}
                                                        onChange={(e) => handleSettingsChange('customApiUrl', e.target.value)}
                                                        className={neumorphicInputStyle}
                                                        placeholder="https://api.exemplo.com/v1/chat/completions"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="temperature" className="flex justify-between">
                                                    <span>Temperatura</span>
                                                    <span className="text-muted-foreground text-xs">{modelSettings.temperature.toFixed(1)}</span>
                                                </Label>
                                                <Slider
                                                    id="temperature"
                                                    value={[modelSettings.temperature]}
                                                    min={0}
                                                    max={2}
                                                    step={0.1}
                                                    onValueChange={([value]) => handleSettingsChange('temperature', value)}
                                                    className={neumorphicSliderStyle}
                                                />
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Preciso</span>
                                                    <span>Criativo</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="max-tokens" className="flex justify-between">
                                                    <span>Tamanho Máximo</span>
                                                    <span className="text-muted-foreground text-xs">{modelSettings.maxTokens} tokens</span>
                                                </Label>
                                                <Slider
                                                    id="max-tokens"
                                                    min={100}
                                                    max={4000}
                                                    step={100}
                                                    value={[modelSettings.maxTokens]}
                                                    onValueChange={([value]) => handleSettingsChange('maxTokens', value)}
                                                    className={neumorphicSliderStyle}
                                                />
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Curto</span>
                                                    <span>Longo</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="repetition-penalty" className="flex justify-between">
                                                    <span>Penalidade de Repetição</span>
                                                    <span className="text-muted-foreground text-xs">{modelSettings.repetitionPenalty.toFixed(1)}</span>
                                                </Label>
                                                <Slider
                                                    id="repetition-penalty"
                                                    min={1.0}
                                                    max={2.0}
                                                    step={0.1}
                                                    value={[modelSettings.repetitionPenalty]}
                                                    onValueChange={([value]) => handleSettingsChange('repetitionPenalty', value)}
                                                    className={neumorphicSliderStyle}
                                                />
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Normal</span>
                                                    <span>Variado</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <h3 className="text-sm font-semibold mb-3">Gerenciamento de Modelos Locais</h3>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="file-upload">Selecionar Modelo</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="file-upload"
                                                            type="file"
                                                            ref={fileInputRef}
                                                            onChange={handleFileChange}
                                                            className={cn(neumorphicInputStyle, "text-xs")}
                                                            accept=".gguf,.bin,.onnx,.safetensors"
                                                        />
                                                        <Button
                                                            onClick={loadLocalModel}
                                                            className={cn(neumorphicButtonStyle)}
                                                            disabled={!selectedFile || loadingModel}
                                                        >
                                                            {loadingModel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Apenas configura o nome do modelo (não faz upload).
                                                    </p>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <Label htmlFor="test-connection">Salvar e Testar</Label>
                                                            <Button
                                                                onClick={saveSettingsToLocal}
                                                                className={cn(primaryNeumorphicButtonStyle, "text-xs")}
                                                            >
                                                                <Save className="h-4 w-4 mr-1" /> Salvar Configurações
                                                            </Button>
                                                        </div>
                                                        <div className={cn(insetCardStyle, "p-2 text-xs text-muted-foreground")}>
                                                            <p>Status: <span className={modelStatus.includes('Ativo') ? 'text-green-400' : modelStatus.includes('offline') || modelStatus.includes('Erro') ? 'text-red-400' : 'text-yellow-400'}>{modelStatus}</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="space-y-4">
                        <Card className={cn(cardStyle)}>
                            <CardHeader className="p-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" style={primaryIconStyle} />
                                    Sugestões de Prompts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <div className="space-y-2 text-sm">
                                    <Button 
                                        variant="ghost" 
                                        className={cn(insetCardStyle, "w-full justify-start text-xs p-2 h-auto")}
                                        onClick={() => setInput("Crie 3 títulos atrativos para um anúncio de Facebook sobre venda de cursos de marketing digital.")}
                                    >
                                        Crie títulos para anúncio no Facebook
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        className={cn(insetCardStyle, "w-full justify-start text-xs p-2 h-auto")}
                                        onClick={() => setInput("Analise o público-alvo ideal para uma campanha de marketing de imóveis de luxo.")}
                                    >
                                        Analisar público-alvo para campanha
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        className={cn(insetCardStyle, "w-full justify-start text-xs p-2 h-auto")}
                                        onClick={() => setInput("Sugira 5 CTAs eficazes para uma landing page de venda de infoprodutos.")}
                                    >
                                        Sugestões de CTAs para landing page
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        className={cn(insetCardStyle, "w-full justify-start text-xs p-2 h-auto")}
                                        onClick={() => setInput("Crie um texto persuasivo de 3 parágrafos para email marketing sobre um workshop gratuito.")}
                                    >
                                        Texto para email marketing
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        className={cn(insetCardStyle, "w-full justify-start text-xs p-2 h-auto")}
                                        onClick={() => setInput("Quais são as melhores estratégias de remarketing para e-commerce em 2025?")}
                                    >
                                        Estratégias de remarketing
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={cn(cardStyle)}>
                            <CardHeader className="p-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4" style={primaryIconStyle} />
                                    Dicas de Uso
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <div className="space-y-2 text-xs text-muted-foreground">
                                    <p>• Selecione uma campanha específica no menu suspenso para obter respostas contextualizadas.</p>
                                    <p>• Use o Chat IA Direto para perguntas gerais sem contexto.</p>
                                    <p>• Salve conversas importantes para referência futura.</p>
                                    <p>• Ajuste as configurações de modelo para respostas mais criativas ou precisas.</p>
                                    <p>• Seja específico em suas solicitações para obter melhores resultados.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}