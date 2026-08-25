import { AIChatBox, type Message as ChatMessage } from "@/components/AIChatBox";
import { OnboardingPage } from "@/components/OnboardingPage";
import { SpecialistsPage } from "@/components/SpecialistsPage";
import { AvailabilityPage } from "@/components/AvailabilityPage";
import { BehaviorModePanel } from "@/components/BehaviorModePanel";
import { ConversationControlPage } from "@/components/ConversationControlPage";
import { VoiceSettingsPage } from "@/components/VoiceSettingsPage";
import { MediaLibraryPage } from "@/components/MediaLibraryPage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { parseBrazilianAppointmentDateTime } from "@/lib/appointmentDateTime";
import { trpc } from "@/lib/trpc";
import { AudioLines, BarChart3, Bot, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, FileText, Globe2, Image as ImageIcon, Inbox, LayoutDashboard, Loader2, MessageCircleMore, Paperclip, PhoneCall, PlayCircle, Search, Sparkles, UploadCloud, UsersRound, Video, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Section = "visao" | "especialistas" | "onboarding" | "agente" | "simulador" | "conversas" | "midia" | "canal" | "ia-voz" | "horarios" | "agenda" | "metricas";
const logoUrl = "/manus-storage/cecretar-ia-logo_41522243.png";
const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const navigation: Array<{ id: Section; label: string; icon: typeof Bot }> = [
  { id: "visao", label: "Visão geral", icon: LayoutDashboard },
  { id: "especialistas", label: "Especialistas", icon: BriefcaseBusiness },
  { id: "onboarding", label: "Configurar negócio", icon: Sparkles },
  { id: "agente", label: "Agente", icon: Bot },
  { id: "simulador", label: "Simulador", icon: MessageCircleMore },
  { id: "conversas", label: "Caixa de entrada", icon: Inbox },
  { id: "midia", label: "Biblioteca de mídia", icon: Paperclip },
  { id: "canal", label: "Canal WhatsApp", icon: PhoneCall },
  { id: "ia-voz", label: "IA e voz", icon: AudioLines },
  { id: "horarios", label: "Horários", icon: Clock3 },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "metricas", label: "Métricas", icon: BarChart3 },
];

const formatDate = (value: Date | string | number) => dateFormat.format(new Date(value));

