import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FolderTree, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { invalidate, useCategories, useMe, usePosts } from "@/lib/blog-store";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({
    meta: [
      { title: "Categories — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Organize NeuralVarsity.ai articles into topics." },
      { property: "og:title", content: "Categories — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Organize NeuralVarsity.ai articles into topics." },
    ],
  }),
  component: Page,
});

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Page() {
  const cats = useCategories();
  const posts = usePosts();
  const me = useMe();
  const canEdit = me?.can("super_admin", "admin", "editor");
  const canDelete = me?.can("super_admin", "admin");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim(), slug: slugify(name), description: desc || null });
    if (error) { toast.error(error.message); return; }
    setName(""); setDesc(""); invalidate("categories"); toast.success("Category added");
  };
  const del = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message); else { invalidate("categories", "posts"); toast.success("Deleted"); }
  };

  return (
    <>
      <PageHeader title="Categories" subtitle="Group articles into topics readers can browse." />
      {canEdit && (
        <form onSubmit={add} className="glass mb-6 flex flex-wrap gap-2 rounded-2xl p-4">
          <input className="field max-w-xs" placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="field flex-1" placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <button className="btn-primary"><Plus className="size-4" />Add</button>
        </form>
      )}
      {cats.length === 0 ? <EmptyState title="No categories yet" icon={<FolderTree />}>{canEdit ? "Add your first one above." : "Ask an editor to create some."}</EmptyState> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cats.map((c) => (
            <div key={c.id} className="glass group rounded-2xl p-5 transition-transform hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><FolderTree className="size-5" /></span>
                {canDelete && <button onClick={() => del(c.id)} className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100" aria-label="Delete"><Trash2 className="size-4" /></button>}
              </div>
              <h3 className="mt-4 font-semibold">{c.name}</h3>
              {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{posts.filter((p) => p.categoryId === c.id).length} posts</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
