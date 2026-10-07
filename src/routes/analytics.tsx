import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { PageHeader } from "@/components/AppShell";
import { categories, usePosts } from "@/lib/blog-store";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Views by category and top articles for NeuralVarsity.ai." },
      { property: "og:title", content: "Analytics — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Views by category and top articles for NeuralVarsity.ai." },
    ],
  }),
  component: Page,
});

function Page() {
  const posts = usePosts();
  const data = categories.map((c) => ({ c: c.split(" ")[0], v: posts.filter((p) => p.category === c).reduce((s, p) => s + p.views, 0) }));
  const top = [...posts].sort((a, b) => b.views - a.views).slice(0, 5);
  const max = top[0]?.views || 1;
  return (
    <>
      <PageHeader title="Analytics" subtitle="What readers come back for." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold">Views by category</h2>
          <div className="mt-4 h-72"><ResponsiveContainer><BarChart data={data}>
            <XAxis dataKey="c" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
            <Bar dataKey="v" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
          </BarChart></ResponsiveContainer></div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold">Top articles</h2>
          <ul className="mt-4 space-y-4">
            {top.map((p) => (
              <li key={p.id}>
                <div className="flex justify-between text-sm"><span className="truncate pr-4">{p.title}</span><span className="tabular-nums text-muted-foreground">{p.views.toLocaleString()}</span></div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className="bg-brand h-full rounded-full" style={{ width: `${(p.views / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