export default function Home() {
  const [section, setSection] = useState<Section>(() => (new URLSearchParams(window.location.search).get("section") as Section) || "visao");
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>();
  const configQuery = trpc.agent.getConfig.useQuery(selectedAgentId ? { agentId: selectedAgentId } : undefined);
  const overview = trpc.dashboard.getOverview.useQuery();
  const agents = trpc.agent.list.useQuery();
  const templates = trpc.agent.templates.useQuery();
  const conversations = trpc.conversations.list.useQuery(undefined, { refetchInterval: 10_000 });
  const appointments = trpc.appointments.list.useQuery(undefined, { refetchInterval: 20_000 });
  const utils = trpc.useUtils();
  const refresh = () => {
    void utils.agent.getConfig.invalidate();
    void utils.agent.list.invalidate();
    void utils.dashboard.getOverview.invalidate();
    void utils.conversations.list.invalidate();
    void utils.appointments.list.invalidate();
    void utils.whatsapp.getConfig.invalidate();
    void utils.instagram.getConfig.invalidate();
    void utils.availability.list.invalidate();
  };

  if (configQuery.isLoading || overview.isLoading || !configQuery.data || !overview.data) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-7 animate-spin text-primary" /></div>;
  const config = configQuery.data;
  const metrics = overview.data.metrics;
  const switchAgent = (agentId: number, destination: Section = "agente") => { setSelectedAgentId(agentId); setSection(destination); };

  return <div className="min-h-screen bg-[#f7faf8]">
    <aside className="fixed inset-y-0 left-0 hidden w-[258px] border-r border-[#e2ebe5] bg-white p-5 lg:flex lg:flex-col">
      <img src={logoUrl} alt="CECRETAR.IA" className="h-10 w-[168px] rounded object-cover object-center" />
      <div className="my-7 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center gap-2"><Bot className="size-4 text-primary" /><span className="text-xs font-bold text-emerald-950">Especialista em edição</span></div><p className="mt-3 text-sm font-bold text-emerald-950">{config.agent.name}</p><p className="mt-1 text-xs text-emerald-800">{config.agent.templateKey.replaceAll("_", " ")}</p></div>
      <nav className="space-y-1">{navigation.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => setSection(item.id)} className={cn("flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium", section === item.id ? "bg-emerald-50 text-primary" : "text-slate-600 hover:bg-slate-50")}><Icon className="size-[18px]" />{item.label}</button>; })}</nav>
      <div className="mt-auto rounded-2xl bg-[#123829] p-4 text-white"><Sparkles className="size-5 text-[#8fe0ae]" /><p className="mt-3 text-sm font-bold">Motor de IA plugável</p><p className="mt-1 text-xs leading-5 text-emerald-100/80">Use o modelo embutido no teste e troque o provedor depois, sem recriar o agente.</p></div>
    </aside>
    <main className="lg:pl-[258px]"><header className="sticky top-0 z-10 flex min-h-[76px] flex-wrap items-center justify-between gap-3 border-b border-[#e2ebe5] bg-white/90 px-5 py-3 backdrop-blur lg:h-[76px] lg:flex-nowrap lg:px-9 lg:py-0"><div><p className="text-sm text-muted-foreground">{config.company.name}</p><h1 className="font-[Manrope] text-xl font-extrabold">{navigation.find(item => item.id === section)?.label}</h1></div><Button variant="outline" className="shrink-0" onClick={() => setSection("simulador")}><PlayCircle className="mr-2 size-4 text-primary" />Testar agente</Button><div className="order-3 w-full lg:hidden"><Select value={section} onValueChange={value => setSection(value as Section)}><SelectTrigger aria-label="Navegar entre seções" className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent>{navigation.map(item => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div></header><div className="mx-auto max-w-[1480px] p-5 lg:p-9">
      {section === "visao" && <Overview metrics={metrics} conversations={overview.data.conversations} onNavigate={setSection} />}
      {section === "especialistas" && <SpecialistsPage templates={templates.data ?? []} agents={agents.data ?? []} onChoose={(id) => switchAgent(id)} onCreated={(id) => { switchAgent(id); refresh(); }} />}
      {section === "onboarding" && <OnboardingPage config={config} onSaved={refresh} />}
      {section === "agente" && <><AgentEditor config={config} onSaved={refresh} /><BehaviorModePanel config={config} onSaved={refresh} /></>}
      {section === "simulador" && <Simulator config={config} onRefresh={refresh} />}
      {section === "conversas" && <ConversationControlPage config={config} rows={conversations.data ?? []} onRefresh={refresh} />}
      {section === "midia" && <MediaLibraryPage config={config} onRefresh={refresh} />}
      {section === "canal" && <ChannelPage config={config} />}
      {section === "ia-voz" && <VoiceSettingsPage agentId={config.agent.id} agentName={config.agent.name} />}
      {section === "horarios" && <AvailabilityPage agentId={config.agent.id} agentName={config.agent.name} />}
      {section === "agenda" && <Agenda config={config} rows={appointments.data ?? []} onRefresh={refresh} />}
      {section === "metricas" && <Metrics metrics={metrics} />}
    </div></main>
  </div>;
}

function Overview({ metrics, conversations, onNavigate }: { metrics: any; conversations: any[]; onNavigate: (item: Section) => void }) {
  const cards = [["Conversas", metrics.conversations, MessageCircleMore], ["Qualificados", metrics.qualified, CheckCircle2], ["Agendamentos", metrics.appointments, CalendarDays], ["Transferências", metrics.humanHandoffs, UsersRound]] as const;
  return <div className="space-y-6 enter-up"><section className="rounded-[26px] bg-[#113b2b] p-7 text-white"><Badge className="border-0 bg-white/10 text-emerald-100">Centro de comando</Badge><h2 className="mt-3 max-w-2xl font-[Manrope] text-3xl font-extrabold">Configure especialistas, valide conversas e ative canais quando estiver pronto.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/75">O Duconde continua como piloto, e os novos especialistas ficam isolados por regras, mídias, agenda e canais.</p><div className="mt-5 flex gap-3"><Button onClick={() => onNavigate("especialistas")} className="bg-[#76d99b] text-[#0e3425] hover:bg-[#9be9b7]">Ver especialistas</Button><Button onClick={() => onNavigate("simulador")} variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">Abrir simulador</Button></div></section><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-[#e3ece6] bg-white p-5"><Icon className="size-5 text-primary" /><p className="mt-5 text-3xl font-[Manrope] font-extrabold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>)}</section><section className="rounded-2xl border border-[#e3ece6] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">Conversas recentes</p><p className="mt-1 text-xs text-muted-foreground">Acompanhe o que está acontecendo nos testes.</p></div><Button variant="ghost" onClick={() => onNavigate("conversas")}>Abrir caixa</Button></div><div className="mt-4 divide-y divide-[#edf2ee]">{conversations.length ? conversations.map((row: any) => <div key={row.id} className="flex items-center gap-3 py-3"><Avatar className="size-9"><AvatarFallback>{row.contactName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div className="flex-1"><p className="text-sm font-semibold">{row.contactName}</p><p className="text-xs text-muted-foreground">{row.channel}</p></div><Badge variant="secondary">{row.status}</Badge></div>) : <Empty text="Nenhuma conversa ainda." />}</div></section></div>;
}

function AgentEditor({ config, onSaved }: { config: any; onSaved: () => void }) {
  const [form, setForm] = useState<any>(() => ({ ...config.agent }));
  const [fields, setFields] = useState<any[]>(config.qualificationFields);
  const update = trpc.agent.updateConfig.useMutation({ onSuccess: () => { toast.success("Agente salvo."); onSaved(); } });
  const updateFields = trpc.agent.updateQualification.useMutation({ onSuccess: () => { toast.success("Perguntas atualizadas."); onSaved(); } });
  useEffect(() => { setForm({ ...config.agent }); setFields(config.qualificationFields); }, [config]);
  const set = (key: string, value: string) => setForm((current: any) => ({ ...current, [key]: value }));
  const save = () => update.mutate({ agentId: form.id, name: form.name, persona: form.persona, companyInfo: form.companyInfo, services: form.services, pricing: form.pricing, businessHours: form.businessHours, transferKeyword: form.transferKeyword || "#gente", ownerTakeoverCommand: form.ownerTakeoverCommand || "#assumir", websiteUrl: form.websiteUrl || undefined, instagramHandle: form.instagramHandle || undefined, templateKey: form.templateKey, behaviorMode: form.behaviorMode ?? "balanced", provider: form.provider, modelPreference: form.modelPreference });
  return <div className="space-y-6 enter-up"><section className="rounded-2xl border border-[#e3ece6] bg-white p-6"><div className="flex justify-between gap-4"><div><p className="text-sm font-bold">Regras e informações do agente</p><p className="mt-1 text-sm text-muted-foreground">Cada especialista tem uma configuração independente e editável.</p></div><Badge className="bg-emerald-50 text-emerald-700">{form.templateKey?.replaceAll("_", " ")}</Badge></div><div className="mt-6 grid gap-5 md:grid-cols-2"><Field label="Nome"><Input value={form.name} onChange={e => set("name", e.target.value)} /></Field><Field label="Horários"><Input value={form.businessHours} onChange={e => set("businessHours", e.target.value)} /></Field><Field label="Comando do interlocutor"><Input value={form.transferKeyword} onChange={e => set("transferKeyword", e.target.value)} /></Field><Field label="Comando do proprietário"><Input value={form.ownerTakeoverCommand} onChange={e => set("ownerTakeoverCommand", e.target.value)} /></Field><Field label="Informações do negócio" className="md:col-span-2"><Textarea className="min-h-28" value={form.companyInfo} onChange={e => set("companyInfo", e.target.value)} /></Field><Field label="Produtos e serviços"><Textarea className="min-h-28" value={form.services} onChange={e => set("services", e.target.value)} /></Field><Field label="Preços e condições"><Textarea className="min-h-28" value={form.pricing} onChange={e => set("pricing", e.target.value)} /></Field><Field label="Personalidade e limites" className="md:col-span-2"><Textarea className="min-h-32" value={form.persona} onChange={e => set("persona", e.target.value)} /></Field></div><p className="mt-5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">O interlocutor pode interromper o robô com <strong>{form.transferKeyword || "#gente"}</strong>. Apenas o proprietário autorizado assume pelo comando <strong>{form.ownerTakeoverCommand || "#assumir"}</strong>.</p><div className="mt-5 flex justify-end"><Button onClick={save}>Salvar agente</Button></div></section><section className="rounded-2xl border border-[#e3ece6] bg-white p-6"><p className="text-sm font-bold">Perguntas de qualificação</p><div className="mt-4 space-y-3">{fields.map((field, index) => <div key={`${field.key}-${index}`} className="grid gap-3 rounded-xl border border-[#edf2ee] p-4 md:grid-cols-[1fr_2fr_auto]"><Input value={field.label} onChange={e => setFields(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, label: e.target.value } : row))} /><Input value={field.prompt} onChange={e => setFields(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, prompt: e.target.value } : row))} /><label className="flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={field.required} onCheckedChange={checked => setFields(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, required: checked } : row))} />Obrigatória</label></div>)}</div><div className="mt-5 flex justify-end"><Button variant="outline" onClick={() => updateFields.mutate({ agentId: form.id, fields: fields.map(({ key, label, prompt, required }) => ({ key, label, prompt, required })) })}>Salvar perguntas</Button></div></section></div>;
}

