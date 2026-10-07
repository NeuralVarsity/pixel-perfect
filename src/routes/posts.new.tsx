import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Check, Sparkles, Cloud } from "lucide-react";
import { toast } from "sonner";
import { authors, blog, categories, type Status } from "@/lib/blog-store";
import { BlockEditor, blocksToMarkdown, markdownToBlocks, newBlock, type Block } from "@/components/BlockEditor";
import { AiAssistant } from "@/components/AiAssistant";
import { FeaturedImage, type ImageMeta } from "@/components/FeaturedImage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/posts/new")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Write a Post — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Compose, optimize and publish a new NeuralVarsity.ai blog post." },
      { property: "og:title", content: "Write a Post — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Compose, optimize and publish a new NeuralVarsity.ai blog post." },
    ],
  }),
  component: Editor,
});

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Editor() {
  const { id } = Route.useSearch();
  const existing = id ? blog.get(id) : undefined;
  const nav = useNavigate();
  const [f, setF] = useState({
    title: existing?.title ?? "", slug: existing?.slug ?? "", metaTitle: existing?.metaTitle ?? "",
    metaDescription: existing?.metaDescription ?? "", keyword: existing?.keyword ?? "",
    category: existing?.category ?? categories[0]!, author: existing?.author ?? authors[0]!,
    tags: existing?.tags.join(", ") ?? "", schedule: "",
  });
  const [blocks, setBlocks] = useState<Block[]>(() => markdownToBlocks(existing?.content ?? ""));
  const [image, setImage] = useState<ImageMeta>({ src: existing?.image ?? null, alt: "", caption: "" });
  const [aiOpen, setAiOpen] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const draftKey = `nv-draft-${existing?.id ?? "new"}`;
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v, ...(k === "title" && !existing ? { slug: slugify(v) } : {}) }));

  const content = useMemo(() => blocksToMarkdown(blocks), [blocks]);
  const plain = content.replace(/[#>*`!\[\]()]/g, "");
  const words = plain.split(/\s+/).filter(Boolean).length;
  const chars = plain.replace(/\s/g, "").length;

  // restore autosaved draft
  useEffect(() => {
    const raw = localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      setF((p) => ({ ...p, ...d.f })); setBlocks(d.blocks); toast("Restored your autosaved draft");
    } catch { /* ignore */ }
  }, [draftKey]);
  // autosave
  useEffect(() => {
    const t = setTimeout(() => {
      if (!f.title && words === 0) return;
      localStorage.setItem(draftKey, JSON.stringify({ f, blocks }));
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 1200);
    return () => clearTimeout(t);
  }, [f, blocks, draftKey, words]);

  const checks = [
    { ok: f.title.length >= 20 && f.title.length <= 70, l: "Title is 20–70 characters" },
    { ok: f.metaDescription.length >= 120 && f.metaDescription.length <= 160, l: "Meta description 120–160 chars" },
    { ok: !!f.keyword && f.title.toLowerCase().includes(f.keyword.toLowerCase()), l: "Focus keyword in title" },
    { ok: words >= 300, l: "Content has 300+ words" },
    { ok: !!image.src, l: "Featured image set" },
    { ok: !!image.src && !!image.alt, l: "Image has alt text" },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  const insertAi = (text: string) => {
    const metaLike = text.length < 200 && !text.includes("\n");
    setBlocks((b) => [...b.filter((x) => x.text || x.type !== "p"), ...markdownToBlocks(text), ...(metaLike ? [] : [newBlock()])]);
    toast.success("Inserted into post");
  };

  const save = (status: Status) => {
    if (!f.title.trim()) { toast.error("Add a title first"); return; }
    const today = new Date().toISOString().slice(0, 10);
    blog.upsert({
      id: existing?.id ?? String(Date.now()), title: f.title, slug: f.slug || slugify(f.title),
      image: image.src ?? "", author: f.author, category: f.category,
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean), status, views: existing?.views ?? 0,
      published: status === "Scheduled" ? f.schedule || today : today, updated: today,
      content, metaTitle: f.metaTitle, metaDescription: f.metaDescription, keyword: f.keyword,
    });
    localStorage.removeItem(draftKey);
    toast.success(status === "Published" ? "Published!" : status === "Scheduled" ? "Scheduled" : status === "Review" ? "Sent for review" : "Draft saved");
    nav({ to: "/posts" });
  };

  return (
    <>
      <div className="glass sticky top-16 z-[5] -mx-4 -mt-8 mb-6 flex flex-wrap items-center gap-3 rounded-none border-x-0 border-t-0 px-4 py-3 md:-mx-8 md:px-8">
        <span className="text-xs text-muted-foreground tabular-nums">{words} words · {chars} chars · {Math.max(1, Math.round(words / 220))} min read</span>
        {savedAt && <span className="inline-flex items-center gap-1 text-xs text-success"><Cloud className="size-3" />Autosaved {savedAt}</span>}
        <div className="ml-auto flex gap-2">
          {!aiOpen && <button className="btn" onClick={() => setAiOpen(true)}><Sparkles className="size-4 text-primary" />AI</button>}
          <button className="btn" onClick={() => save("Draft")}>Save draft</button>
          <button className="btn hidden sm:inline-flex" onClick={() => save("Review")}>Send to review</button>
          <button className="btn-primary" onClick={() => save(f.schedule ? "Scheduled" : "Published")}>{f.schedule ? "Schedule" : "Publish"}</button>
        </div>
      </div>

      <div className={cn("grid gap-6", aiOpen ? "xl:grid-cols-[1fr_300px_360px] lg:grid-cols-[1fr_300px]" : "lg:grid-cols-[1fr_300px]")}>
        <article className="mx-auto w-full max-w-3xl pl-14">
          <textarea value={f.title} onChange={(e) => set("title", e.target.value)} rows={1} placeholder="Untitled story"
            className="w-full resize-none bg-transparent font-display text-4xl font-bold leading-tight outline-none placeholder:text-muted-foreground/40 md:text-5xl" />
          <div className="mb-8 mt-2 text-xs text-muted-foreground">neuralvarsity.ai/blog/<input value={f.slug} onChange={(e) => set("slug", slugify(e.target.value))} className="bg-transparent text-primary outline-none" placeholder="slug" /></div>
          <BlockEditor blocks={blocks} setBlocks={setBlocks} />

          <div className="glass mt-12 space-y-4 rounded-2xl p-6">
            <h2 className="font-semibold">SEO & meta</h2>
            <Field label={`Meta title (${f.metaTitle.length}/60)`}><input className="field" value={f.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} /></Field>
            <Field label={`Meta description (${f.metaDescription.length}/160)`}><textarea className="field min-h-20" value={f.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} /></Field>
            <Field label="Focus keyword"><input className="field" value={f.keyword} onChange={(e) => set("keyword", e.target.value)} /></Field>
            <div className="rounded-xl border bg-background p-4">
              <div className="text-xs text-muted-foreground">neuralvarsity.ai › blog › {f.slug || "your-post"}</div>
              <div className="mt-1 font-medium text-primary">{f.metaTitle || f.title || "Your post title"}</div>
              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{f.metaDescription || "Your meta description will appear here in search results."}</div>
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <div className="glass rounded-2xl p-5"><h2 className="mb-3 font-semibold">Featured image</h2><FeaturedImage value={image} onChange={setImage} title={f.title} /></div>
          <div className="glass space-y-4 rounded-2xl p-5">
            <h2 className="font-semibold">Publishing</h2>
            <Field label="Category"><select className="field" value={f.category} onChange={(e) => set("category", e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Author"><select className="field" value={f.author} onChange={(e) => set("author", e.target.value)}>{authors.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Tags (comma separated)"><input className="field" value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="llm, career" /></Field>
            <Field label="Schedule for (optional)"><input type="date" className="field" value={f.schedule} onChange={(e) => set("schedule", e.target.value)} /></Field>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold">SEO score</h2><span className="text-brand font-display text-2xl font-bold">{score}</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="bg-brand h-full transition-all duration-500" style={{ width: `${score}%` }} /></div>
            <ul className="mt-4 space-y-2 text-sm">
              {checks.map((c) => <li key={c.l} className={cn("flex items-center gap-2", c.ok ? "text-foreground" : "text-muted-foreground")}><Check className={cn("size-4", c.ok ? "text-success" : "opacity-30")} />{c.l}</li>)}
            </ul>
          </div>
        </aside>

        {aiOpen && <div className="xl:sticky xl:top-36 xl:self-start lg:col-span-2 xl:col-span-1"><AiAssistant context={`Title: ${f.title}\nKeyword: ${f.keyword}\n\n${content}`} onInsert={insertAi} onClose={() => setAiOpen(false)} /></div>}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>;
}
