import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { validateMediaUpload } from "@/lib/mediaUploadValidation";
import { FileText, Image as ImageIcon, Loader2, Paperclip, UploadCloud, Video, Volume2 } from "lucide-react";
import { DragEvent, useRef, useState } from "react";
import { toast } from "sonner";

const iconByKind = { image: ImageIcon, audio: Volume2, video: Video, document: FileText };

export function MediaLibraryPage({ config, onRefresh }: { config: any; onRefresh: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [intent, setIntent] = useState("apresentacao");
  const [stage, setStage] = useState("Atendimento");
  const [usage, setUsage] = useState<"outbound" | "instruction">("outbound");
  const [description, setDescription] = useState("");
  const upload = trpc.media.upload.useMutation({ onSuccess: () => { toast.success("Arquivo salvo na biblioteca deste robô."); onRefresh(); }, onError: error => toast.error(error.message) });
  const uploadFile = (file?: File) => {
    if (!file) return;
    const validationError = validateMediaUpload(file, usage);
    if (validationError) return toast.error(validationError);
    const reader = new FileReader();
    reader.onload = () => {
      const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : "document";
      upload.mutate({ agentId: config.agent.id, filename: file.name, kind, usage, intent: usage === "instruction" ? "instrucoes_internas" : intent, flowStage: usage === "instruction" ? "Conhecimento interno" : stage, description: description || (usage === "instruction" ? "Instruções internas do robô" : "Mídia vinculada ao atendimento"), dataUrl: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };
  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); uploadFile(event.dataTransfer.files?.[0]); };
  return <div className="grid gap-6 xl:grid-cols-[330px_1fr] enter-up"><aside className="rounded-2xl border border-[#e3ece6] bg-white p-5"><p className="text-sm font-bold">Adicionar conteúdo</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Solte o arquivo ou escolha-o no seu dispositivo. Tudo fica isolado neste especialista.</p><div className="mt-5 space-y-4"><div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button onClick={() => setUsage("outbound")} className={`rounded-lg px-2 py-2 text-xs font-semibold ${usage === "outbound" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}>Para enviar</button><button onClick={() => setUsage("instruction")} className={`rounded-lg px-2 py-2 text-xs font-semibold ${usage === "instruction" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}>Instrução PDF</button></div>{usage === "outbound" ? <><Field label="Intenção"><Input value={intent} onChange={event => setIntent(event.target.value)} placeholder="Ex.: fotos_estrutura" /></Field><Field label="Etapa"><Input value={stage} onChange={event => setStage(event.target.value)} placeholder="Ex.: Apresentação" /></Field></> : <div className="rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">O PDF será extraído como conhecimento interno. Ele não será enviado ao interlocutor automaticamente.</div>}<Field label="Descrição"><Textarea value={description} onChange={event => setDescription(event.target.value)} className="min-h-20" placeholder="Opcional" /></Field><div onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop} onClick={() => inputRef.current?.click()} className={`grid min-h-36 cursor-pointer place-items-center rounded-xl border-2 border-dashed p-4 text-center transition ${dragging ? "border-primary bg-emerald-50" : "border-emerald-200 bg-[#fbfdfc] hover:bg-emerald-50"}`}><div><UploadCloud className="mx-auto size-6 text-primary" /><p className="mt-2 text-sm font-semibold">Arraste e solte aqui</p><p className="mt-1 text-xs text-muted-foreground">Imagem, áudio, vídeo, documento ou PDF · até 16 MB</p></div></div><input ref={inputRef} className="hidden" type="file" accept={usage === "instruction" ? ".pdf,application/pdf" : "image/*,audio/*,video/*,.pdf,.doc,.docx"} onChange={event => uploadFile(event.target.files?.[0])} /><Button className="w-full" variant="outline" disabled={upload.isPending} onClick={() => inputRef.current?.click()}>{upload.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Paperclip className="mr-2 size-4" />}Escolher arquivo</Button></div></aside><section className="rounded-2xl border border-[#e3ece6] bg-white"><div className="flex items-center justify-between border-b p-5"><div><p className="text-sm font-bold">Biblioteca de {config.agent.name}</p><p className="mt-1 text-xs text-muted-foreground">Arquivos enviados ao cliente e instruções privadas do robô.</p></div><Badge variant="secondary">{config.mediaAssets.length} arquivos</Badge></div>{config.mediaAssets.length ? <div className="divide-y divide-[#edf2ee]">{config.mediaAssets.map((asset: any) => { const Icon = iconByKind[asset.kind as keyof typeof iconByKind]; return <div key={asset.id} className="flex items-center gap-4 p-4"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-primary"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{asset.filename}</p><p className="mt-1 text-xs text-muted-foreground">{asset.usage === "instruction" ? "Instrução interna" : `${asset.intent} · ${asset.flowStage}`}</p></div><Badge variant="outline" className={asset.usage === "instruction" ? "border-violet-200 text-violet-700" : ""}>{asset.usage === "instruction" ? "Privado" : asset.kind}</Badge></div>; })}</div> : <div className="grid min-h-80 place-items-center p-8 text-center"><div><Paperclip className="mx-auto size-8 text-slate-300" /><p className="mt-3 text-sm text-muted-foreground">Solte o primeiro arquivo deste especialista aqui.</p></div></div>}</section></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><Label className="text-xs font-semibold text-slate-600">{label}</Label><div className="mt-2">{children}</div></div>; }
