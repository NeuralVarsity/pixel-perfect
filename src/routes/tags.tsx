import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { usePosts } from "@/lib/blog-store";

export const Route = createFileRoute("/tags")({
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
  const posts = usePosts();
  const counts = posts.flatMap((p) => p.tags).reduce<Record<string, number>>((a, t) => ({ ...a, [t]: (a[t] ?? 0) + 1 }), {});
  return (
    <>
      <PageHeader title="Tags" subtitle="Fine-grained labels that connect related posts." />
      <div className="glass flex flex-wrap gap-3 rounded-2xl p-6">
        {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t, n]) => (
          <span key={t} className="rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">#{t} <span className="text-muted-foreground">{n}</span></span>
        ))}
      </div>
    </>
  );
}