function Simulator({ config, onRefresh }: { config: any; onRefresh: () => void }) {
  const [conversationId, setConversationId] = useState<number>();
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: `Olá! Sou a **${config.agent.name}**. Como posso ajudar? Se preferir falar com uma pessoa, digite **${config.agent.transferKeyword}**.` }]);
  const send = trpc.conversations.send.useMutation({ onSuccess: result => { setConversationId(result.conversationId); setMessages(rows => [...rows, { role: "assistant", content: result.reply }]); if (result.transferToHuman) toast.info("Transferência humana acionada."); onRefresh(); } });
  const submit = (text: string) => { setMessages(rows => [...rows, { role: "user", content: text }]); send.mutate({ conversationId, agentId: config.agent.id, text, contactName: "Contato de teste" }); };
  const reset = () => { setConversationId(undefined); setMessages([{ role: "assistant", content: `Olá! Sou a **${config.agent.name}**. Se preferir falar com uma pessoa, digite **${config.agent.transferKeyword}**.` }]); };
  return <div className="grid gap-6 xl:grid-cols-[1fr_330px] enter-up"><section className="overflow-hidden rounded-2xl border border-[#e3ece6] bg-white"><div className="flex items-center justify-between border-b p-5"><div><p className="text-sm font-bold">Simulador de {config.agent.name}</p><p className="text-xs text-muted-foreground">Teste antes de conectar WhatsApp ou Instagram.</p></div><Button variant="ghost" onClick={reset}>Nova conversa</Button></div><AIChatBox messages={messages} onSendMessage={submit} isLoading={send.isPending} height="620px" placeholder="Escreva como um interessado..." suggestedPrompts={["Quais são os valores?", "Quero agendar um horário", `Quero falar com ${config.agent.transferKeyword}`]} /></section><aside className="space-y-4"><div className="rounded-2xl border border-[#e3ece6] bg-white p-5"><p className="text-sm font-bold">Roteiro de validação</p><div className="mt-4 space-y-3 text-xs text-muted-foreground">{["Informações e preço", "Mídia vinculada", "Qualificação", "Agenda", "#gente", "#assumir no painel"].map(item => <div key={item} className="flex gap-2"><CheckCircle2 className="size-4 text-primary" />{item}</div>)}</div></div><div className="rounded-2xl bg-emerald-50 p-5 text-xs leading-5 text-emerald-800">O agente sempre informa o comando <strong>{config.agent.transferKeyword}</strong>. O comando <strong>#assumir</strong> não é aceito do interlocutor; ele só funciona na caixa de entrada do proprietário.</div></aside></div>;
}

