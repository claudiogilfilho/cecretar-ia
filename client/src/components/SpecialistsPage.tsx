import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Brain, Building2, Landmark, Loader2, Scale, Sun } from "lucide-react";
import { toast } from "sonner";

const templateIcons = {
  legal_office: Scale,
  solar_energy: Sun,
  psychology: Brain,
  precatarios: Landmark,
  real_estate_rental: Building2,
};

export function SpecialistsPage({ templates, agents, onChoose, onCreated }: { templates: any[]; agents: any[]; onChoose: (agentId: number) => void; onCreated: (agentId: number) => void }) {
  const create = trpc.agent.createFromTemplate.useMutation({
    onSuccess: result => { toast.success("Especialista criado. Agora personalize as informações do negócio."); onCreated(result.id); },
    onError: error => toast.error(error.message),
  });
  return <div className="space-y-7 enter-up">
    <section className="rounded-[26px] bg-[#113b2b] p-7 text-white"><Badge className="border-0 bg-white/10 text-emerald-100">Multiagente</Badge><h2 className="mt-3 max-w-3xl font-[Manrope] text-3xl font-extrabold tracking-tight">Uma CECRETAR.IA para cada especialidade do seu atendimento.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75">Escolha um modelo, personalize as informações do negócio e conecte seus canais apenas quando estiver satisfeito com os testes.</p></section>
    <section><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold">Modelos de especialistas</p><p className="mt-1 text-sm text-muted-foreground">Cada modelo já inicia com perguntas, limites de atuação e fluxo de agenda adequados ao segmento.</p></div><Badge variant="secondary">{templates.length} modelos</Badge></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{templates.map(template => { const Icon = templateIcons[template.key as keyof typeof templateIcons] ?? Building2; const exists = agents.some(agent => agent.templateKey === template.key); return <article key={template.key} className="flex min-h-60 flex-col rounded-2xl border border-[#e3ece6] bg-white p-5 shadow-[0_8px_30px_rgba(22,65,45,0.04)]"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-primary"><Icon className="size-5" /></span>{exists && <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Criado</Badge>}</div><h3 className="mt-5 text-base font-bold">{template.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{template.description}</p><p className="mt-4 text-xs text-muted-foreground">{template.qualificationCount} perguntas iniciais configuradas</p><Button className="mt-4 w-full" variant={exists ? "outline" : "default"} disabled={create.isPending} onClick={() => { const current = agents.find(agent => agent.templateKey === template.key); if (current) return onChoose(current.id); create.mutate({ templateKey: template.key }); }}>{create.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <span className={cn(exists ? "" : "")}>{exists ? "Configurar especialista" : "Criar especialista"}</span>}</Button></article>; })}</div></section>
    <section className="rounded-2xl border border-[#e3ece6] bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">Especialistas já configurados</p><p className="mt-1 text-xs text-muted-foreground">Cada agente possui regras, mídia, agenda e canais independentes.</p></div><Badge variant="secondary">{agents.length}</Badge></div><div className="mt-4 divide-y divide-[#edf2ee]">{agents.map(agent => <button key={agent.id} onClick={() => onChoose(agent.id)} className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-slate-50"><span className="grid size-9 place-items-center rounded-xl bg-slate-50 text-primary"><Building2 className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{agent.name}</span><span className="mt-1 block text-xs text-muted-foreground">{agent.templateKey.replaceAll("_", " ")} · {agent.isActive ? "ativo" : "pausado"}</span></span><span className="text-xs font-semibold text-primary">Configurar</span></button>)}</div></section>
  </div>;
}
