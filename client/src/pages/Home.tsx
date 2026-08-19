import { AIChatBox, type Message as ChatMessage } from "@/components/AIChatBox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Loader2,
  MessageCircleMore,
  MoreHorizontal,
  Paperclip,
  PhoneCall,
  PlayCircle,
  Plus,
  Search,
  Settings2,
  Sparkles,
  UploadCloud,
  UserRoundCheck,
  UsersRound,
  Video,
  Volume2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Section = "visao" | "agente" | "simulador" | "conversas" | "midia" | "canal" | "agenda" | "metricas";

const logoUrl = "/manus-storage/cecretar-ia-logo_41522243.png";

const navItems: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: "visao", label: "Visão geral", icon: LayoutDashboard },
  { id: "agente", label: "Agente", icon: Bot },
  { id: "simulador", label: "Simulador", icon: MessageCircleMore },
  { id: "conversas", label: "Caixa de entrada", icon: Inbox },
  { id: "midia", label: "Biblioteca de mídia", icon: Paperclip },
  { id: "canal", label: "Canal WhatsApp", icon: PhoneCall },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "metricas", label: "Métricas", icon: BarChart3 },
];

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function formatDate(value: Date | string | number) {
  return dateTimeFormat.format(new Date(value));
}

function StatusPill({ status }: { status: "bot" | "human" | "closed" }) {
  const styles = {
    bot: "bg-emerald-50 text-emerald-700 border-emerald-100",
    human: "bg-amber-50 text-amber-700 border-amber-100",
    closed: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const labels = { bot: "Atendimento automático", human: "Com humano", closed: "Encerrada" };
  return <Badge variant="outline" className={cn("font-medium", styles[status])}>{labels[status]}</Badge>;
}

export default function Home() {
  const [section, setSection] = useState<Section>("visao");
  const overview = trpc.dashboard.getOverview.useQuery(undefined, { refetchInterval: 20_000 });
  const configQuery = trpc.agent.getConfig.useQuery();
  const conversationsQuery = trpc.conversations.list.useQuery(undefined, { refetchInterval: 10_000 });
  const appointmentsQuery = trpc.appointments.list.useQuery(undefined, { refetchInterval: 20_000 });
  const whatsappQuery = trpc.whatsapp.getConfig.useQuery();
  const utils = trpc.useUtils();

  const refreshAll = () => {
    void utils.dashboard.getOverview.invalidate();
    void utils.agent.getConfig.invalidate();
    void utils.conversations.list.invalidate();
    void utils.appointments.list.invalidate();
    void utils.whatsapp.getConfig.invalidate();
  };

  if (overview.isLoading || configQuery.isLoading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="size-7 text-primary animate-spin" /></div>;
  }

  if (!overview.data?.config || !configQuery.data) {
    return <div className="min-h-screen grid place-items-center p-6 text-center"><div><Bot className="mx-auto mb-4 size-10 text-primary" /><h1 className="font-bold text-xl">Não foi possível iniciar o agente piloto.</h1><p className="mt-2 text-muted-foreground">Atualize a página para tentar novamente.</p></div></div>;
  }

  const { config, metrics } = overview.data;
  const agentConfig = configQuery.data;

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <aside className="fixed inset-y-0 left-0 hidden w-[258px] border-r border-[#e2ebe5] bg-white p-5 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2 pb-8 pt-1">
          <img src={logoUrl} alt="CECRETAR.IA" className="h-10 w-[168px] rounded object-cover object-center" />
        </div>
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5">
          <div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-primary text-white"><Bot className="size-4" /></span><p className="text-xs font-semibold text-emerald-950">Piloto ativo</p></div>
          <p className="mt-2 text-sm font-semibold text-emerald-950">Duconde Empresarial</p>
          <p className="mt-0.5 text-xs text-emerald-800">Locação de salas comerciais</p>
        </div>
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = section === item.id;
            return <button key={item.id} onClick={() => setSection(item.id)} className={cn("flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all", active ? "bg-[#e5f3eb] text-[#075a38] shadow-[inset_0_0_0_1px_rgba(0,107,67,0.08)]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}><Icon className={cn("size-[18px]", active && "text-primary")} />{item.label}</button>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#123829] p-4 text-white">
          <Sparkles className="mb-3 size-5 text-[#8fe0ae]" />
          <p className="text-sm font-semibold">Motor de IA plugável</p>
          <p className="mt-1 text-xs leading-5 text-emerald-100/80">Teste com IA embutida hoje. Troque para OpenAI quando quiser.</p>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#e2ebe5] bg-white/90 px-5 backdrop-blur lg:px-9">
          <div className="flex items-center gap-3 lg:hidden"><img src={logoUrl} alt="CECRETAR.IA" className="h-8 w-32 rounded object-cover object-center" /><Button size="icon" variant="ghost" onClick={() => toast.info("Use a versão desktop para acessar todos os módulos.")}><MoreHorizontal className="size-5" /></Button></div>
          <div className="hidden lg:block"><p className="text-sm text-muted-foreground">Duconde Empresarial Boutique</p><h1 className="font-[Manrope] text-xl font-extrabold tracking-tight">{navItems.find(item => item.id === section)?.label}</h1></div>
          <div className="flex items-center gap-3"><Button variant="outline" className="hidden sm:flex border-[#dce8e0] bg-white" onClick={() => setSection("simulador")}><PlayCircle className="mr-2 size-4 text-primary" />Testar agente</Button><Avatar className="size-9 border border-emerald-100"><AvatarFallback className="bg-emerald-50 text-xs font-bold text-emerald-800">CG</AvatarFallback></Avatar></div>
        </header>
        <div className="mx-auto max-w-[1480px] p-5 lg:p-9">
          {section === "visao" && <OverviewPage metrics={metrics} conversations={overview.data.conversations} appointments={overview.data.appointments} onNavigate={setSection} />}
          {section === "agente" && <AgentPage config={agentConfig} onSaved={refreshAll} />}
          {section === "simulador" && <SimulatorPage config={agentConfig} onRefresh={refreshAll} />}
          {section === "conversas" && <InboxPage conversations={conversationsQuery.data ?? []} config={agentConfig} onRefresh={refreshAll} />}
          {section === "midia" && <MediaPage config={agentConfig} onRefresh={refreshAll} />}
          {section === "canal" && <WhatsAppChannelPage />}
          {section === "agenda" && <AgendaPage config={agentConfig} appointments={appointmentsQuery.data ?? []} onRefresh={refreshAll} />}
          {section === "metricas" && <MetricsPage metrics={metrics} />}
        </div>
      </main>
    </div>
  );
}

function WhatsAppChannelPage() {
  const channelQuery = trpc.whatsapp.getConfig.useQuery();
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ displayPhoneNumber: "", phoneNumberId: "", wabaId: "" });
  const save = trpc.whatsapp.saveDraft.useMutation({
    onSuccess: () => {
      toast.success("Canal de teste salvo. Nenhum número foi ativado.");
      void utils.whatsapp.getConfig.invalidate();
    },
  });

  useEffect(() => {
    const channel = channelQuery.data?.channel;
    if (channel) setForm({ displayPhoneNumber: channel.displayPhoneNumber ?? "", phoneNumberId: channel.phoneNumberId ?? "", wabaId: channel.wabaId ?? "" });
  }, [channelQuery.data]);

  if (channelQuery.isLoading) return <div className="grid min-h-80 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  const data = channelQuery.data!;
  const channel = data.channel;
  const state = channel?.status ?? "draft";
  const statusLabel = state === "connected" ? "Conectado" : state === "ready" ? "Pronto para ativar" : state === "error" ? "Revisar configuração" : "Rascunho";

  return <div className="grid gap-6 xl:grid-cols-[1fr_340px] enter-up">
    <section className="space-y-6">
      <div className="rounded-[26px] bg-[#113b2b] p-7 text-white">
        <Badge className="border-0 bg-white/10 text-emerald-100">Cloud API direta da Meta</Badge>
        <h2 className="mt-3 font-[Manrope] text-3xl font-extrabold tracking-tight">Seu canal WhatsApp, sem intermediários.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75">A CECRETAR.IA receberá e responderá mensagens diretamente pela Cloud API. O GPT Maker, gateways pagos e o número principal do Duconde ficam fora deste piloto.</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold"><span className={cn("size-1.5 rounded-full", state === "connected" ? "bg-[#7de3a7]" : "bg-amber-300")} />{statusLabel}</div>
      </div>
      <section className="rounded-2xl border border-[#e3ece6] bg-white p-6">
        <div><p className="text-sm font-bold">Dados do número de teste</p><p className="mt-1 text-sm text-muted-foreground">Preencha somente depois que o aplicativo Meta da CECRETAR.IA estiver criado. Salvar estes dados não ativa nem registra um número.</p></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Número exibido"><Input value={form.displayPhoneNumber} placeholder="Ex.: +55 81 99999-9999" onChange={e => setForm(current => ({ ...current, displayPhoneNumber: e.target.value }))} /></Field>
          <Field label="Phone Number ID da Meta"><Input value={form.phoneNumberId} placeholder="Gerado pela Meta" onChange={e => setForm(current => ({ ...current, phoneNumberId: e.target.value }))} /></Field>
          <Field label="WABA ID" className="md:col-span-2"><Input value={form.wabaId} placeholder="Conta WhatsApp Business gerada pela Meta" onChange={e => setForm(current => ({ ...current, wabaId: e.target.value }))} /></Field>
        </div>
        <div className="mt-6 flex justify-end"><Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Salvar rascunho do canal</Button></div>
      </section>
      <section className="rounded-2xl border border-[#e3ece6] bg-white p-6">
        <p className="text-sm font-bold">Roteiro de ativação futura</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">{[{ n: "01", t: "Criar o aplicativo Meta", d: "Aplicativo exclusivo da CECRETAR.IA com o produto WhatsApp." }, { n: "02", t: "Registrar o número de teste", d: "Usar o número Meta de teste ou o seu número separado." }, { n: "03", t: "Adicionar o Webhook", d: `Apontar a Meta para ${data.webhookPath}.` }].map(item => <div key={item.n} className="rounded-xl bg-[#f5f9f6] p-4"><span className="text-xs font-extrabold text-primary">{item.n}</span><p className="mt-3 text-sm font-bold">{item.t}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.d}</p></div>)}</div>
      </section>
    </section>
    <aside className="space-y-5">
      <section className="rounded-2xl border border-[#e3ece6] bg-white p-5"><p className="text-sm font-bold">Prontidão técnica</p><div className="mt-4 space-y-3">{[{ label: "Webhook preparado", ok: true }, { label: "Adaptador de mensagens", ok: true }, { label: "Token de acesso da Meta", ok: data.hasToken }, { label: "Token de verificação", ok: data.hasVerifyToken }, { label: "Segredo do aplicativo", ok: data.hasAppSecret }].map(item => <div key={item.label} className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{item.label}</span>{item.ok ? <CheckCircle2 className="size-4 text-primary" /> : <Clock3 className="size-4 text-amber-500" />}</div>)}</div></section>
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><PhoneCall className="size-5 text-primary" /><p className="mt-3 text-sm font-bold text-emerald-950">O que acontecerá no teste real</p><p className="mt-2 text-xs leading-5 text-emerald-800">Uma mensagem enviada ao número de teste chegará pelo Webhook, entrará na caixa de entrada da CECRETAR.IA e receberá a mesma lógica usada no simulador.</p></section>
    </aside>
  </div>;
}

function OverviewPage({ metrics, conversations, appointments, onNavigate }: { metrics: { conversations: number; qualified: number; appointments: number; humanHandoffs: number }; conversations: any[]; appointments: any[]; onNavigate: (section: Section) => void }) {
  const cards = [
    { label: "Conversas recebidas", value: metrics.conversations, icon: MessageCircleMore, detail: "Em todos os canais", tone: "bg-[#e5f3eb] text-[#007e45]" },
    { label: "Leads qualificados", value: metrics.qualified, icon: UserRoundCheck, detail: "Dados essenciais capturados", tone: "bg-[#e8f1fe] text-[#2563b7]" },
    { label: "Visitas agendadas", value: metrics.appointments, icon: CalendarDays, detail: "Agenda do Duconde", tone: "bg-[#fff3df] text-[#bd730f]" },
    { label: "Transferências", value: metrics.humanHandoffs, icon: UsersRound, detail: "Atendimento humano", tone: "bg-[#f3ecff] text-[#7942bb]" },
  ];
  return <div className="space-y-7 enter-up">
    <section className="overflow-hidden rounded-[26px] bg-[#113b2b] p-6 text-white lg:p-8">
      <div className="grid items-end gap-7 lg:grid-cols-[1fr_300px]"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100"><span className="size-1.5 rounded-full bg-[#7de3a7]" />Agente em modo de teste</div><h2 className="mt-4 max-w-2xl font-[Manrope] text-3xl font-extrabold tracking-tight lg:text-4xl">Sua nova operação de atendimento já tem um centro de comando.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/75">Configure a CECRETAR.IA, simule conversas reais e valide cada etapa antes de conectar o WhatsApp do Duconde.</p><div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => onNavigate("simulador")} className="bg-[#76d99b] text-[#0e3425] hover:bg-[#9be9b7]"><PlayCircle className="mr-2 size-4" />Abrir simulador</Button><Button onClick={() => onNavigate("agente")} variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"><Settings2 className="mr-2 size-4" />Configurar agente</Button></div></div><div className="rounded-2xl border border-white/10 bg-black/10 p-5"><div className="flex items-center justify-between"><span className="text-xs font-medium text-emerald-100">Status do piloto</span><CheckCircle2 className="size-5 text-[#7de3a7]" /></div><p className="mt-4 text-2xl font-bold">Pronto para testar</p><p className="mt-2 text-xs leading-5 text-emerald-50/65">Modo atual: IA embutida. Troca para OpenAI disponível na configuração do agente.</p></div></div>
    </section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => { const Icon = card.icon; return <div key={card.label} className="rounded-2xl border border-[#e3ece6] bg-white p-5 shadow-[0_8px_30px_rgba(22,65,45,0.04)]"><div className="flex items-start justify-between"><div className={cn("grid size-10 place-items-center rounded-xl", card.tone)}><Icon className="size-5" /></div><ArrowUpRight className="size-4 text-slate-300" /></div><p className="mt-5 text-3xl font-[Manrope] font-extrabold tracking-tight">{card.value}</p><p className="mt-1 text-sm font-semibold">{card.label}</p><p className="mt-1 text-xs text-muted-foreground">{card.detail}</p></div>; })}</section>
    <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><div className="rounded-2xl border border-[#e3ece6] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">Conversas recentes</p><p className="mt-1 text-xs text-muted-foreground">Acompanhe o que está sendo validado no simulador.</p></div><Button variant="ghost" size="sm" onClick={() => onNavigate("conversas")}>Ver caixa <ChevronRight className="ml-1 size-4" /></Button></div><div className="mt-4 divide-y divide-[#edf2ee]">{conversations.length ? conversations.map((conversation: any) => <div key={conversation.id} className="flex items-center gap-3 py-3"><Avatar className="size-9"><AvatarFallback className="bg-slate-100 text-xs text-slate-600">{conversation.contactName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{conversation.contactName}</p><p className="text-xs text-muted-foreground">{conversation.channel === "simulator" ? "Simulador interno" : conversation.channel}</p></div><StatusPill status={conversation.status} /></div>) : <EmptyState icon={MessageCircleMore} text="Ainda não há conversas. Abra o simulador para iniciar o primeiro teste." />}</div></div><div className="rounded-2xl border border-[#e3ece6] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">Próximas visitas</p><p className="mt-1 text-xs text-muted-foreground">Compromissos do piloto.</p></div><Button variant="ghost" size="sm" onClick={() => onNavigate("agenda")}>Agenda <ChevronRight className="ml-1 size-4" /></Button></div><div className="mt-4 divide-y divide-[#edf2ee]">{appointments.length ? appointments.map((appointment: any) => <div key={appointment.id} className="flex gap-3 py-3"><div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-primary"><CalendarDays className="size-4" /></div><div className="flex-1"><p className="text-sm font-semibold">{appointment.visitorName}</p><p className="text-xs text-muted-foreground">{formatDate(appointment.scheduledFor)}</p></div></div>) : <EmptyState icon={CalendarDays} text="Nenhuma visita agendada ainda." />}</div></div></section>
  </div>;
}

function AgentPage({ config, onSaved }: { config: any; onSaved: () => void }) {
  const [form, setForm] = useState(() => ({ ...config.agent }));
  const [fields, setFields] = useState<any[]>(config.qualificationFields);
  const save = trpc.agent.updateConfig.useMutation({ onSuccess: () => { toast.success("Configurações do agente salvas."); onSaved(); }, onError: error => toast.error(error.message) });
  const saveFields = trpc.agent.updateQualification.useMutation({ onSuccess: () => { toast.success("Perguntas de qualificação atualizadas."); onSaved(); } });
  useEffect(() => { setForm({ ...config.agent }); setFields(config.qualificationFields); }, [config]);
  const change = (key: string, value: string) => setForm((current: any) => ({ ...current, [key]: value }));
  const submit = () => save.mutate({ agentId: form.id, name: form.name, persona: form.persona, companyInfo: form.companyInfo, services: form.services, pricing: form.pricing, businessHours: form.businessHours, transferKeyword: form.transferKeyword, provider: form.provider, modelPreference: form.modelPreference });
  return <div className="grid gap-6 xl:grid-cols-[1fr_360px] enter-up"><div className="space-y-6"><section className="rounded-2xl border border-[#e3ece6] bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold">Identidade do agente</p><p className="mt-1 text-sm text-muted-foreground">Defina como a CECRETAR.IA representa o Duconde no atendimento.</p></div><Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Piloto configurável</Badge></div><div className="mt-6 grid gap-5 md:grid-cols-2"><Field label="Nome do agente"><Input value={form.name} onChange={e => change("name", e.target.value)} /></Field><Field label="Palavra para falar com humano"><Input value={form.transferKeyword} onChange={e => change("transferKeyword", e.target.value)} /></Field><Field label="Horários de visita" className="md:col-span-2"><Input value={form.businessHours} onChange={e => change("businessHours", e.target.value)} /></Field><Field label="Personalidade e regras" className="md:col-span-2"><Textarea className="min-h-28" value={form.persona} onChange={e => change("persona", e.target.value)} /></Field><Field label="Informações da empresa" className="md:col-span-2"><Textarea className="min-h-32" value={form.companyInfo} onChange={e => change("companyInfo", e.target.value)} /></Field><Field label="Produtos e serviços"><Textarea className="min-h-28" value={form.services} onChange={e => change("services", e.target.value)} /></Field><Field label="Preços e condições"><Textarea className="min-h-28" value={form.pricing} onChange={e => change("pricing", e.target.value)} /></Field></div><div className="mt-6 flex justify-end"><Button onClick={submit} disabled={save.isPending}>{save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Salvar alterações</Button></div></section>
    <section className="rounded-2xl border border-[#e3ece6] bg-white p-6"><div><p className="text-sm font-bold">Qualificação de leads</p><p className="mt-1 text-sm text-muted-foreground">Ative ou personalize as perguntas que ajudam o agente a priorizar oportunidades.</p></div><div className="mt-5 space-y-3">{fields.map((field: any, index: number) => <div key={field.key} className="rounded-xl border border-[#e8eee9] p-4"><div className="flex gap-3"><div className="mt-1 text-xs font-bold text-muted-foreground">0{index + 1}</div><div className="min-w-0 flex-1"><Input className="h-8 border-0 bg-transparent px-0 font-semibold shadow-none focus-visible:ring-0" value={field.label} onChange={e => setFields(current => current.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, label: e.target.value } : item))} /><Input className="mt-1 h-8 border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0" value={field.prompt} onChange={e => setFields(current => current.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, prompt: e.target.value } : item))} /></div><div className="flex items-center gap-2"><Label className="text-xs text-muted-foreground">Obrigatório</Label><Switch checked={field.required} onCheckedChange={checked => setFields(current => current.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, required: checked } : item))} /></div></div></div>)}</div><div className="mt-5 flex justify-end"><Button variant="outline" onClick={() => saveFields.mutate({ agentId: form.id, fields: fields.map(({ key, label, prompt, required }: any) => ({ key, label, prompt, required })) })}>Salvar perguntas</Button></div></section></div>
    <aside className="space-y-6"><section className="rounded-2xl bg-[#113b2b] p-6 text-white"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-white/10"><Sparkles className="size-5 text-[#8fe0ae]" /></span><Badge className="border-0 bg-white/10 text-emerald-100">Plugável</Badge></div><p className="mt-5 font-[Manrope] text-xl font-extrabold">Motor de IA</p><p className="mt-2 text-sm leading-6 text-emerald-50/70">O comportamento, as informações e os fluxos permanecem os mesmos quando você trocar de provedor.</p><div className="mt-5 space-y-3"><Label className="text-emerald-100">Provedor ativo</Label><Select value={form.provider} onValueChange={value => change("provider", value)}><SelectTrigger className="border-white/15 bg-white/10 text-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="embedded">LLM embutido — teste</SelectItem><SelectItem value="openai">OpenAI — preparado</SelectItem></SelectContent></Select><Label className="text-emerald-100">Preferência de modelo</Label><Input className="border-white/15 bg-white/10 text-white placeholder:text-emerald-100/50" value={form.modelPreference} onChange={e => change("modelPreference", e.target.value)} /></div></section><section className="rounded-2xl border border-[#e3ece6] bg-white p-5"><p className="text-sm font-bold">O que o agente já respeita</p><ul className="mt-4 space-y-3 text-sm text-muted-foreground"><li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 text-primary" />Não inventa disponibilidade ou condições.</li><li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 text-primary" />Transfere o histórico para uma pessoa.</li><li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 text-primary" />Usa regras para dados críticos.</li></ul></section></aside></div>;
}

