import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { invalidate, useMe, usePosts, useTags } from "@/lib/blog-store";

export const Route = createFileRoute("/_authenticated/tags")({
  head: () => ({
    meta: [
      { title: "Tags — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Every tag used across NeuralVarsity.ai articles." },
      { property: "og:title", content: "Tags — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Every tag used across NeuralVarsity.ai articles." },
    ],
  }),
  component: Page,
});

function Page() {
  const tags = useTags();
  const posts = usePosts();
  const me = useMe();
  const canDelete = me?.can("super_admin", "admin", "editor");
  const [name, setName] = useState("");
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim().toLowerCase();
    if (!n) return;
    const { error } = await supabase.from("tags").insert({ name: n });
    if (error) { toast.error(error.message); return; }
    setName(""); invalidate("tags");
  };
  const del = async (id: string) => {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) toast.error(error.message); else invalidate("tags", "posts");
  };
  return (
    <>
      <PageHeader title="Tags" subtitle="Fine-grained labels that connect related posts." />
      <form onSubmit={add} className="glass mb-6 flex gap-2 rounded-2xl p-4">
        <input className="field max-w-xs" placeholder="New tag" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary">Add tag</button>
      </form>
      {tags.length === 0 ? <EmptyState title="No tags yet">Tags you add here or in the editor appear here.</EmptyState> : (
        <div className="glass flex flex-wrap gap-3 rounded-2xl p-6">
          {tags.map((t) => (
            <span key={t.id} className="group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:border-primary">
              #{t.name} <span className="text-muted-foreground">{posts.filter((p) => p.tags.includes(t.name)).length}</span>
              {canDelete && <button onClick={() => del(t.id)} aria-label={`Delete ${t.name}`} className="text-muted-foreground hover:text-destructive"><X className="size-3" /></button>}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
