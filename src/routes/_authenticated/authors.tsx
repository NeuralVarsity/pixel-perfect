import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { roleLabel, useProfiles, usePosts } from "@/lib/blog-store";

export const Route = createFileRoute("/_authenticated/authors")({
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
  const people = useProfiles();
  return (
    <>
      <PageHeader title="Authors" subtitle="The people behind every story." />
      {people.length === 0 ? <EmptyState title="No authors yet" /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {people.map((a) => {
            const mine = posts.filter((p) => p.authorId === a.id);
            const name = a.full_name || a.email || "User";
            return (
              <div key={a.id} className="glass rounded-2xl p-6 text-center">
                {a.avatar_url ? <img src={a.avatar_url} alt="" className="mx-auto size-16 rounded-full object-cover" /> :
                  <div className="bg-brand mx-auto grid size-16 place-items-center rounded-full font-display text-xl font-bold text-accent-foreground">{name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()}</div>}
                <h3 className="mt-4 font-semibold">{name}</h3>
                <p className="text-xs text-primary">{a.roles.map((r) => roleLabel[r]).join(", ")}</p>
                {a.bio && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.bio}</p>}
                <p className="mt-2 text-sm text-muted-foreground">{mine.length} posts · {mine.reduce((s, p) => s + p.views, 0).toLocaleString()} views</p>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
