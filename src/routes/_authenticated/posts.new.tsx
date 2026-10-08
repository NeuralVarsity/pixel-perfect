import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Check, Sparkles, Cloud, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { dataUrlToBlob, invalidate, toDb, uploadImage, useCategories, useMe, usePostsQuery, type Post, type Status } from "@/lib/blog-store";
import { BlockEditor, blocksToMarkdown, markdownToBlocks, newBlock, type Block } from "@/components/BlockEditor";
import { AiAssistant } from "@/components/AiAssistant";
import { FeaturedImage, type ImageMeta } from "@/components/FeaturedImage";
import { StatusBadge } from "@/components/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/posts/new")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Write a Post — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Compose, optimize and publish a new NeuralVarsity.ai blog post." },
      { property: "og:title", content: "Write a Post — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Compose, optimize and publish a new NeuralVarsity.ai blog post." },
    ],
  }),
  component: EditorPage,
});

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

function EditorPage() {
  const { id } = Route.useSearch();
  const { data, isLoading } = usePostsQuery();
  if (id && isLoading) return <div className="text-muted-foreground">Loading post…</div>;
  const existing = id ? data?.find((p) => p.id === id) : undefined;
  if (id && !existing) return <div className="text-muted-foreground">Post not found.</div>;
  return <Editor key={id ?? "new"} existing={existing} />;
}

