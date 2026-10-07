import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { authors, usePosts } from "@/lib/blog-store";

export const Route = createFileRoute("/authors")({
  head: () => ({
    meta: [
      { title: "Authors — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Writers contributing to the NeuralVarsity.ai blog." },
      { property: "og:title", content: "Authors — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Writers contributing to the NeuralVarsity.ai blog." },
    ],
  }),
  component: Page,
});

function Page() {
  const posts = usePosts();
  return (
    <>
      <PageHeader title="Authors" subtitle="The people behind every story." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {authors.map((a) => {
          const mine = posts.filter((p) => p.author === a);
          return (
            <div key={a} className="glass rounded-2xl p-6 text-center">
              <div className="bg-brand mx-auto grid size-16 place-items-center rounded-full font-display text-xl font-bold text-accent-foreground">{a.split(" ").map((x) => x[0]).join("")}</div>
              <h3 className="mt-4 font-semibold">{a}</h3>
              <p className="text-sm text-muted-foreground">{mine.length} posts · {mine.reduce((s, p) => s + p.views, 0).toLocaleString()} views</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
