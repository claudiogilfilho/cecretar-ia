import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export type Message = {
  role: "assistant" | "user" | "system";
  content: string;
};

type AIChatBoxProps = {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  height?: string;
  placeholder?: string;
  suggestedPrompts?: string[];
  emptyStateMessage?: string;
};

export function AIChatBox({ messages, onSendMessage, isLoading = false, height = "560px", placeholder = "Escreva uma mensagem...", suggestedPrompts = [], emptyStateMessage = "Inicie uma conversa para testar o agente." }: AIChatBoxProps) {
  const [draft, setDraft] = useState("");
  const send = (value = draft) => {
    const clean = value.trim();
    if (!clean || isLoading) return;
    onSendMessage(clean);
    setDraft("");
  };

  return <div className="flex flex-col" style={{ height }}>
    <div className="flex-1 space-y-3 overflow-y-auto bg-[#fbfdfc] p-5">
      {messages.length === 0 && <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">{emptyStateMessage}</div>}
      {messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === "user" ? "flex justify-end" : message.role === "system" ? "flex justify-center" : "flex justify-start"}>
        <div className={message.role === "user" ? "max-w-[78%] rounded-2xl bg-primary px-4 py-3 text-sm leading-6 text-white" : message.role === "system" ? "rounded-full bg-amber-50 px-3 py-1.5 text-xs text-amber-800" : "max-w-[78%] whitespace-pre-line rounded-2xl border border-[#e7efe9] bg-white px-4 py-3 text-sm leading-6 text-slate-700"}>{message.content.replace(/\*\*/g, "")}</div>
      </div>)}
      {isLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin" />A CECRETAR.IA está respondendo...</div>}
    </div>
    {suggestedPrompts.length > 0 && <div className="flex gap-2 overflow-x-auto border-t border-[#edf2ee] bg-white px-4 py-3">{suggestedPrompts.map(prompt => <button key={prompt} onClick={() => send(prompt)} disabled={isLoading} className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50">{prompt}</button>)}</div>}
    <form className="flex gap-2 border-t border-[#edf2ee] bg-white p-4" onSubmit={event => { event.preventDefault(); send(); }}><Input value={draft} onChange={event => setDraft(event.target.value)} placeholder={placeholder} disabled={isLoading} /><Button type="submit" disabled={isLoading || !draft.trim()}>Enviar</Button></form>
  </div>;
}
