import { useEffect, useState } from "react";
import { AudioLines, CheckCircle2, Clock3, Loader2, Play, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const chirpVoices = [
  ["pt-BR-Chirp3-HD-Aoede", "Aoede · feminina, acolhedora"],
  ["pt-BR-Chirp3-HD-Kore", "Kore · feminina, segura"],
  ["pt-BR-Chirp3-HD-Charon", "Charon · masculina, serena"],
  ["pt-BR-Chirp3-HD-Orus", "Orus · masculina, objetiva"],
] as const;

export function VoiceSettingsPage({ agentId, agentName }: { agentId: number; agentName: string }) {
  const query = trpc.voice.getConfig.useQuery({ agentId });
  const [form, setForm] = useState<any>();
  const [previewText, setPreviewText] = useState(`Olá! Sou ${agentName}. Como posso ajudar você hoje?`);
  const [audioUrl, setAudioUrl] = useState("");
  useEffect(() => { if (query.data?.profile) setForm(query.data.profile); }, [query.data]);
  const save = trpc.voice.save.useMutation({ onSuccess: async () => { toast.success("Configuração de voz salva."); await query.refetch(); } });
  const preview = trpc.voice.preview.useMutation({ onSuccess: result => { setAudioUrl(result.dataUrl); toast.success("Prévia gerada."); }, onError: error => toast.error(error.message) });
  if (query.isLoading || !form) return <div className="grid min-h-72 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  const readiness = query.data?.readiness;
  const status = (ok?: boolean) => ok ? <CheckCircle2 className="size-4 text-primary" /> : <Clock3 className="size-4 text-amber-500" />;
  return <div className="space-y-6 enter-up">
    <section className="rounded-[26px] bg-[#113b2b] p-6 text-white sm:p-7">
      <Badge className="border-0 bg-white/10 text-emerald-100">IA e voz por especialista</Badge>
      <h2 className="mt-3 font-[Manrope] text-2xl font-extrabold sm:text-3xl">Voz natural, com custo controlado.</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75">Google Chirp 3 HD é o padrão econômico. ElevenLabs fica disponível como qualidade Premium. O áudio recebido continua sendo compreendido pelo Whisper.</p>
    </section>
    <div className="grid gap-6 xl:grid-cols-[1fr_330px]">
      <section className="rounded-2xl border border-[#e3ece6] bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-primary"><AudioLines className="size-5" /></span><div><p className="text-sm font-bold">Voz de {agentName}</p><p className="text-xs text-muted-foreground">Escolha como o robô responde no WhatsApp.</p></div></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Provedor"><Select value={form.provider} onValueChange={provider => setForm({ ...form, provider })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="google_chirp">Google Chirp 3 HD · padrão</SelectItem><SelectItem value="elevenlabs">ElevenLabs · Premium</SelectItem><SelectItem value="disabled">Sem resposta em voz</SelectItem></SelectContent></Select></Field>
          <Field label="Regra de resposta"><Select value={form.replyMode} onValueChange={replyMode => setForm({ ...form, replyMode })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="automatic">Automática · áudio responde áudio</SelectItem><SelectItem value="text_only">Somente texto</SelectItem><SelectItem value="audio_only">Sempre em áudio</SelectItem></SelectContent></Select></Field>
          <Field label="Voz Google Chirp 3 HD"><Select value={form.googleVoice} onValueChange={googleVoice => setForm({ ...form, googleVoice })} disabled={form.provider !== "google_chirp"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{chirpVoices.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Voice ID ElevenLabs"><Input value={form.elevenLabsVoiceId ?? ""} disabled={form.provider !== "elevenlabs"} onChange={event => setForm({ ...form, elevenLabsVoiceId: event.target.value })} placeholder="Cole o Voice ID" /></Field>
          <Field label={`Velocidade · ${form.speechRatePercent}%`}><Input type="range" min={75} max={125} step={5} value={form.speechRatePercent} onChange={event => setForm({ ...form, speechRatePercent: Number(event.target.value) })} /></Field>
          <Field label="Limite por áudio"><Select value={String(form.maxAudioCharacters)} onValueChange={value => setForm({ ...form, maxAudioCharacters: Number(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="450">Curto · 450 caracteres</SelectItem><SelectItem value="900">Normal · 900 caracteres</SelectItem><SelectItem value="1200">Longo · 1.200 caracteres</SelectItem></SelectContent></Select></Field>
        </div>
        <div className="mt-6 flex justify-end"><Button onClick={() => save.mutate({ agentId, provider: form.provider, replyMode: form.replyMode, googleVoice: form.googleVoice, elevenLabsVoiceId: form.elevenLabsVoiceId || null, speechRatePercent: form.speechRatePercent, maxAudioCharacters: form.maxAudioCharacters })} disabled={save.isPending}>{save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Salvar voz</Button></div>
      </section>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-[#e3ece6] bg-white p-5"><p className="text-sm font-bold">Prontidão</p><div className="mt-4 space-y-3 text-xs">{[["Google Chirp 3 HD", readiness?.google], ["ElevenLabs Premium", readiness?.elevenLabs], ["Compreensão de áudio", readiness?.transcription]].map(([label, ok]) => <div key={String(label)} className="flex items-center justify-between gap-3"><span>{label}</span>{status(Boolean(ok))}</div>)}</div></div>
        <div className="rounded-2xl bg-emerald-50 p-5 text-xs leading-5 text-emerald-800"><Sparkles className="mb-2 size-5" />No modo automático, texto recebe texto e áudio recebe áudio. A empresa pode mudar essa regra a qualquer momento.</div>
      </aside>
    </div>
    <section className="rounded-2xl border border-[#e3ece6] bg-white p-5 sm:p-6"><p className="text-sm font-bold">Ouvir uma prévia</p><p className="mt-1 text-xs text-muted-foreground">O teste usa a configuração salva acima.</p><Textarea className="mt-4 min-h-24" value={previewText} onChange={event => setPreviewText(event.target.value)} maxLength={1200} /><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><Button variant="outline" onClick={() => preview.mutate({ agentId, text: previewText })} disabled={preview.isPending || form.provider === "disabled"}>{preview.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}Gerar prévia</Button>{audioUrl && <audio className="h-10 w-full max-w-lg" controls src={audioUrl} />}</div></section>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><Label className="text-xs font-semibold text-slate-600">{label}</Label><div className="mt-2">{children}</div></div>; }
