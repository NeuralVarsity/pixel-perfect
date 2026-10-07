import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { usePosts } from "@/lib/blog-store";

export const Route = createFileRoute("/seo")({
  head: () => ({
    meta: [
      { title: "SEO Management — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Spot posts missing meta titles, descriptions and keywords." },
      { property: "og:title", content: "SEO Management — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Spot posts missing meta titles, descriptions and keywords." },
    ],
  }),
  component: Page,
});

function Page() {
  const posts = usePosts();
  return (
    <>
      <PageHeader title="SEO Management" subtitle="Fix gaps that keep posts from ranking." />
      <div className="glass divide-y rounded-2xl">
        {posts.map((p) => {
          const issues = [!p.metaTitle && "meta title", !p.metaDescription && "meta description", !p.keyword && "focus keyword"].filter(Boolean);
          const score = Math.round(((3 - issues.length) / 3) * 100);
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="w-12 font-display text-xl font-bold text-brand">{score}</div>
              <div className="min-w-0 flex-1"><div className="truncate font-medium">{p.title}</div><div className="text-xs text-muted-foreground">{issues.length ? `Missing ${issues.join(", ")}` : "All good"}</div></div>
              <Link to="/posts/new" search={{ id: p.id }} className="btn">Optimize</Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
