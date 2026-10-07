import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, ExternalLink } from "lucide-react";
import { usePostsQuery } from "@/lib/blog-store";
import { ArticleView } from "@/components/ArticleView";
import { StatusBadge } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/preview/$id")({
  head: () => ({
    meta: [
      { title: "Preview — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Preview a NeuralVarsity.ai article before publishing." },
      { property: "og:title", content: "Preview — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Preview a NeuralVarsity.ai article before publishing." },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { data, isLoading } = usePostsQuery();
  const p = data?.find((x) => x.id === id);
  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!p) return <div className="text-muted-foreground">Post not found.</div>;
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <StatusBadge status={p.status} />
        <div className="ml-auto flex gap-2">
          {p.status === "Published" && <Link to="/blog/$slug" params={{ slug: p.slug }} target="_blank" className="btn"><ExternalLink className="size-4" />Live page</Link>}
          <Link to="/posts/new" search={{ id: p.id }} className="btn-primary"><Pencil className="size-4" />Edit</Link>
        </div>
      </div>
      <div className="glass mx-auto mb-10 max-w-3xl rounded-xl border p-4">
        <div className="text-xs text-muted-foreground">neuralvarsity.ai › blog › {p.slug}</div>
        <div className="mt-1 font-medium text-primary">{p.metaTitle || p.title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{p.metaDescription || "No meta description yet."}</div>
      </div>
      <ArticleView a={{ title: p.title, cover: p.image || null, coverAlt: p.coverAlt, coverCaption: p.coverCaption, author: p.author, date: p.published, category: p.category, blocks: p.blocks, readMinutes: Math.max(1, Math.round(p.wordCount / 220)) }} />
    </>
  );
}
