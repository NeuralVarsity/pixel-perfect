import { useEffect, useRef, useState } from "react";
import {
  GripVertical, Image, Video, Table, Quote, Code, HelpCircle, Megaphone, Info, Link2, MousePointerClick,
  Heading2, Heading3, Pilcrow, Trash2, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BlockType = "p" | "h2" | "h3" | "image" | "video" | "table" | "quote" | "code" | "faq" | "cta" | "callout" | "embed" | "button";
export type Block = { id: string; type: BlockType; text: string; extra?: string };

const commands: { type: BlockType; label: string; icon: typeof Image; hint: string }[] = [
  { type: "p", label: "Text", icon: Pilcrow, hint: "Plain paragraph" },
  { type: "h2", label: "Heading", icon: Heading2, hint: "Section heading" },
  { type: "h3", label: "Subheading", icon: Heading3, hint: "Smaller heading" },
  { type: "image", label: "Image", icon: Image, hint: "Embed an image by URL" },
  { type: "video", label: "Video", icon: Video, hint: "YouTube embed" },
  { type: "table", label: "Table", icon: Table, hint: "Comma-separated rows" },
  { type: "quote", label: "Quote", icon: Quote, hint: "Pull quote" },
  { type: "code", label: "Code", icon: Code, hint: "Highlighted code" },
  { type: "faq", label: "FAQ", icon: HelpCircle, hint: "Question & answer" },
  { type: "cta", label: "CTA", icon: Megaphone, hint: "Call to action box" },
  { type: "callout", label: "Callout", icon: Info, hint: "Highlighted note" },
  { type: "embed", label: "Embed", icon: Link2, hint: "Any URL" },
  { type: "button", label: "Button", icon: MousePointerClick, hint: "Link button" },
];

const uid = () => Math.random().toString(36).slice(2, 9);
export const newBlock = (type: BlockType = "p", text = ""): Block => ({ id: uid(), type, text });

export function blocksToMarkdown(blocks: Block[]) {
  return blocks.map((b) => {
    switch (b.type) {
      case "h2": return `## ${b.text}`;
      case "h3": return `### ${b.text}`;
      case "quote": return `> ${b.text}`;
      case "code": return "```\n" + b.text + "\n```";
      case "image": return `![${b.extra ?? ""}](${b.text})`;
      case "faq": return `**Q: ${b.text}**\n${b.extra ?? ""}`;
      default: return b.text;
    }
  }).join("\n\n");
}
export function markdownToBlocks(md: string): Block[] {
  if (!md.trim()) return [newBlock()];
  return md.split(/\n{2,}/).map((chunk) => {
    if (chunk.startsWith("### ")) return newBlock("h3", chunk.slice(4));
    if (chunk.startsWith("## ")) return newBlock("h2", chunk.slice(3));
    if (chunk.startsWith("# ")) return newBlock("h2", chunk.slice(2));
    if (chunk.startsWith("> ")) return newBlock("quote", chunk.slice(2));
    if (chunk.startsWith("```")) return newBlock("code", chunk.replace(/^```\w*\n?|```$/g, ""));
    return newBlock("p", chunk);
  });
}

const KW = /\b(const|let|var|function|return|if|else|for|while|import|from|export|class|def|async|await|new|true|false|null|None|print)\b/g;
function highlight(code: string) {
  const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return esc
    .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-success">$1</span>')
    .replace(/(\/\/.*|#.*)$/gm, '<span class="text-muted-foreground">$1</span>')
    .replace(KW, '<span class="text-primary font-semibold">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-accent">$1</span>');
}
const ytId = (u: string) => u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)?.[1];

function AutoText({ value, onChange, className, placeholder, onKeyDown, autoFocus }: { value: string; onChange: (v: string) => void; className?: string; placeholder?: string; onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>; autoFocus?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }, [value]);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  return <textarea ref={ref} rows={1} value={value} placeholder={placeholder} onKeyDown={onKeyDown} onChange={(e) => onChange(e.target.value)} className={cn("w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-muted-foreground/40", className)} />;
}

export function BlockEditor({ blocks, setBlocks }: { blocks: Block[]; setBlocks: (b: Block[]) => void }) {
  const [menu, setMenu] = useState<{ id: string; q: string; i: number } | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Block>) => setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const insertAfter = (id: string, b: Block) => { const i = blocks.findIndex((x) => x.id === id); const n = [...blocks]; n.splice(i + 1, 0, b); setBlocks(n); setFocus(b.id); };
  const remove = (id: string) => { if (blocks.length > 1) setBlocks(blocks.filter((b) => b.id !== id)); };
  const filtered = menu ? commands.filter((c) => c.label.toLowerCase().includes(menu.q.toLowerCase())) : [];
  const apply = (id: string, type: BlockType) => { update(id, { type, text: "" }); setMenu(null); setFocus(id); };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = blocks.findIndex((b) => b.id === dragId), to = blocks.findIndex((b) => b.id === targetId);
    const n = [...blocks]; const [m] = n.splice(from, 1); n.splice(to, 0, m!); setBlocks(n);
    setDragId(null); setOverId(null);
  };

  const textKeys = (b: Block) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (menu?.id === b.id) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMenu({ ...menu, i: (menu.i + 1) % Math.max(1, filtered.length) }); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMenu({ ...menu, i: (menu.i - 1 + filtered.length) % Math.max(1, filtered.length) }); return; }
      if (e.key === "Enter") { e.preventDefault(); const c = filtered[menu.i]; if (c) apply(b.id, c.type); return; }
      if (e.key === "Escape") { setMenu(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey && b.type !== "code" && b.type !== "table") { e.preventDefault(); insertAfter(b.id, newBlock()); }
    if (e.key === "Backspace" && !b.text && blocks.length > 1) { e.preventDefault(); const i = blocks.findIndex((x) => x.id === b.id); remove(b.id); setFocus(blocks[Math.max(0, i - 1)]?.id ?? null); }
  };
  const onText = (b: Block) => (v: string) => {
    update(b.id, { text: v });
    if (v.startsWith("/") && !v.includes(" ") && (b.type === "p")) setMenu({ id: b.id, q: v.slice(1), i: 0 });
    else if (menu?.id === b.id) setMenu(null);
  };

  const render = (b: Block) => {
    const common = { value: b.text, onChange: onText(b), onKeyDown: textKeys(b), autoFocus: focus === b.id };
    switch (b.type) {
      case "h2": return <AutoText {...common} placeholder="Heading" className="font-display pt-6 text-[1.75rem] font-bold leading-tight tracking-tight" />;
      case "h3": return <AutoText {...common} placeholder="Subheading" className="font-display pt-3 text-[1.35rem] font-semibold leading-snug" />;
      case "quote": return <div className="my-2 border-l-4 border-primary pl-5"><AutoText {...common} placeholder="Quote…" className="font-display text-xl italic leading-relaxed" /></div>;
      case "callout": return <div className="flex gap-3 rounded-xl bg-primary/10 p-4"><Info className="mt-1 size-5 shrink-0 text-primary" /><AutoText {...common} placeholder="Callout note…" /></div>;
      case "cta": return <div className="bg-brand rounded-xl p-5 text-accent-foreground"><AutoText {...common} placeholder="Ready to start learning AI? Join NeuralVarsity…" className="font-display text-lg font-bold placeholder:text-accent-foreground/60" /></div>;
      case "button": return <div className="flex flex-wrap items-center gap-2"><span className="btn-primary"><AutoText {...common} placeholder="Button label" className="w-40 font-bold placeholder:text-accent-foreground/60" /></span><input className="field max-w-xs" placeholder="https://link" value={b.extra ?? ""} onChange={(e) => update(b.id, { extra: e.target.value })} /></div>;
      case "faq": return <div className="rounded-xl border p-4"><AutoText {...common} placeholder="Question?" className="font-semibold" /><AutoText value={b.extra ?? ""} onChange={(v) => update(b.id, { extra: v })} placeholder="Answer…" className="mt-2 text-muted-foreground" /></div>;
      case "code": return (
        <div className="overflow-hidden rounded-xl border bg-muted">
          <AutoText {...common} placeholder="// paste code" className="p-4 font-mono text-sm" />
          {b.text && <pre className="border-t p-4 font-mono text-sm leading-6" dangerouslySetInnerHTML={{ __html: highlight(b.text) }} />}
        </div>);
      case "table": {
        const rows = b.text.split("\n").filter(Boolean).map((r) => r.split(","));
        return (
          <div className="space-y-2">
            <AutoText {...common} placeholder={"Header 1, Header 2\nValue, Value"} className="field font-mono text-xs" />
            {rows.length > 0 && <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm">{rows.map((r, i) => <tr key={i} className={cn("border-b last:border-0", i === 0 && "bg-muted font-semibold")}>{r.map((c, j) => <td key={j} className="px-3 py-2">{c.trim()}</td>)}</tr>)}</table></div>}
          </div>);
      }
      case "image": return (
        <div className="space-y-2">
          {!b.text && <input className="field" placeholder="Paste image URL" onChange={(e) => update(b.id, { text: e.target.value })} />}
          {b.text && <img src={b.text} alt={b.extra ?? ""} className="w-full rounded-xl" />}
          <input className="field text-xs" placeholder="Alt text / caption" value={b.extra ?? ""} onChange={(e) => update(b.id, { extra: e.target.value })} />
        </div>);
      case "video": case "embed": {
        const id = ytId(b.text);
        return (
          <div className="space-y-2">
            <input className="field" placeholder={b.type === "video" ? "YouTube URL" : "Embed URL"} value={b.text} onChange={(e) => update(b.id, { text: e.target.value })} />
            {id ? <iframe className="aspect-video w-full rounded-xl" src={`https://www.youtube.com/embed/${id}`} title="Video" allowFullScreen />
              : b.text && b.type === "embed" ? <a href={b.text} target="_blank" rel="noreferrer" className="block rounded-xl border p-4 text-sm text-primary">{b.text}</a> : null}
          </div>);
      }
      default: return <AutoText {...common} placeholder="Type '/' for commands, or start writing…" className="text-[18px] leading-[1.85] text-foreground/90" />;
    }
  };

  return (
    <div className="space-y-2">
      {blocks.map((b) => (
        <div key={b.id} draggable={dragId === b.id} onDragOver={(e) => { e.preventDefault(); setOverId(b.id); }} onDrop={() => onDrop(b.id)} onDragEnd={() => { setDragId(null); setOverId(null); }}
          className={cn("group relative -ml-14 flex gap-1 rounded-lg py-1 pl-14 transition-colors", overId === b.id && dragId && "bg-primary/5", dragId === b.id && "opacity-40")}>
          <div className="absolute left-0 top-1.5 flex opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={() => insertAfter(b.id, newBlock())} className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted" aria-label="Add block"><Plus className="size-4" /></button>
            <span onMouseDown={() => setDragId(b.id)} onMouseUp={() => setDragId(null)} className="grid size-6 cursor-grab place-items-center rounded text-muted-foreground hover:bg-muted" aria-label="Drag to reorder"><GripVertical className="size-4" /></span>
          </div>
          <div className="relative min-w-0 flex-1">
            {render(b)}
            {menu?.id === b.id && filtered.length > 0 && (
              <div className="glass absolute left-0 top-full z-30 mt-1 max-h-80 w-72 overflow-y-auto rounded-xl bg-popover p-1.5 animate-in fade-in zoom-in-95">
                {filtered.map((c, i) => (
                  <button key={c.type} onMouseDown={(e) => { e.preventDefault(); apply(b.id, c.type); }} className={cn("flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left", i === menu.i && "bg-muted")}>
                    <span className="grid size-8 place-items-center rounded-md border bg-background"><c.icon className="size-4" /></span>
                    <span><span className="block text-sm font-medium">{c.label}</span><span className="block text-xs text-muted-foreground">{c.hint}</span></span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {b.type !== "p" && <button onClick={() => remove(b.id)} className="self-start p-1 text-muted-foreground opacity-0 group-hover:opacity-100" aria-label="Delete block"><Trash2 className="size-4" /></button>}
        </div>
      ))}
    </div>
  );
}