function InboxPage({ config, rows, onRefresh }: { config: any; rows: any[]; onRefresh: () => void }) {
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [ownerText, setOwnerText] = useState("");
  useEffect(() => { if (!selectedId && rows[0]) setSelectedId(rows[0].id); }, [rows, selectedId]);
  const selected = rows.find(row => row.id === selectedId);
  const messageQuery = trpc.conversations.messages.useQuery({ conversationId: selectedId ?? 0 }, { enabled: Boolean(selectedId) });
  const ownerCommand = trpc.conversations.ownerCommand.useMutation({ onSuccess: () => { toast.success("#assumir executado. O robô foi interrompido."); setOwnerText(""); onRefresh(); void messageQuery.refetch(); } });
  const submitOwnerCommand = () => {
    if (!selected) return;
    if (ownerText.trim() !== "#assumir") { toast.error("Digite exatamente #assumir para assumir a conversa."); return; }
    ownerCommand.mutate({ conversationId: selected.id, text: ownerText.trim() });
  };
  return <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-[#e3ece6] bg-white xl:grid-cols-[320px_1fr] enter-up">
    <section className="border-r"><div className="border-b p-4"><p className="text-sm font-bold">Caixa de entrada</p><div className="relative mt-3"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="h-9 pl-9" placeholder="Buscar conversa" /></div></div><div>{rows.length ? rows.map(row => <button key={row.id} onClick={() => setSelectedId(row.id)} className={cn("flex w-full gap-3 border-b p-4 text-left", row.id === selectedId && "bg-emerald-50")}><Avatar className="size-9"><AvatarFallback>{row.contactName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{row.contactName}</span><span className="block text-xs text-muted-foreground">{row.channel}</span></span><Badge variant="secondary">{row.status}</Badge></button>) : <Empty text="As conversas aparecerão aqui." />}</div></section>
    <section className="flex min-h-0 flex-col">{selected ? <><div className="flex items-center justify-between border-b p-5"><div><p className="text-sm font-bold">{selected.contactName}</p><p className="text-xs text-muted-foreground">{selected.channel}</p></div><Badge variant="secondary">{selected.status === "human" ? "Com humano" : "Com robô"}</Badge></div><div className="flex-1 space-y-4 overflow-y-auto bg-[#fbfdfc] p-5">{messageQuery.data?.map((message: any) => <div key={message.id} className={cn("flex", message.role === "lead" ? "justify-end" : "justify-start")}><div className={cn("max-w-[75%] rounded-2xl px-4 py-3 text-sm", message.role === "lead" ? "bg-primary text-white" : message.role === "system" ? "bg-amber-50 text-amber-800" : "border bg-white")}><p>{message.body}</p>{message.mediaIntent && <p className="mt-2 text-xs">Mídia: {message.mediaIntent}</p>}</div></div>)}</div><div className="border-t bg-emerald-50 p-4"><p className="mb-2 text-xs text-emerald-800">O interlocutor pede uma pessoa com <strong>{config.agent.transferKeyword}</strong>. Para interromper o robô, o proprietário deve digitar <strong>#assumir</strong> abaixo.</p><div className="flex gap-2"><Input value={ownerText} onChange={event => setOwnerText(event.target.value)} placeholder="Digite #assumir para assumir" disabled={selected.status === "human" || ownerCommand.isPending} /><Button size="sm" onClick={submitOwnerCommand} disabled={selected.status === "human" || ownerCommand.isPending}><UsersRound className="mr-2 size-4" />Assumir</Button></div></div></> : <Empty text="Selecione uma conversa." />}</section>
  </div>;
}

function MediaLibrary({ config, onRefresh }: { config: any; onRefresh: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [intent, setIntent] = useState("apresentacao");
  const [stage, setStage] = useState("Atendimento");
  const upload = trpc.media.upload.useMutation({ onSuccess: () => { toast.success("Mídia salva."); onRefresh(); } });
  const handle = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => { const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : "document"; upload.mutate({ agentId: config.agent.id, filename: file.name, kind, intent, flowStage: stage, description: "Mídia vinculada ao fluxo", dataUrl: String(reader.result) }); }; reader.readAsDataURL(file); };
  const icons = { image: ImageIcon, audio: Volume2, video: Video, document: FileText };
  return <div className="grid gap-6 xl:grid-cols-[300px_1fr] enter-up"><aside className="rounded-2xl border border-[#e3ece6] bg-white p-5"><p className="text-sm font-bold">Novo conteúdo</p><div className="mt-5 space-y-4"><Field label="Intenção"><Input value={intent} onChange={e => setIntent(e.target.value)} /></Field><Field label="Etapa"><Input value={stage} onChange={e => setStage(e.target.value)} /></Field><Button className="w-full" onClick={() => fileInput.current?.click()}><UploadCloud className="mr-2 size-4" />Enviar mídia</Button><input ref={fileInput} className="hidden" type="file" accept="image/*,audio/*,video/*,.pdf,.doc,.docx" onChange={e => handle(e.target.files?.[0])} /></div></aside><section className="rounded-2xl border border-[#e3ece6] bg-white"><div className="border-b p-5"><p className="text-sm font-bold">Biblioteca de {config.agent.name}</p><p className="text-xs text-muted-foreground">Fotos, vídeos, áudios e arquivos vinculados a intenções.</p></div>{config.mediaAssets.length ? config.mediaAssets.map((asset: any) => { const Icon = icons[asset.kind as keyof typeof icons]; return <div key={asset.id} className="flex items-center gap-4 border-b p-4"><Icon className="size-5 text-primary" /><div className="flex-1"><p className="text-sm font-semibold">{asset.filename}</p><p className="text-xs text-muted-foreground">{asset.intent} · {asset.flowStage}</p></div><Badge variant="outline">{asset.kind}</Badge></div>; }) : <Empty text="Envie o primeiro arquivo deste especialista." />}</section></div>;
}

function ChannelPage({ config }: { config: any }) {
  const channel = trpc.whatsapp.getConfig.useQuery({ agentId: config.agent.id });
  const instagram = trpc.instagram.getConfig.useQuery({ agentId: config.agent.id });
  const [form, setForm] = useState({ displayPhoneNumber: "", phoneNumberId: "", wabaId: "" });
  const [instagramHandle, setInstagramHandle] = useState("");
  const save = trpc.whatsapp.saveDraft.useMutation({ onSuccess: () => toast.success("Rascunho salvo. Nenhum número foi ativado.") });
  const saveInstagram = trpc.instagram.saveDraft.useMutation({ onSuccess: () => toast.success("Rascunho do Instagram salvo. Nenhum Direct foi conectado.") });
  const data = channel.data;
      return <div className="grid gap-6 xl:grid-cols-[1fr_330px] enter-up"><section className="space-y-6"><div className="rounded-[26px] bg-[#113b2b] p-7 text-white"><Badge className="border-0 bg-white/10 text-emerald-100">Canais por especialista</Badge><h2 className="mt-3 font-[Manrope] text-3xl font-extrabold">WhatsApp e Instagram Direct, ativados somente quando você decidir.</h2><p className="mt-3 text-sm leading-6 text-emerald-50/75">O WhatsApp usa Cloud API direta da Meta. O Instagram Direct será conectado por conta comercial autorizada, nunca pelo perfil público usado no onboarding.</p></div><section className="rounded-2xl border border-[#e3ece6] bg-white p-6"><p className="text-sm font-bold">WhatsApp Cloud API — {config.agent.name}</p><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Número exibido"><Input value={form.displayPhoneNumber} onChange={e => setForm({ ...form, displayPhoneNumber: e.target.value })} /></Field><Field label="Phone Number ID"><Input value={form.phoneNumberId} onChange={e => setForm({ ...form, phoneNumberId: e.target.value })} /></Field><Field label="WABA ID" className="md:col-span-2"><Input value={form.wabaId} onChange={e => setForm({ ...form, wabaId: e.target.value })} /></Field></div><div className="mt-5 flex justify-end"><Button onClick={() => save.mutate({ ...form, agentId: config.agent.id })}>Salvar rascunho</Button></div></section><section className="rounded-2xl border border-[#e3ece6] bg-white p-6"><p className="text-sm font-bold">Instagram Direct — {config.agent.name}</p><p className="mt-1 text-xs text-muted-foreground">O perfil público ajuda a sugerir configuração. A conexão de Directs será feita somente com uma conta comercial autorizada.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Input className="min-w-0" value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)} placeholder="@contacomercial" /><Button className="shrink-0" variant="outline" onClick={() => saveInstagram.mutate({ agentId: config.agent.id, profileHandle: instagramHandle || undefined })}>Salvar rascunho</Button></div></section></section><aside className="space-y-4"><div className="rounded-2xl border border-[#e3ece6] bg-white p-5"><p className="text-sm font-bold">Prontidão Meta</p><div className="mt-4 space-y-3 text-xs">{[["Webhook", true], ["Adaptador de mensagens", true], ["Token de acesso", data?.hasToken], ["Token de verificação", data?.hasVerifyToken], ["Segredo do app", data?.hasAppSecret], ["Instagram Direct configurado", instagram.data?.status === "connected"]].map(([label, ok]) => <div key={String(label)} className="flex justify-between"><span>{label}</span>{ok ? <CheckCircle2 className="size-4 text-primary" /> : <Clock3 className="size-4 text-amber-500" />}</div>)}</div></div><div className="rounded-2xl bg-emerald-50 p-5 text-xs leading-5 text-emerald-800"><Globe2 className="mb-2 size-5" />Cada especialista mantém seu próprio rascunho de WhatsApp e Instagram. Nenhum canal é ativado quando os dados são apenas salvos.</div></aside></div>;
}

function Agenda({ config, rows, onRefresh }: { config: any; rows: any[]; onRefresh: () => void }) {
  const [name, setName] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState("");
  const create = trpc.appointments.create.useMutation({ onSuccess: () => { toast.success("Agendamento criado."); onRefresh(); } });
  const cancel = trpc.appointments.cancel.useMutation({ onSuccess: onRefresh });
  const submit = () => {
    const scheduledFor = parseBrazilianAppointmentDateTime(date, time);
    if (!name.trim() || !scheduledFor) return toast.error("Informe nome, data em dd/mm/aaaa e hora em HH:MM.");
    create.mutate({ agentId: config.agent.id, visitorName: name.trim(), scheduledFor });
  };
  return <div className="grid gap-6 xl:grid-cols-[320px_1fr] enter-up"><aside className="rounded-2xl border border-[#e3ece6] bg-white p-5"><p className="text-sm font-bold">Novo agendamento</p><div className="mt-5 space-y-4"><Field label="Nome"><Input value={name} onChange={e => setName(e.target.value)} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Data"><Input inputMode="numeric" maxLength={10} value={date} onChange={e => setDate(e.target.value)} placeholder="dd/mm/aaaa" /></Field><Field label="Hora"><Input inputMode="numeric" maxLength={5} value={time} onChange={e => setTime(e.target.value)} placeholder="HH:MM" /></Field></div><Button className="w-full" onClick={submit}>Agendar</Button></div><div className="mt-6 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">Use o formato brasileiro de data e hora. Cada especialista poderá conectar seu Google Calendar e definir horários disponíveis depois no painel.</div></aside><section className="rounded-2xl border border-[#e3ece6] bg-white"><div className="border-b p-5"><p className="text-sm font-bold">Agenda de {config.agent.name}</p></div>{rows.length ? rows.filter(row => row.agentId === config.agent.id).map(row => <div key={row.id} className="flex items-center gap-4 border-b p-5"><CalendarDays className="size-5 text-primary" /><div className="flex-1"><p className="text-sm font-semibold">{row.visitorName}</p><p className="text-xs text-muted-foreground">{formatDate(row.scheduledFor)}</p></div><Badge variant="secondary">{row.status}</Badge>{row.status !== "canceled" && <Button variant="ghost" size="sm" onClick={() => cancel.mutate({ appointmentId: row.id })}>Cancelar</Button>}</div>) : <Empty text="Nenhum agendamento deste especialista." />}</section></div>;
}

function Metrics({ metrics }: { metrics: any }) { return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 enter-up">{[["Conversas", metrics.conversations], ["Qualificados", metrics.qualified], ["Agendamentos", metrics.appointments], ["Transferências", metrics.humanHandoffs]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-[#e3ece6] bg-white p-5"><p className="text-3xl font-[Manrope] font-extrabold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>)}</div>; }
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) { return <div className={className}><Label className="text-xs font-semibold text-slate-600">{label}</Label><div className="mt-2">{children}</div></div>; }
function Empty({ text }: { text: string }) { return <div className="grid min-h-36 place-items-center p-6 text-center text-sm text-muted-foreground">{text}</div>; }