function Editor({ existing }: { existing: Post | undefined }) {
  const nav = useNavigate();
  const cats = useCategories();
  const me = useMe();
  const [postId, setPostId] = useState<string | null>(existing?.id ?? null);
  const [status, setStatus] = useState<Status>(existing?.status ?? "Draft");
  const [f, setF] = useState({
    title: existing?.title ?? "", slug: existing?.slug ?? "", metaTitle: existing?.metaTitle ?? "",
    metaDescription: existing?.metaDescription ?? "", keyword: existing?.keyword ?? "",
    categoryId: existing?.categoryId ?? "", tags: existing?.tags.join(", ") ?? "",
    schedule: existing?.publishAt ? existing.publishAt.slice(0, 16) : "",
  });
  const [blocks, setBlocks] = useState<Block[]>(() => (existing?.blocks.length ? existing.blocks : [newBlock()]));
  const [image, setImage] = useState<ImageMeta>({ src: existing?.image || null, alt: existing?.coverAlt ?? "", caption: existing?.coverCaption ?? "" });
  const [aiUsed, setAiUsed] = useState(existing?.aiAssisted ?? false);
  const [aiOpen, setAiOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const dirty = useRef(false);
  const set = (k: keyof typeof f, v: string) => { dirty.current = true; setF((p) => ({ ...p, [k]: v, ...(k === "title" && !existing ? { slug: slugify(v) } : {}) })); };
  const setBlocksDirty = (b: Block[] | ((x: Block[]) => Block[])) => { dirty.current = true; setBlocks(b); };
  const setImageDirty = (v: ImageMeta) => { dirty.current = true; setImage(v); };

  const content = useMemo(() => blocksToMarkdown(blocks), [blocks]);
  const plain = content.replace(/[#>*`!\[\]()]/g, "");
  const words = plain.split(/\s+/).filter(Boolean).length;
  const chars = plain.replace(/\s/g, "").length;

  const persist = async (next: Status, silent = false): Promise<boolean> => {
    if (!f.title.trim()) { if (!silent) toast.error("Add a title first"); return false; }
    if (next === "Scheduled" && !f.schedule) { toast.error("Pick a publish date"); return false; }
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Signed out");
      let cover = image.src;
      if (cover?.startsWith("data:")) {
        const { url } = await uploadImage("blog-images", await dataUrlToBlob(cover), slugify(f.title) || "cover");
        cover = url;
        setImage((i) => ({ ...i, src: url }));
      }
      const row = {
        title: f.title.trim(), slug: f.slug || slugify(f.title) || `post-${Date.now()}`,
        category_id: f.categoryId || null, status: toDb(next), blocks: JSON.parse(JSON.stringify(blocks)),
        cover_url: cover, cover_alt: image.alt || null, cover_caption: image.caption || null,
        meta_title: f.metaTitle || null, meta_description: f.metaDescription || null, focus_keyword: f.keyword || null,
        word_count: words, publish_at: f.schedule ? new Date(f.schedule).toISOString() : null, ai_assisted: aiUsed,
      };
      let id = postId;
      if (id) {
        const { error } = await supabase.from("blogs").update(row).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("blogs").insert({ ...row, author_id: u.user.id, author_name: me?.name ?? u.user.email ?? "" }).select("id").single();
        if (error) throw error;
        id = data.id; setPostId(id);
        nav({ to: "/posts/new", search: { id }, replace: true });
      }
      // tags
      const names = Array.from(new Set(f.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)));
      await supabase.from("blog_tags").delete().eq("blog_id", id);
      if (names.length) {
        await supabase.from("tags").upsert(names.map((name) => ({ name })), { onConflict: "name", ignoreDuplicates: true });
        const { data: tagRows } = await supabase.from("tags").select("id, name").in("name", names);
        if (tagRows?.length) await supabase.from("blog_tags").insert(tagRows.map((t) => ({ blog_id: id!, tag_id: t.id })));
      }
      setStatus(next);
      dirty.current = false;
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      invalidate("posts", "tags", "activity", "notifications");
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      toast.error(msg.includes("blogs_slug_key") ? "That URL slug is already used — change it." : msg);
      return false;
    } finally { setSaving(false); }
  };

  // Autosave to the database every few seconds while editing (keeps current status)
  const persistRef = useRef(persist);
  persistRef.current = persist;
  useEffect(() => {
    const t = setInterval(() => {
      if (dirty.current && !saving && f.title.trim()) void persistRef.current(status === "Published" ? "Published" : status, true);
    }, 6000);
    return () => clearInterval(t);
  }, [status, saving, f.title]);

  const action = async (next: Status) => {
    const ok = await persist(next);
    if (!ok) return;
    if (next === "Draft") {
      await supabase.from("notifications").insert({ user_id: me!.id, title: "Draft saved", body: f.title, link: `/posts/new?id=${postId ?? ""}` });
      invalidate("notifications");
    }
    toast.success(next === "Published" ? "Published!" : next === "Scheduled" ? "Scheduled" : next === "Review" ? "Sent for review" : next === "Approved" ? "Approved" : "Draft saved");
    if (next !== "Draft") nav({ to: "/posts" });
  };

  const checks = [
    { ok: f.title.length >= 20 && f.title.length <= 70, l: "Title is 20–70 characters" },
    { ok: f.metaDescription.length >= 120 && f.metaDescription.length <= 160, l: "Meta description 120–160 chars" },
    { ok: !!f.keyword && f.title.toLowerCase().includes(f.keyword.toLowerCase()), l: "Focus keyword in title" },
    { ok: words >= 300, l: "Content has 300+ words" },
    { ok: !!image.src, l: "Featured image set" },
    { ok: !!image.src && !!image.alt, l: "Image has alt text" },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const canReview = me?.can("super_admin", "admin", "editor");

  const insertAi = (text: string) => {
    setAiUsed(true);
    setBlocksDirty((b) => [...b.filter((x) => x.text || x.type !== "p"), ...markdownToBlocks(text), newBlock()]);
    toast.success("Inserted into post");
  };

  return (
    <>
      <div className="glass sticky top-16 z-[5] -mx-4 -mt-8 mb-6 flex flex-wrap items-center gap-3 rounded-none border-x-0 border-t-0 px-4 py-3 md:-mx-8 md:px-8">
        <StatusBadge status={status} />
        <span className="text-xs text-muted-foreground tabular-nums">{words} words · {chars} chars · {Math.max(1, Math.round(words / 220))} min read</span>
        {saving ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" />Saving…</span>
          : savedAt && <span className="inline-flex items-center gap-1 text-xs text-success"><Cloud className="size-3" />Saved {savedAt}</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          {!aiOpen && <button className="btn" onClick={() => setAiOpen(true)}><Sparkles className="size-4 text-primary" />AI</button>}
          {postId && <button className="btn" onClick={() => nav({ to: "/preview/$id", params: { id: postId } })}><Eye className="size-4" />Preview</button>}
          <button className="btn" onClick={() => action("Draft")}>Save draft</button>
          {status === "Review" && canReview ? <button className="btn" onClick={() => action("Approved")}>Approve</button>
            : <button className="btn hidden sm:inline-flex" onClick={() => action("Review")}>Send to review</button>}
          <button className="btn-primary" onClick={() => action(f.schedule && new Date(f.schedule) > new Date() ? "Scheduled" : "Published")}>{f.schedule && new Date(f.schedule) > new Date() ? "Schedule" : "Publish"}</button>
        </div>
      </div>

      <div className={cn("grid gap-6", aiOpen ? "xl:grid-cols-[1fr_300px_360px] lg:grid-cols-[1fr_300px]" : "lg:grid-cols-[1fr_300px]")}>
        <article className="mx-auto w-full max-w-[46rem] pl-10 md:pl-14">
          <textarea value={f.title} onChange={(e) => set("title", e.target.value)} rows={1} placeholder="Untitled story"
            className="w-full resize-none bg-transparent font-display text-4xl font-bold leading-tight outline-none placeholder:text-muted-foreground/40 md:text-5xl" />
          <div className="mb-8 mt-2 text-xs text-muted-foreground">neuralvarsity.ai/blog/<input value={f.slug} onChange={(e) => set("slug", slugify(e.target.value))} className="bg-transparent text-primary outline-none" placeholder="slug" /></div>
          <BlockEditor blocks={blocks} setBlocks={setBlocksDirty} />

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
          <div className="glass rounded-2xl p-5"><h2 className="mb-3 font-semibold">Featured image</h2><FeaturedImage value={image} onChange={setImageDirty} title={f.title} /></div>
          <div className="glass space-y-4 rounded-2xl p-5">
            <h2 className="font-semibold">Publishing</h2>
            <Field label="Category">
              <select className="field" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Uncategorized</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Tags (comma separated)"><input className="field" value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="llm, career" /></Field>
            <Field label="Publish later (optional)"><input type="datetime-local" className="field" value={f.schedule} onChange={(e) => set("schedule", e.target.value)} /></Field>
          </div>
          <div className="glass rounded-2xl p-5">
            <h2 className="font-semibold">SEO score</h2>
            <div className="mt-4 flex items-center gap-5">
              <div className="relative size-24 shrink-0" role="img" aria-label={`SEO score ${score} out of 100`}>
                <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                  <defs><linearGradient id="seo-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="var(--color-primary)" /><stop offset="100%" stopColor="var(--color-accent)" /></linearGradient></defs>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-muted)" strokeWidth="9" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="url(#seo-ring)" strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - score / 100)} className="transition-[stroke-dashoffset] duration-700 ease-out" />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center"><div><div className="font-display text-2xl font-bold leading-none">{score}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</div></div></div>
              </div>
              <div className="min-w-0">
                <div className={cn("text-sm font-semibold", score >= 80 ? "text-success" : score >= 50 ? "text-accent" : "text-destructive")}>{score >= 80 ? "Great" : score >= 50 ? "Needs work" : "Poor"}</div>
                <div className="text-xs text-muted-foreground">{checks.filter((c) => c.ok).length} of {checks.length} checks passed</div>
              </div>
            </div>
            <ul className="mt-5 space-y-1.5 text-sm">
              {checks.map((c) => (
                <li key={c.l} className={cn("flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors", c.ok ? "text-foreground" : "text-muted-foreground hover:bg-muted/50")}>
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-full transition-colors", c.ok ? "bg-success/15 text-success" : "border border-border")}>{c.ok && <Check className="size-3" />}</span>{c.l}
                </li>
              ))}
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
