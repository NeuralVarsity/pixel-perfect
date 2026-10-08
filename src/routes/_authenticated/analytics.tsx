import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { usePageViews, usePosts } from "@/lib/blog-store";

export const Route = createFileRoute("/_authenticated/analytics")({
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
  const views = usePageViews();
  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    posts.forEach((p) => m.set(p.category, (m.get(p.category) ?? 0) + p.views));
    return Array.from(m, ([c, v]) => ({ c, v }));
  }, [posts]);
  const top = [...posts].filter((p) => p.views > 0).sort((a, b) => b.views - a.views).slice(0, 8);
  const max = top[0]?.views || 1;
  const readByPost = useMemo(() => {
    const m = new Map<string, { s: number; n: number }>();
    views.forEach((v) => { const x = m.get(v.blog_id) ?? { s: 0, n: 0 }; x.s += v.read_seconds; x.n += 1; m.set(v.blog_id, x); });
    return m;
  }, [views]);
  const unique = new Set(views.map((v) => v.visitor_id)).size;

  return (
    <>
      <PageHeader title="Analytics" subtitle={`${views.length.toLocaleString()} views · ${unique.toLocaleString()} unique visitors (last 120 days)`} />
      {views.length === 0 ? <EmptyState title="No reader data yet">Publish a post and share it — views, reading time and referrers will appear here automatically.</EmptyState> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-2xl p-5">
            <h2 className="font-semibold">Views by category</h2>
            <div className="mt-4 h-72"><ResponsiveContainer><BarChart data={byCat}>
              <XAxis dataKey="c" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Bar dataKey="v" name="Views" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            </BarChart></ResponsiveContainer></div>
          </div>
          <div className="glass rounded-2xl p-5">
            <h2 className="font-semibold">Top articles</h2>
            <ul className="mt-4 space-y-4">
              {top.map((p) => {
                const r = readByPost.get(p.id); const avg = r ? Math.round(r.s / r.n) : 0;
                return (
                  <li key={p.id}>
                    <div className="flex justify-between text-sm"><span className="truncate pr-4">{p.title}</span><span className="tabular-nums text-muted-foreground">{p.views.toLocaleString()} · {Math.floor(avg / 60)}m{avg % 60}s</span></div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className="bg-brand h-full rounded-full" style={{ width: `${(p.views / max) * 100}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
