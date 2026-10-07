import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Table2, List, LayoutGrid, Columns3 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { PostsTable } from "@/components/PostsTable";
import { GridView, KanbanView, ListView } from "@/components/PostViews";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/posts/")({
  head: () => ({
    meta: [
      { title: "Blog Posts — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Search, filter, publish and manage every NeuralVarsity.ai article." },
      { property: "og:title", content: "Blog Posts — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Search, filter, publish and manage every NeuralVarsity.ai article." },
    ],
  }),
  component: Page,
});

const views = [
  { k: "table", l: "Table", i: Table2 },
  { k: "list", l: "List", i: List },
  { k: "grid", l: "Grid", i: LayoutGrid },
  { k: "kanban", l: "Kanban", i: Columns3 },
] as const;

function Page() {
  const [view, setView] = useState<(typeof views)[number]["k"]>("table");
  return (
    <>
      <PageHeader title="Blog Posts" subtitle="Manage, publish and organize every article." action={
        <div className="flex items-center gap-2">
          <div className="glass flex rounded-lg p-1">
            {views.map((v) => (
              <button key={v.k} onClick={() => setView(v.k)} title={v.l} className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors", view === v.k && "bg-primary/15 text-primary")}>
                <v.i className="size-4" /><span className="hidden md:inline">{v.l}</span>
              </button>
            ))}
          </div>
          <Link to="/posts/new" className="btn-primary"><Plus className="size-4" />New post</Link>
        </div>} />
      {view === "table" && <PostsTable />}
      {view === "list" && <ListView />}
      {view === "grid" && <GridView />}
      {view === "kanban" && <KanbanView />}
    </>
  );
}
