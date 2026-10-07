import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Upload, Trash2, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { invalidate, uploadImage } from "@/lib/blog-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/media")({
  head: () => ({
    meta: [
      { title: "Media Library — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "All images used across NeuralVarsity.ai posts." },
      { property: "og:title", content: "Media Library — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "All images used across NeuralVarsity.ai posts." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: media = [], isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("All");
  const [uploadFolder, setUploadFolder] = useState("General");
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const folders = useMemo(() => Array.from(new Set(["General", ...media.map((m) => m.folder)])), [media]);
  const shown = media.filter((m) => (folder === "All" || m.folder === folder) && m.name.toLowerCase().includes(q.toLowerCase()));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    for (const f of Array.from(files)) {
      try {
        const { path, url } = await uploadImage("media-library", f, f.name);
        const { error } = await supabase.from("media").insert({ owner_id: u.user!.id, path, url, name: f.name, folder: uploadFolder.trim() || "General", mime_type: f.type, size_bytes: f.size });
        if (error) throw error;
      } catch (e) { toast.error(`${f.name}: ${e instanceof Error ? e.message : "upload failed"}`); }
    }
    setBusy(false); invalidate("media"); toast.success("Upload complete");
  };
  const remove = async (ids: string[]) => {
    const items = media.filter((m) => ids.includes(m.id));
    await supabase.storage.from("media-library").remove(items.map((m) => m.path));
    const { error } = await supabase.from("media").delete().in("id", ids);
    if (error) toast.error(error.message); else { toast.success(`Deleted ${ids.length}`); setSel([]); invalidate("media"); }
  };

  return (
    <>
      <PageHeader title="Media Library" subtitle={`${media.length} files`} action={
        <div className="flex gap-2">
          <input className="field w-36" list="folders" value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} placeholder="Folder" />
          <datalist id="folders">{folders.map((f) => <option key={f} value={f} />)}</datalist>
          <label className="btn-primary cursor-pointer">{busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}Upload
            <input type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => upload(e.target.files)} />
          </label>
        </div>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input className="field max-w-xs" placeholder="Search files…" value={q} onChange={(e) => setQ(e.target.value)} />
        {["All", ...folders].map((f) => <button key={f} onClick={() => setFolder(f)} className={cn("rounded-full border px-3 py-1 text-xs", folder === f && "border-primary bg-primary/10 text-primary")}>{f}</button>)}
        {sel.length > 0 && <button className="btn ml-auto text-destructive" onClick={() => remove(sel)}><Trash2 className="size-4" />Delete {sel.length}</button>}
      </div>
      {isLoading ? <div className="text-muted-foreground">Loading…</div> : shown.length === 0 ? <EmptyState title="No files here">Upload images to use them across your posts.</EmptyState> : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {shown.map((m) => (
            <div key={m.id} className={cn("glass group relative overflow-hidden rounded-xl p-1 transition-all", sel.includes(m.id) && "ring-2 ring-primary")}>
              <img src={m.url} alt={m.alt ?? m.name} loading="lazy" className="aspect-video w-full rounded-lg object-cover" />
              <div className="flex items-center gap-2 p-2 text-xs">
                <input type="checkbox" checked={sel.includes(m.id)} onChange={(e) => setSel(e.target.checked ? [...sel, m.id] : sel.filter((x) => x !== m.id))} />
                <span className="flex-1 truncate">{m.name}</span>
                <span className="text-muted-foreground">{m.folder}</span>
              </div>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button className="btn bg-background px-2 py-1" onClick={() => { navigator.clipboard.writeText(m.url); toast.success("Link copied"); }} aria-label="Copy link"><Copy className="size-3" /></button>
                <button className="btn bg-background px-2 py-1 text-destructive" onClick={() => remove([m.id])} aria-label="Delete"><Trash2 className="size-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
