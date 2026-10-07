import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Send, Copy, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { askAi } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

const actions = [
  "Generate Full Blog", "Generate Blog Outline", "Generate Introduction", "Generate Conclusion",
  "Rewrite Content", "Expand Content", "Improve Grammar", "Improve Readability", "Generate FAQs",
  "Generate CTA", "Generate Meta Title", "Generate Meta Description", "SEO Suggestions",
  "Keyword Suggestions", "Internal Linking Suggestions", "Social Media Captions", "LinkedIn Post", "Instagram Captions",
];

type Msg = { role: "user" | "ai"; text: string };

export function AiAssistant({ context, onInsert, onClose }: { context: string; onInsert: (t: string) => void; onClose: () => void }) {
  const ask = useServerFn(askAi);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (task: string) => {
    if (!task.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", text: task }]);
    setInput(""); setBusy(true);
    try {
      const r = await ask({ data: { task, context } });
      if (r.error) toast.error(r.error);
      else setMsgs((m) => [...m, { role: "ai", text: r.text }]);
    } catch { toast.error("AI request failed"); }
    setBusy(false);
  };

  return (
    <div className="glass flex h-[calc(100vh-8rem)] flex-col rounded-2xl">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2 font-semibold"><span className="bg-brand grid size-7 place-items-center rounded-lg text-accent-foreground"><Sparkles className="size-4" /></span>AI Assistant</div>
        <button onClick={onClose} aria-label="Close assistant" className="rounded-md p-1 hover:bg-muted"><X className="size-4" /></button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {actions.map((a) => <button key={a} onClick={() => run(a)} className="rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-primary hover:text-primary">{a}</button>)}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={cn("rounded-xl p-3 text-sm animate-in fade-in slide-in-from-bottom-1", m.role === "user" ? "ml-8 bg-primary/10" : "bg-muted")}>
            <div className="whitespace-pre-wrap leading-6">{m.text}</div>
            {m.role === "ai" && (
              <div className="mt-2 flex gap-2">
                <button className="btn py-1 text-xs" onClick={() => onInsert(m.text)}><Plus className="size-3" />Insert</button>
                <button className="btn py-1 text-xs" onClick={() => { navigator.clipboard.writeText(m.text); toast.success("Copied"); }}><Copy className="size-3" />Copy</button>
              </div>
            )}
          </div>
        ))}
        {busy && <div className="flex gap-1 p-3"><span className="size-2 animate-bounce rounded-full bg-primary" /><span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" /><span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" /></div>}
      </div>
      {msgs.length > 0 && <div className="flex gap-1.5 overflow-x-auto border-t px-4 py-2">{actions.slice(4, 12).map((a) => <button key={a} onClick={() => run(a)} className="whitespace-nowrap rounded-full border px-2.5 py-1 text-xs hover:border-primary">{a}</button>)}</div>}
      <form onSubmit={(e) => { e.preventDefault(); run(input); }} className="flex gap-2 border-t p-3">
        <input className="field" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about this post…" />
        <button className="btn-primary px-3" disabled={busy} aria-label="Send"><Send className="size-4" /></button>
      </form>
    </div>
  );
}
