import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Bot, Loader2, PauseCircle, PlayCircle, UserRoundCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ConversationControlPage({ config, rows, onRefresh }: { config: any; rows: any[]; onRefresh: () => void }) {
  const [selectedId, setSelectedId] = useState<number>();
  const [ownerCommandText, setOwnerCommandText] = useState(config.agent.ownerTakeoverCommand || "#assumir");
  const agentRows = rows.filter(row => row.agentId === config.agent.id);

  useEffect(() => {
    if (!agentRows.some(row => row.id === selectedId)) setSelectedId(agentRows[0]?.id);
  }, [config.agent.id, rows, selectedId]);

  const selected = agentRows.find(row => row.id === selectedId);
  const messages = trpc.conversations.messages.useQuery(
    { conversationId: selectedId ?? 0 },
    { enabled: Boolean(selectedId) },
  );
  const automation = trpc.conversations.setAutomation.useMutation({
    onSuccess: result => {
      toast.success(result.paused ? "Robô pausado nesta conversa." : "Robô retomado nesta conversa.");
      onRefresh();
      void messages.refetch();
    },
  });
  const ownerCommand = trpc.conversations.ownerCommand.useMutation({
    onSuccess: () => {
      toast.success("Atendimento assumido pelo proprietário.");
      onRefresh();
      void messages.refetch();
    },
    onError: error => toast.error(error.message),
  });

  return (
    <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-[#e3ece6] bg-white xl:grid-cols-[320px_1fr] enter-up">
      <section className="border-r">
        <div className="border-b p-4">
          <p className="text-sm font-bold">Conversas de {config.agent.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">Cada especialista possui seu próprio histórico.</p>
        </div>
        {agentRows.length ? agentRows.map(row => (
          <button key={row.id} onClick={() => setSelectedId(row.id)} className={`flex w-full gap-3 border-b p-4 text-left ${row.id === selectedId ? "bg-emerald-50" : "hover:bg-slate-50"}`}>
            <Avatar className="size-9"><AvatarFallback>{row.contactName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{row.contactName}</span>
              <span className="block text-xs text-muted-foreground">{row.channel}</span>
            </span>
            <Badge variant="secondary">{row.status === "human" ? "Humano" : "Robô"}</Badge>
          </button>
        )) : <div className="grid min-h-52 place-items-center p-5 text-center text-sm text-muted-foreground">Ainda não há conversas para este robô.</div>}
      </section>
      <section className="flex min-h-0 flex-col">
        {selected ? <>
          <div className="flex items-center justify-between gap-4 border-b p-5">
            <div>
              <p className="text-sm font-bold">{selected.contactName}</p>
              <p className="text-xs text-muted-foreground">{selected.channel} · {selected.automationPaused ? "automação pausada" : "automação ativa"}</p>
            </div>
            <Button variant={selected.automationPaused ? "default" : "outline"} onClick={() => automation.mutate({ conversationId: selected.id, paused: !selected.automationPaused })} disabled={automation.isPending}>
              {automation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : selected.automationPaused ? <PlayCircle className="mr-2 size-4" /> : <PauseCircle className="mr-2 size-4" />}
              {selected.automationPaused ? "Retomar robô" : "Pausar robô"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b bg-slate-50 px-5 py-3">
            <UserRoundCheck className="size-4 text-primary" />
            <Input value={ownerCommandText} onChange={event => setOwnerCommandText(event.target.value)} className="h-9 w-32 bg-white text-sm" aria-label="Comando do proprietário" />
            <Button size="sm" variant="outline" onClick={() => selected && ownerCommand.mutate({ conversationId: selected.id, text: ownerCommandText })} disabled={ownerCommand.isPending || !ownerCommandText.trim()}>
              {ownerCommand.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Assumir conversa
            </Button>
            <p className="text-xs text-muted-foreground">Somente o proprietário autorizado pode usar este comando.</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto bg-[#fbfdfc] p-5">
            {messages.data?.map((message: any) => (
              <div key={message.id} className={`flex ${message.role === "lead" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${message.role === "lead" ? "bg-primary text-white" : message.role === "system" ? "bg-amber-50 text-amber-900" : "border bg-white"}`}>
                  <p>{message.body}</p>
                  {message.mediaIntent && <p className="mt-2 text-xs opacity-70">Mídia vinculada: {message.mediaIntent}</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t bg-emerald-50 p-4 text-xs leading-5 text-emerald-800">
            <div className="flex gap-2"><UsersRound className="size-4 shrink-0" /><p>O cliente pode pedir uma pessoa com <strong>{config.agent.transferKeyword}</strong>. O criador também pode pausar ou retomar esta conversa a qualquer momento.</p></div>
          </div>
        </> : <div className="grid flex-1 place-items-center text-center"><div><Bot className="mx-auto size-8 text-slate-300" /><p className="mt-3 text-sm text-muted-foreground">Selecione uma conversa deste especialista.</p></div></div>}
      </section>
    </div>
  );
}
