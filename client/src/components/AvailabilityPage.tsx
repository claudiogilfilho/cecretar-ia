import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { CalendarClock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export function AvailabilityPage({ agentId, agentName }: { agentId: number; agentName: string }) {
  const query = trpc.availability.list.useQuery({ agentId });
  const [slots, setSlots] = useState<any[]>([]);
  const save = trpc.availability.save.useMutation({ onSuccess: () => { toast.success("Horários disponíveis salvos."); void query.refetch(); }, onError: error => toast.error(error.message) });
  useEffect(() => { if (query.data) setSlots(query.data); }, [query.data]);
  const update = (weekday: number, key: string, value: string | boolean | number) => setSlots(rows => rows.map(row => row.weekday === weekday ? { ...row, [key]: value } : row));
  if (query.isLoading) return <div className="grid min-h-80 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  return <div className="grid gap-6 xl:grid-cols-[1fr_340px] enter-up"><section className="rounded-2xl border border-[#e3ece6] bg-white p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-primary"><CalendarClock className="size-5" /></span><div><p className="text-sm font-bold">Horários do especialista</p><p className="text-sm text-muted-foreground">Defina quando a {agentName} pode oferecer um agendamento.</p></div></div><div className="mt-6 divide-y divide-[#edf2ee]">{slots.map(slot => <div key={slot.weekday} className="grid gap-4 py-4 md:grid-cols-[160px_1fr_1fr_130px_auto] md:items-end"><div><Label className="text-xs text-muted-foreground">Dia</Label><p className="mt-2 text-sm font-semibold">{days[slot.weekday]}</p></div><div><Label className="text-xs text-muted-foreground">Início</Label><Input className="mt-2" type="time" value={slot.startTime} onChange={e => update(slot.weekday, "startTime", e.target.value)} disabled={!slot.isActive} /></div><div><Label className="text-xs text-muted-foreground">Fim</Label><Input className="mt-2" type="time" value={slot.endTime} onChange={e => update(slot.weekday, "endTime", e.target.value)} disabled={!slot.isActive} /></div><div><Label className="text-xs text-muted-foreground">Intervalo</Label><Select value={String(slot.slotMinutes)} onValueChange={value => update(slot.weekday, "slotMinutes", Number(value))}><SelectTrigger className="mt-2" disabled={!slot.isActive}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="15">15 min</SelectItem><SelectItem value="30">30 min</SelectItem><SelectItem value="45">45 min</SelectItem><SelectItem value="60">60 min</SelectItem></SelectContent></Select></div><label className="flex items-center gap-2 pb-2 text-xs font-medium"><Switch checked={slot.isActive} onCheckedChange={checked => update(slot.weekday, "isActive", checked)} />Ativo</label></div>)}</div><div className="mt-6 flex justify-end"><Button onClick={() => save.mutate({ agentId, slots })} disabled={save.isPending}>{save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Salvar horários</Button></div></section><aside className="rounded-2xl bg-emerald-50 p-5"><p className="text-sm font-bold text-emerald-950">Agenda e Google Calendar</p><p className="mt-2 text-xs leading-5 text-emerald-800">Estes horários são a primeira regra de disponibilidade. Ao conectar o Google Calendar, a CECRETAR.IA combinará essa regra com eventos já existentes para impedir conflitos e criar, remarcar ou cancelar visitas.</p></aside></div>;
}
