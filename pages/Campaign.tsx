// ... imports e definição do componente ...

export default function CampaignPage({ initialCampaigns = [] }: CampaignPageProps) {
  // ... estados, efeitos e funções ...

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
    <> {/* Início do Fragment */}
      <Head>
        <title>Configurações de Campanha - USBMKT</title>
      </Head>
      <Layout> {/* Início do Layout */}
        {/* Conteúdo principal da página */}
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
                    {/* Campos do Formulário (Nome, Indústria, etc.) */}
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
      </Layout> {/* Fim do Layout */}
    </> // <-- Fim do Fragment
  );
}
