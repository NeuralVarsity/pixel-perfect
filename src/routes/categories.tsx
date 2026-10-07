import { createFileRoute } from "@tanstack/react-router";
import { FolderTree } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { categories, usePosts } from "@/lib/blog-store";

export const Route = createFileRoute("/categories")({
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

function Page() {
  const posts = usePosts();
  return (
    <>
      <PageHeader title="Categories" subtitle="Group articles into topics readers can browse." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => {
          const n = posts.filter((p) => p.category === c).length;
          return (
            <div key={c} className="glass rounded-2xl p-5 transition-transform hover:-translate-y-0.5">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><FolderTree className="size-5" /></span>
              <h3 className="mt-4 font-semibold">{c}</h3>
              <p className="text-sm text-muted-foreground">{n} posts</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
