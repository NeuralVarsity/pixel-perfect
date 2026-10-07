import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { FileText, CheckCircle2, PenLine, CalendarClock, Eye, Users, TrendingUp, Trophy } from "lucide-react";
import { usePosts } from "@/lib/blog-store";
import { PageHeader, StatusBadge } from "@/components/AppShell";

export const Route = createFileRoute("/")({
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

const traffic = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m, i) => ({ m, v: [12, 18, 15, 24, 31, 29, 42][i]! * 1000 }));

function Dashboard() {
  const posts = usePosts();
  const count = (s: string) => posts.filter((p) => p.status === s).length;
  const views = posts.reduce((a, p) => a + p.views, 0);
  const top = [...posts].sort((a, b) => b.views - a.views)[0];
  const stats = [
    { l: "Total Blogs", v: posts.length, i: FileText, t: "+12%" },
    { l: "Published", v: count("Published"), i: CheckCircle2, t: "+8%" },
    { l: "Drafts", v: count("Draft"), i: PenLine, t: "+3" },
    { l: "Scheduled", v: count("Scheduled"), i: CalendarClock, t: "+2" },
    { l: "Total Views", v: views, i: Eye, t: "+24%" },
    { l: "Monthly Readers", v: 42180, i: Users, t: "+18%" },
  ];

  const groups = [
    { t: "Traffic", items: [["Organic Traffic", "61%", "+9%"], ["Returning Visitors", "34%", "+4%"], ["Avg. Read Time", "4m 12s", "+11%"], ["Bounce Rate", "38%", "-6%"]] },
    { t: "Content", items: [["In Review", String(count("Review")), ""], ["Approved", String(count("Approved")), ""], ["AI-assisted Blogs", "5", "+3"], ["Avg. Words", "1,840", "+7%"]] },
    { t: "SEO", items: [["Avg. SEO Score", "78", "+5"], ["Ranked Keywords", "1,264", "+142"], ["Top-10 Articles", "9", "+2"], ["SEO Growth", "+21%", ""]] },
  ];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      <PageHeader title="Good afternoon, editor" subtitle="Here's how NeuralVarsity's blog is performing." />
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g.t} className="glass rounded-2xl p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.t} metrics</div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {g.items.map(([l, v, d]) => (
                <div key={l}><div className="text-xs text-muted-foreground">{l}</div><div className="font-display text-xl font-bold">{v}</div>{d && <div className={d.startsWith("-") ? "text-xs text-success" : "text-xs text-success"}>{d}</div>}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="glass mb-6 overflow-x-auto rounded-2xl p-5">
        <h2 className="font-semibold">Reader activity heatmap</h2>
        <p className="text-xs text-muted-foreground">When readers open articles (hour of day)</p>
        <div className="mt-4 min-w-[640px] space-y-1">
          {days.map((d, r) => (
            <div key={d} className="flex items-center gap-1">
              <span className="w-10 text-xs text-muted-foreground">{d}</span>
              {Array.from({ length: 24 }, (_, h) => {
                const v = Math.max(0.06, Math.sin(((h - 6) / 24) * Math.PI * 2) * 0.5 + 0.45 + ((r * 7 + h * 3) % 5) * 0.04 - (r > 4 ? 0.2 : 0));
                return <div key={h} title={`${d} ${h}:00`} className="h-5 flex-1 rounded-sm bg-primary transition-transform hover:scale-125" style={{ opacity: Math.min(1, v) }} />;
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s, idx) => (
          <div key={s.l} className="glass group relative overflow-hidden rounded-2xl p-5 transition-transform hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "both" }}>
            <div className="bg-brand absolute -right-10 -top-10 size-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-25" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.l}</span>
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><s.i className="size-4" /></span>
            </div>
            <div className="mt-3 font-display text-3xl font-bold tabular-nums"><Counter value={s.v} /></div>
            <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-success"><TrendingUp className="size-3" />{s.t} vs last month</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-semibold">Readers over time</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={traffic}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Area dataKey="v" stroke="var(--color-primary)" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {top && (
          <div className="glass overflow-hidden rounded-2xl">
            <img src={top.image} alt="" className="h-40 w-full object-cover" />
            <div className="p-5">
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-accent"><Trophy className="size-3" />Top performing article</div>
              <h3 className="mt-2 font-semibold leading-snug">{top.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{top.views.toLocaleString()} views · {top.author}</p>
            </div>
          </div>
        )}
      </div>

      <div className="glass mt-6 rounded-2xl p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Recent posts</h2><Link to="/posts" className="text-sm text-primary">View all</Link></div>
        <ul className="mt-3 divide-y">
          {posts.slice(0, 5).map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <img src={p.image} alt="" loading="lazy" className="h-10 w-14 rounded-md object-cover" />
              <div className="min-w-0 flex-1"><div className="truncate font-medium">{p.title}</div><div className="text-xs text-muted-foreground">{p.author} · {p.updated}</div></div>
              <StatusBadge status={p.status} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
