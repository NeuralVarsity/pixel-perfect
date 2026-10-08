import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { FileText, CheckCircle2, PenLine, CalendarClock, Eye, Users, Trophy, Clock, Sparkles } from "lucide-react";
import { usePosts, usePageViews, useMe } from "@/lib/blog-store";
import { PageHeader, StatusBadge } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Overview of posts, readers and top articles on NeuralVarsity.ai." },
      { property: "og:title", content: "Dashboard — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Overview of posts, readers and top articles on NeuralVarsity.ai." },
    ],
  }),
  component: Dashboard,
});

function Counter({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - start) / 900); setN(Math.round(value * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n.toLocaleString()}</>;
}

function Dashboard() {
  const posts = usePosts();
  const views = usePageViews();
  const me = useMe();
  const count = (s: string) => posts.filter((p) => p.status === s).length;
  const monthAgo = Date.now() - 30 * 864e5;
  const monthly = new Set(views.filter((v) => new Date(v.created_at).getTime() > monthAgo).map((v) => v.visitor_id)).size;
  const unique = new Set(views.map((v) => v.visitor_id)).size;
  const avgRead = views.length ? Math.round(views.reduce((a, v) => a + v.read_seconds, 0) / views.length) : 0;
  const top = [...posts].sort((a, b) => b.views - a.views)[0];

  const trend = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(Date.now() - (29 - i) * 864e5); return d.toISOString().slice(0, 10); });
    const map = new Map(days.map((d) => [d, 0]));
    views.forEach((v) => { const d = v.created_at.slice(0, 10); if (map.has(d)) map.set(d, map.get(d)! + 1); });
    return days.map((d) => ({ d: d.slice(5), v: map.get(d)! }));
  }, [views]);
  const heat = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
    views.forEach((v) => { const d = new Date(v.created_at); g[(d.getDay() + 6) % 7]![d.getHours()]! += 1; });
    return g;
  }, [views]);
  const maxHeat = Math.max(1, ...heat.flat());

  const stats = [
    { l: "Total Blogs", v: posts.length, i: FileText },
    { l: "Published", v: count("Published"), i: CheckCircle2 },
    { l: "Drafts", v: count("Draft"), i: PenLine },
    { l: "Scheduled", v: count("Scheduled"), i: CalendarClock },
    { l: "Total Views", v: views.length, i: Eye },
    { l: "Monthly Readers", v: monthly, i: Users },
  ];
  const seoAvg = posts.length ? Math.round(posts.reduce((a, p) => a + [p.metaTitle, p.metaDescription, p.keyword, p.image].filter(Boolean).length * 25, 0) / posts.length) : 0;
  const groups = [
    { t: "Traffic", items: [["Unique Visitors", unique.toLocaleString()], ["Avg. Read Time", `${Math.floor(avgRead / 60)}m ${avgRead % 60}s`], ["Views (30d)", trend.reduce((a, x) => a + x.v, 0).toLocaleString()], ["Referred visits", views.filter((v) => v.referrer).length.toLocaleString()]] },
    { t: "Content", items: [["In Review", String(count("Review"))], ["Approved", String(count("Approved"))], ["AI-assisted", String(posts.filter((p) => p.aiAssisted).length)], ["Avg. Words", posts.length ? Math.round(posts.reduce((a, p) => a + p.wordCount, 0) / posts.length).toLocaleString() : "0"]] },
    { t: "SEO", items: [["Avg. SEO Score", String(seoAvg)], ["Focus keywords set", String(posts.filter((p) => p.keyword).length)], ["Missing meta", String(posts.filter((p) => !p.metaDescription).length)], ["With cover image", String(posts.filter((p) => p.image).length)]] },
  ];

  return (
    <>
      <PageHeader title={`Welcome${me?.name ? `, ${me.name.split(" ")[0]}` : ""}`} subtitle="Live numbers from your blog." />
      {posts.length === 0 && (
        <div className="glass mb-6 flex flex-wrap items-center gap-4 rounded-2xl p-6">
          <Sparkles className="size-6 text-primary" />
          <div className="flex-1"><div className="font-semibold">Your studio is ready</div><div className="text-sm text-muted-foreground">Create a category, then write your first post.</div></div>
          <Link to="/posts/new" className="btn-primary">Write first post</Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s, idx) => (
          <div key={s.l} className="glass group relative overflow-hidden rounded-2xl p-5 transition-transform hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "both" }}>
            <div className="bg-brand absolute -right-10 -top-10 size-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-25" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.l}</span>
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><s.i className="size-4" /></span>
            </div>
            <div className="mt-3 font-display text-3xl font-bold tabular-nums"><Counter value={s.v} /></div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g.t} className="glass card-hover rounded-2xl p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.t} metrics</div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {g.items.map(([l, v]) => <div key={l}><div className="text-xs text-muted-foreground">{l}</div><div className="font-display text-xl font-bold">{v}</div></div>)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-semibold">Views — last 30 days</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} interval={4} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Area dataKey="v" name="Views" stroke="var(--color-primary)" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass overflow-hidden rounded-2xl">
          {top && top.views > 0 ? (
            <>
              {top.image && <img src={top.image} alt="" className="h-40 w-full object-cover" />}
              <div className="p-5">
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-accent"><Trophy className="size-3" />Top performing article</div>
                <h3 className="mt-2 font-semibold leading-snug">{top.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{top.views.toLocaleString()} views · {top.author}</p>
              </div>
            </>
          ) : <div className="grid h-full min-h-40 place-items-center p-6 text-center text-sm text-muted-foreground"><div><Clock className="mx-auto mb-2 size-5" />Your top article will appear once readers visit published posts.</div></div>}
        </div>
      </div>

      <div className="glass mt-6 overflow-x-auto rounded-2xl p-5">
        <h2 className="font-semibold">Reader activity heatmap</h2>
        <p className="text-xs text-muted-foreground">When readers open articles (your local time)</p>
        <div className="mt-4 min-w-[640px] space-y-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, r) => (
            <div key={d} className="flex items-center gap-1">
              <span className="w-10 text-xs text-muted-foreground">{d}</span>
              {heat[r]!.map((n, h) => <div key={h} title={`${d} ${h}:00 — ${n} views`} className="h-5 flex-1 rounded-sm bg-primary" style={{ opacity: n ? 0.15 + (n / maxHeat) * 0.85 : 0.06 }} />)}
            </div>
          ))}
        </div>
      </div>

      <div className="glass mt-6 rounded-2xl p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Recent posts</h2><Link to="/posts" className="text-sm text-primary">View all</Link></div>
        {posts.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No posts yet — your latest stories will show up here.</p> : (
          <ul className="mt-3 divide-y">
            {posts.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link to="/posts/new" search={{ id: p.id }} className="flex items-center gap-3 py-3">
                  {p.image ? <img src={p.image} alt="" loading="lazy" className="h-10 w-14 rounded-md object-cover" /> : <div className="bg-brand h-10 w-14 rounded-md opacity-40" />}
                  <div className="min-w-0 flex-1"><div className="truncate font-medium">{p.title}</div><div className="text-xs text-muted-foreground">{p.author} · {p.updated}</div></div>
                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
