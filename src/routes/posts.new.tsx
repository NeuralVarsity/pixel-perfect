import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Bold, Heading2, Italic, Link2, List, Quote, Code, ImagePlus, X, Check } from "lucide-react";
import { toast } from "sonner";
import { authors, blog, categories, type Status } from "@/lib/blog-store";
import { PageHeader } from "@/components/AppShell";
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
    content: existing?.content ?? "", category: existing?.category ?? categories[0]!,
    author: existing?.author ?? authors[0]!, tags: existing?.tags.join(", ") ?? "", schedule: "",
  });
  const [image, setImage] = useState<string | null>(existing?.image ?? null);
  const [drag, setDrag] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v, ...(k === "title" && !existing ? { slug: slugify(v) } : {}) }));

  const load = (file?: File) => {
    if (!file) return;
    if (!/image\/(jpeg|png|webp)/.test(file.type)) { toast.error("Use JPG, PNG or WEBP"); return; }
    const r = new FileReader(); r.onload = () => setImage(r.result as string); r.readAsDataURL(file);
  };
  const wrap = (a: string, b = a) => set("content", f.content + a + "text" + b);

  const checks = [
    { ok: f.title.length >= 20 && f.title.length <= 70, l: "Title is 20–70 characters" },
    { ok: f.metaDescription.length >= 120 && f.metaDescription.length <= 160, l: "Meta description is 120–160 characters" },
    { ok: !!f.keyword && f.title.toLowerCase().includes(f.keyword.toLowerCase()), l: "Focus keyword in title" },
    { ok: f.content.split(/\s+/).filter(Boolean).length >= 300, l: "Content has 300+ words" },
    { ok: !!image, l: "Featured image set" },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const words = f.content.split(/\s+/).filter(Boolean).length;

  const save = (status: Status) => {
    if (!f.title.trim()) { toast.error("Add a title first"); return; }
    const today = new Date().toISOString().slice(0, 10);
    blog.upsert({
      id: existing?.id ?? String(Date.now()), title: f.title, slug: f.slug || slugify(f.title),
      image: image ?? existing?.image ?? "", author: f.author, category: f.category,
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean), status, views: existing?.views ?? 0,
      published: status === "Scheduled" ? f.schedule || today : today, updated: today,
      content: f.content, metaTitle: f.metaTitle, metaDescription: f.metaDescription, keyword: f.keyword,
    });
    toast.success(status === "Published" ? "Published!" : status === "Scheduled" ? "Scheduled" : "Draft saved");
    nav({ to: "/posts" });
  };

  return (
    <>
      <PageHeader title={existing ? "Edit post" : "New post"} subtitle={`${words} words · ${Math.max(1, Math.round(words / 220))} min read`}
        action={<div className="flex gap-2"><button className="btn" onClick={() => save("Draft")}>Save draft</button><button className="btn-primary" onClick={() => save(f.schedule ? "Scheduled" : "Published")}>{f.schedule ? "Schedule" : "Publish"}</button></div>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Post title" className="w-full bg-transparent font-display text-3xl font-bold outline-none placeholder:text-muted-foreground/50" />
            <div className="mt-2 text-xs text-muted-foreground">neuralvarsity.ai/blog/<input value={f.slug} onChange={(e) => set("slug", slugify(e.target.value))} className="bg-transparent text-primary outline-none" placeholder="slug" /></div>
            <div className="mt-6 flex flex-wrap gap-1 border-b pb-2">
              {[[Heading2, "## ", ""], [Bold, "**"], [Italic, "_"], [Quote, "> ", ""], [List, "- ", ""], [Code, "`"], [Link2, "[", "](url)"]].map(([I, a, b], i) => {
                const Icon = I as typeof Bold;
                return <button key={i} onClick={() => wrap(a as string, b as string | undefined)} className="grid size-8 place-items-center rounded-md hover:bg-muted"><Icon className="size-4" /></button>;
              })}
            </div>
            <textarea value={f.content} onChange={(e) => set("content", e.target.value)} placeholder="Start writing your story…" className="mt-4 min-h-[420px] w-full resize-y bg-transparent text-[15px] leading-7 outline-none" />
          </div>

          <div className="glass space-y-4 rounded-2xl p-6">
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
        </div>

        <aside className="space-y-6">
          <div className="glass rounded-2xl p-5">
            <h2 className="mb-3 font-semibold">Featured image</h2>
            {image ? (
              <div className="group relative overflow-hidden rounded-xl">
                <img src={image} alt="" className="aspect-video w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 opacity-0 transition-opacity group-hover:opacity-100">
                  <label className="btn cursor-pointer bg-background">Replace<input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => load(e.target.files?.[0])} /></label>
                  <button className="btn bg-background" onClick={() => setImage(null)}><X className="size-4" />Remove</button>
                </div>
              </div>
            ) : (
              <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files[0]); }}
                className={cn("flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-colors", drag && "border-primary bg-primary/5")}>
                <ImagePlus className="size-6 text-primary" />Drop an image or click to upload<span className="text-xs">JPG, PNG, WEBP</span>
                <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => load(e.target.files?.[0])} />
              </label>
            )}
          </div>

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
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>;
}