function SimulatorPage({ config, onRefresh }: { config: any; onRefresh: () => void }) {
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: `Olá! Eu sou a **CECRETAR.IA**, assistente do Duconde Empresarial Boutique. Posso te ajudar com salas, valores, localização ou visita. A qualquer momento, escreva **${config.agent.transferKeyword}** para falar com uma pessoa.` }]);
  const send = trpc.conversations.send.useMutation({ onSuccess: result => { setConversationId(result.conversationId); setMessages(current => [...current, { role: "assistant", content: result.reply }]); if (result.transferToHuman) toast.info("Transferência para humano acionada."); onRefresh(); }, onError: error => toast.error(error.message) });
  const handleSend = (text: string) => { setMessages(current => [...current, { role: "user", content: text }]); send.mutate({ conversationId, text, contactName: "Contato de teste" }); };
  const reset = () => { setConversationId(undefined); setMessages([{ role: "assistant", content: `Olá! Eu sou a **CECRETAR.IA**, assistente do Duconde Empresarial Boutique. Como posso te ajudar?` }]); };
  return <div className="grid gap-6 xl:grid-cols-[1fr_320px] enter-up"><section className="overflow-hidden rounded-2xl border border-[#e3ece6] bg-white"><div className="flex items-center justify-between border-b border-[#edf2ee] px-5 py-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-primary"><Bot className="size-5" /></div><div><p className="text-sm font-bold">Simulador do agente</p><p className="text-xs text-muted-foreground">Canal de teste interno · Duconde Empresarial</p></div></div><Button variant="ghost" size="sm" onClick={reset}>Nova conversa</Button></div><AIChatBox messages={messages} onSendMessage={handleSend} isLoading={send.isPending} height="610px" placeholder="Escreva como um interessado responderia..." suggestedPrompts={["Quanto custa uma sala para 4 pessoas?", "Quero visitar o espaço na sexta-feira", "Onde fica o Duconde?", `Quero falar com ${config.agent.transferKeyword}`]} /></section><aside className="space-y-5"><section className="rounded-2xl border border-[#e3ece6] bg-white p-5"><p className="text-sm font-bold">Cenários de teste</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Valide os comportamentos essenciais antes de conectar o WhatsApp.</p><div className="mt-4 space-y-2">{[{ icon: MessageCircleMore, label: "Preço e capacidade", text: "Quanto custa uma sala para 4 pessoas?" }, { icon: ImageIcon, label: "Envio de mídia", text: "Quero ver fotos das salas" }, { icon: CalendarDays, label: "Agendamento", text: "Quero agendar uma visita" }, { icon: UsersRound, label: "Humano", text: `Quero falar com ${config.agent.transferKeyword}` }].map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => handleSend(item.text)} className="flex w-full items-center gap-3 rounded-xl border border-[#edf2ee] p-3 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50"><span className="grid size-8 place-items-center rounded-lg bg-slate-50 text-primary"><Icon className="size-4" /></span><span className="text-xs font-semibold">{item.label}</span></button>; })}</div></section><section className="rounded-2xl border border-[#e3ece6] bg-white p-5"><p className="text-sm font-bold">Checklist do piloto</p><div className="mt-4 space-y-3 text-sm">{["Tom de voz natural", "Valores corretos", "Transferência humana", "Qualificação configurável", "Pronto para agendar"].map((item, index) => <div key={item} className="flex items-center gap-3"><span className={cn("grid size-5 place-items-center rounded-full text-[10px] font-bold", index < 4 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>{index < 4 ? "✓" : index + 1}</span><span className="text-xs text-muted-foreground">{item}</span></div>)}</div></section></aside></div>;
}

function InboxPage({ conversations, config, onRefresh }: { conversations: any[]; config: any; onRefresh: () => void }) {
  const [selectedId, setSelectedId] = useState<number | undefined>();
  useEffect(() => { if (!selectedId && conversations[0]) setSelectedId(conversations[0].id); }, [conversations, selectedId]);
  const selected = conversations.find(item => item.id === selectedId);
  const messagesQuery = trpc.conversations.messages.useQuery({ conversationId: selectedId ?? 0 }, { enabled: Boolean(selectedId) });
  const takeOver = trpc.conversations.takeOver.useMutation({ onSuccess: () => { toast.success("Conversa direcionada para atendimento humano."); onRefresh(); void messagesQuery.refetch(); } });
  return <div className="grid h-[calc(100vh-152px)] min-h-[620px] overflow-hidden rounded-2xl border border-[#e3ece6] bg-white xl:grid-cols-[330px_1fr] enter-up"><section className="border-b border-[#edf2ee] xl:border-b-0 xl:border-r"><div className="border-b border-[#edf2ee] p-4"><div className="flex items-center justify-between"><p className="text-sm font-bold">Caixa de entrada</p><Badge variant="secondary">{conversations.length}</Badge></div><div className="relative mt-3"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="h-9 pl-9" placeholder="Buscar conversa" /></div></div><div className="max-h-[600px] overflow-y-auto">{conversations.length ? conversations.map(conversation => <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={cn("w-full border-b border-[#f0f4f1] px-4 py-4 text-left transition-colors", selectedId === conversation.id ? "bg-emerald-50" : "hover:bg-slate-50")}><div className="flex gap-3"><Avatar className="size-9"><AvatarFallback className="bg-slate-100 text-xs">{conversation.contactName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold">{conversation.contactName}</p><span className="text-[10px] text-muted-foreground">{formatDate(conversation.updatedAt).split(" ")[1]}</span></div><p className="mt-1 text-xs text-muted-foreground">{conversation.channel === "simulator" ? "Simulador interno" : conversation.channel}</p><div className="mt-2"><StatusPill status={conversation.status} /></div></div></div></button>) : <div className="p-6"><EmptyState icon={Inbox} text="As conversas do simulador aparecerão aqui." /></div>}</div></section><section className="flex min-h-0 flex-col">{selected ? <><div className="flex items-center justify-between border-b border-[#edf2ee] px-5 py-4"><div className="flex items-center gap-3"><Avatar><AvatarFallback className="bg-emerald-50 text-primary">{selected.contactName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div><p className="text-sm font-bold">{selected.contactName}</p><p className="text-xs text-muted-foreground">{selected.channel === "simulator" ? "Contato de teste" : selected.channel}</p></div></div><div className="flex items-center gap-2"><StatusPill status={selected.status} />{selected.status !== "human" && <Button size="sm" variant="outline" onClick={() => takeOver.mutate({ conversationId: selected.id })}><UsersRound className="mr-2 size-4" />Assumir</Button>}</div></div><div className="flex-1 space-y-4 overflow-y-auto bg-[#fbfdfc] p-5">{messagesQuery.data?.map((message: any) => <div key={message.id} className={cn("flex", message.role === "lead" ? "justify-end" : "justify-start")}><div className={cn("max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6", message.role === "lead" ? "bg-primary text-white" : message.role === "system" ? "bg-amber-50 text-amber-800" : "border border-[#e7efe9] bg-white text-slate-700")}><p>{message.body}</p>{message.mediaIntent && <div className="mt-2 flex items-center gap-2 rounded-lg bg-black/5 px-2.5 py-1.5 text-xs"><Paperclip className="size-3" />Mídia vinculada: {message.mediaIntent}</div>}</div></div>)}</div><div className="border-t border-[#edf2ee] p-4"><div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3"><span className="text-xs text-emerald-800">Para continuar a conversa neste MVP, use o simulador.</span><Button size="sm" variant="ghost" className="text-primary" onClick={() => toast.info("A resposta manual será adicionada na integração do canal real.")}>Responder</Button></div></div></> : <div className="grid flex-1 place-items-center"><EmptyState icon={Inbox} text="Selecione uma conversa para acompanhar o histórico." /></div>}</section></div>;
}

function MediaPage({ config, onRefresh }: { config: any; onRefresh: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [intent, setIntent] = useState("fotos_salas");
  const [stage, setStage] = useState("Apresentação");
  const upload = trpc.media.upload.useMutation({ onSuccess: () => { toast.success("Mídia adicionada à biblioteca."); onRefresh(); }, onError: error => toast.error(error.message) });
  const handleFile = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => { const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : "document"; upload.mutate({ agentId: config.agent.id, filename: file.name, kind, intent, flowStage: stage, description: `Associado ao fluxo ${stage}`, dataUrl: String(reader.result) }); }; reader.readAsDataURL(file); };
  const typeIcon = { image: ImageIcon, audio: Volume2, video: Video, document: FileText };
  return <div className="space-y-6 enter-up"><section className="grid gap-6 rounded-2xl bg-[#113b2b] p-6 text-white lg:grid-cols-[1fr_auto]"><div><Badge className="border-0 bg-white/10 text-emerald-100">Conteúdo com contexto</Badge><h2 className="mt-3 font-[Manrope] text-2xl font-extrabold">Envie a mídia certa no momento certo.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/70">Associe cada foto, áudio, vídeo ou documento a uma intenção. O agente só recomenda o conteúdo quando a conversa indicar aquele contexto.</p></div><Button className="self-center bg-[#76d99b] text-[#0e3425] hover:bg-[#9be9b7]" onClick={() => fileRef.current?.click()}><UploadCloud className="mr-2 size-4" />Enviar mídia</Button><input ref={fileRef} className="hidden" type="file" accept="image/*,audio/*,video/*,.pdf,.doc,.docx" onChange={event => handleFile(event.target.files?.[0])} /></section><section className="grid gap-6 xl:grid-cols-[300px_1fr]"><aside className="rounded-2xl border border-[#e3ece6] bg-white p-5"><p className="text-sm font-bold">Contexto do upload</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Defina antes de carregar para que o agente saiba usar o arquivo.</p><div className="mt-5 space-y-4"><Field label="Intenção"><Input value={intent} onChange={e => setIntent(e.target.value)} placeholder="Ex.: fotos_salas" /></Field><Field label="Etapa do fluxo"><Select value={stage} onValueChange={setStage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Apresentação">Apresentação</SelectItem><SelectItem value="Qualificação">Qualificação</SelectItem><SelectItem value="Prova e estrutura">Prova e estrutura</SelectItem><SelectItem value="Agendamento">Agendamento</SelectItem></SelectContent></Select></Field><Button className="w-full" variant="outline" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>{upload.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadCloud className="mr-2 size-4" />}Selecionar arquivo</Button></div></aside><section className="rounded-2xl border border-[#e3ece6] bg-white"><div className="flex items-center justify-between border-b border-[#edf2ee] p-5"><div><p className="text-sm font-bold">Biblioteca do agente</p><p className="mt-1 text-xs text-muted-foreground">Mídias do Duconde organizadas por intenção.</p></div><Badge variant="secondary">{config.mediaAssets.length} arquivos</Badge></div>{config.mediaAssets.length ? <div className="divide-y divide-[#edf2ee]">{config.mediaAssets.map((asset: any) => { const Icon = typeIcon[asset.kind as keyof typeof typeIcon]; return <div key={asset.id} className="flex items-center gap-4 p-4"><div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-primary"><Icon className="size-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{asset.filename}</p><p className="mt-1 text-xs text-muted-foreground">Intenção: {asset.intent} · {asset.flowStage}</p></div><Badge variant="outline" className="capitalize">{asset.kind}</Badge></div>; })}</div> : <div className="p-12"><EmptyState icon={Paperclip} text="Sua biblioteca está pronta para receber fotos, áudios, vídeos e documentos do Duconde." /></div>}</section></section></div>;
}

function AgendaPage({ config, appointments, onRefresh }: { config: any; appointments: any[]; onRefresh: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateTime, setDateTime] = useState("");
  const create = trpc.appointments.create.useMutation({ onSuccess: () => { toast.success("Visita cadastrada na agenda do piloto."); setName(""); setPhone(""); setDateTime(""); onRefresh(); }, onError: error => toast.error(error.message) });
  const reschedule = trpc.appointments.reschedule.useMutation({ onSuccess: () => { toast.success("Visita remarcada."); onRefresh(); } });
  const cancel = trpc.appointments.cancel.useMutation({ onSuccess: () => { toast.success("Visita cancelada."); onRefresh(); } });
  const createAppointment = () => { if (!name || !dateTime) { toast.error("Informe o nome e a data da visita."); return; } create.mutate({ agentId: config.agent.id, visitorName: name, visitorPhone: phone || undefined, scheduledFor: new Date(dateTime).getTime() }); };
  const changeDate = (appointment: any) => { const value = window.prompt("Novo horário (AAAA-MM-DDTHH:mm)"); if (!value) return; const timestamp = new Date(value).getTime(); if (Number.isNaN(timestamp)) return toast.error("Data inválida."); reschedule.mutate({ appointmentId: appointment.id, scheduledFor: timestamp }); };
  return <div className="grid gap-6 xl:grid-cols-[360px_1fr] enter-up"><aside className="space-y-6"><section className="rounded-2xl border border-[#e3ece6] bg-white p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-primary"><CalendarDays className="size-5" /></span><div><p className="text-sm font-bold">Nova visita</p><p className="text-xs text-muted-foreground">Cadastre um teste de agenda.</p></div></div><div className="mt-6 space-y-4"><Field label="Nome do visitante"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Ana Silva" /></Field><Field label="WhatsApp"><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(81) 99999-9999" /></Field><Field label="Data e horário"><Input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} /></Field><Button className="w-full" onClick={createAppointment} disabled={create.isPending}>{create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Criar visita</Button></div></section><section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><div className="flex items-center justify-between"><div className="grid size-9 place-items-center rounded-xl bg-white text-primary"><CalendarDays className="size-4" /></div><Badge className="bg-white text-emerald-700 hover:bg-white">Experiência do cliente</Badge></div><p className="mt-4 text-sm font-bold text-emerald-950">Conexão com Google Calendar</p><p className="mt-2 text-xs leading-5 text-emerald-800">Cada empresa conecta a própria conta Google no painel, escolhe o calendário de visitas e autoriza somente o acesso necessário. Nenhum cliente informa chaves técnicas à CECRETAR.IA.</p><Button variant="outline" className="mt-4 w-full border-emerald-200 bg-white text-emerald-800 hover:bg-white" onClick={() => toast.info("No piloto, a jornada de conexão está desenhada. A autorização real será ativada quando o aplicativo OAuth da CECRETAR.IA for registrado no Google Cloud.")}>Ver fluxo de conexão</Button></section></aside><section className="rounded-2xl border border-[#e3ece6] bg-white"><div className="flex items-center justify-between border-b border-[#edf2ee] p-5"><div><p className="text-sm font-bold">Agenda de visitas</p><p className="mt-1 text-xs text-muted-foreground">Crie, remarque ou cancele os compromissos do piloto.</p></div><Badge variant="secondary">{appointments.filter(item => item.status !== "canceled").length} ativas</Badge></div><div className="divide-y divide-[#edf2ee]">{appointments.length ? appointments.map(appointment => <div key={appointment.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><div className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-primary"><CalendarDays className="size-5" /></div><div className="flex-1"><p className="text-sm font-semibold">{appointment.visitorName}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(appointment.scheduledFor)} · {appointment.visitorPhone || "Telefone não informado"}</p></div><div className="flex items-center gap-2"><Badge variant="outline" className={appointment.status === "canceled" ? "border-slate-200 text-slate-500" : "border-emerald-100 text-emerald-700"}>{appointment.status === "scheduled" ? "Agendada" : appointment.status === "rescheduled" ? "Remarcada" : "Cancelada"}</Badge>{appointment.status !== "canceled" && <><Button size="sm" variant="ghost" onClick={() => changeDate(appointment)}>Remarcar</Button><Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => cancel.mutate({ appointmentId: appointment.id })}>Cancelar</Button></>}</div></div>) : <div className="p-16"><EmptyState icon={CalendarDays} text="Nenhuma visita cadastrada. Crie a primeira para testar o ciclo completo." /></div>}</div></section></div>;
}

function MetricsPage({ metrics }: { metrics: { conversations: number; qualified: number; appointments: number; humanHandoffs: number } }) {
  const qualifiedRate = metrics.conversations ? Math.round((metrics.qualified / metrics.conversations) * 100) : 0;
  const appointmentRate = metrics.qualified ? Math.round((metrics.appointments / metrics.qualified) * 100) : 0;
  return <div className="space-y-6 enter-up"><section className="rounded-2xl border border-[#e3ece6] bg-white p-6"><p className="text-sm font-bold">Leitura do piloto</p><p className="mt-1 text-sm text-muted-foreground">Acompanhe se o agente está qualificando interessados e encaminhando as próximas ações.</p><div className="mt-6 grid gap-4 md:grid-cols-3"><MetricProgress label="Conversas → qualificação" value={qualifiedRate} caption={`${metrics.qualified} lead(s) qualificado(s)`} /><MetricProgress label="Qualificação → visita" value={appointmentRate} caption={`${metrics.appointments} visita(s) agendada(s)`} /><MetricProgress label="Necessidade de humano" value={metrics.conversations ? Math.round((metrics.humanHandoffs / metrics.conversations) * 100) : 0} caption={`${metrics.humanHandoffs} transferência(s)`} /></div></section><section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{[{ label: "Conversas", value: metrics.conversations, icon: MessageCircleMore }, { label: "Qualificados", value: metrics.qualified, icon: UserRoundCheck }, { label: "Agendamentos", value: metrics.appointments, icon: CalendarDays }, { label: "Atendimentos humanos", value: metrics.humanHandoffs, icon: UsersRound }].map(item => { const Icon = item.icon; return <div key={item.label} className="rounded-2xl border border-[#e3ece6] bg-white p-5"><Icon className="size-5 text-primary" /><p className="mt-6 text-3xl font-[Manrope] font-extrabold">{item.value}</p><p className="mt-1 text-sm text-muted-foreground">{item.label}</p></div>; })}</section><section className="rounded-2xl bg-[#eff7f1] p-6"><div className="flex items-start gap-4"><div className="grid size-10 place-items-center rounded-xl bg-white text-primary"><BarChart3 className="size-5" /></div><div><p className="text-sm font-bold text-emerald-950">Próximo aprendizado recomendado</p><p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-900/70">Use o simulador para testar perguntas sobre preço, fotos, endereço, visita e transferência humana. Depois, compare as respostas com o atendimento atual antes de conectar o canal real.</p></div></div></section></div>;
}

function MetricProgress({ label, value, caption }: { label: string; value: number; caption: string }) { return <div className="rounded-xl border border-[#edf2ee] p-4"><div className="flex justify-between gap-3"><p className="text-xs font-semibold">{label}</p><p className="text-xs font-bold text-primary">{value}%</p></div><Progress value={value} className="mt-3 h-2" /><p className="mt-2 text-xs text-muted-foreground">{caption}</p></div>; }
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) { return <div className={className}><Label className="text-xs font-semibold text-slate-600">{label}</Label><div className="mt-2">{children}</div></div>; }
function EmptyState({ icon: Icon, text }: { icon: typeof Inbox; text: string }) { return <div className="grid place-items-center gap-3 py-8 text-center"><span className="grid size-10 place-items-center rounded-xl bg-slate-50 text-slate-400"><Icon className="size-5" /></span><p className="max-w-xs text-xs leading-5 text-muted-foreground">{text}</p></div>; }
