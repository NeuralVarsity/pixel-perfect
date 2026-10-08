import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Send, Copy, Plus, X, ChevronDown, PenLine, Wand2, Search, Share2 } from "lucide-react";
import { toast } from "sonner";
import { askAi } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

const groups = [
  { title: "Content Generation", icon: PenLine, actions: [["Generate Blog", "Generate Full Blog"], ["Generate Outline", "Generate Blog Outline"], ["Generate Introduction"], ["Generate Conclusion"]] },
  { title: "Content Improvement", icon: Wand2, actions: [["Rewrite", "Rewrite Content"], ["Expand", "Expand Content"], ["Improve Grammar"], ["Improve Readability"]] },
  { title: "SEO Tools", icon: Search, actions: [["Meta Title", "Generate Meta Title"], ["Meta Description", "Generate Meta Description"], ["SEO Suggestions"], ["Keyword Suggestions"]] },
  { title: "Social Media", icon: Share2, actions: [["LinkedIn Post"], ["Instagram Caption", "Instagram Captions"], ["Social Caption", "Social Media Captions"]] },
] as const;

type Msg = { role: "user" | "ai"; text: string };

export function AiAssistant({ context, onInsert, onClose }: { context: string; onInsert: (t: string) => void; onClose: () => void }) {
  const ask = useServerFn(askAi);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>("Content Generation");

  const run = async (task: string) => {
    if (!task.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", text: task }]);
    setInput(""); setBusy(true);
    try {
      const r = await ask({ data: { task, context } });
      if (r.error) toast.error(r.error);
      else setMsgs((m) => [...m, { role: "ai", text: r.text }]);
    } catch { toast.error("AI request failed. Check your connection and try again."); }
    setBusy(false);
  };

  return (
    <div className="glass flex h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-2xl animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 font-semibold"><span className="bg-brand grid size-7 place-items-center rounded-lg text-accent-foreground"><Sparkles className="size-4" /></span>AI Assistant</div>
        <button onClick={onClose} aria-label="Close assistant" className="rounded-md p-1.5 transition-colors hover:bg-muted"><X className="size-4" /></button>
      </div>

      <div className="border-b">
        {groups.map((g) => {
          const isOpen = open === g.title;
          const Icon = g.icon;
          return (
            <div key={g.title} className="border-b last:border-0">
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : g.title)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/50">
                <Icon className="size-4 text-primary" />{g.title}
                <ChevronDown className={cn("ml-auto size-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
              </button>
              <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <div className="grid grid-cols-2 gap-1.5 px-4 pb-3">
                    {g.actions.map((a) => (
                      <button key={a[0]} type="button" disabled={busy} onClick={() => run(a[1] ?? a[0])}
                        className="rounded-lg border bg-background/40 px-2.5 py-1.5 text-left text-xs transition-all hover:-translate-y-px hover:border-primary/60 hover:text-primary disabled:opacity-50">
                        {a[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {msgs.length === 0 && !busy && <p className="pt-6 text-center text-xs leading-5 text-muted-foreground">Pick an action above, or ask anything about this post below.</p>}
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
        {busy && <div className="flex gap-1 p-3" aria-label="Thinking"><span className="size-2 animate-bounce rounded-full bg-primary" /><span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" /><span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" /></div>}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); run(input); }} className="flex gap-2 border-t p-3">
        <input className="field" aria-label="Ask the AI assistant" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about this post…" />
        <button className="btn-primary px-3" disabled={busy} aria-label="Send"><Send className="size-4" /></button>
      </form>
    </div>
  );
}
