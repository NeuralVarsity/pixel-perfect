import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Inbox } from "lucide-react";
import { getPublishedList, type PublicPost } from "@/lib/public-blog.functions";
import logo from "@/assets/nv-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeuralVarsity.ai — Articles on AI, learning and machine intelligence" },
      { name: "description", content: "The NeuralVarsity.ai journal: essays, guides and field notes on artificial intelligence, written and published by our own editorial studio." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "NeuralVarsity.ai — Articles on AI, learning and machine intelligence" },
      { property: "og:description", content: "Essays, guides and field notes on artificial intelligence, written and published by our own editorial studio." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: async () => ({ posts: await getPublishedList() }),
  component: Home,
});

const fmt = (d: string) => {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00Z`);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};

const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.2em] text-primary";

function Home() {
  const { posts } = Route.useLoaderData();
  const [lead, ...rest] = posts;
  const topics = Object.entries(
    posts.reduce<Record<string, number>>((acc, p) => { acc[p.category] = (acc[p.category] ?? 0) + 1; return acc; }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo.url} alt="" className="size-8 rounded-md bg-foreground p-0.5" />
            <span className="font-display text-sm font-bold tracking-tight">NeuralVarsity<span className="text-primary">.ai</span></span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <a href="#latest" className="hidden rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground sm:inline-block">Articles</a>
            <a href="#topics" className="hidden rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground sm:inline-block">Topics</a>
            <a href="#studio" className="hidden rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground md:inline-block">Studio</a>
            <Link to="/auth" className="btn-primary ml-1 text-xs">Team sign in</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className={eyebrow}>The NeuralVarsity journal</div>
            <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.06] tracking-tight sm:text-6xl md:text-7xl">
              Ideas worth <span className="text-primary">learning</span> out loud.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-8 text-muted-foreground">
              Essays, guides and field notes on artificial intelligence — written by the people building it,
              and published through our own editorial studio.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              {lead ? (
                <Link to="/blog/$slug" params={{ slug: lead.slug }} className="btn-primary">
                  Read the latest <ArrowRight className="size-4" />
                </Link>
              ) : (
                <Link to="/auth" className="btn-primary">Open the studio <ArrowRight className="size-4" /></Link>
              )}
              <a href="#topics" className="btn-ghost">Browse topics</a>
            </div>
          </div>

          <div className="lg:col-span-5">
            {lead ? (
              <Link to="/blog/$slug" params={{ slug: lead.slug }} className="glass card-hover block overflow-hidden rounded-2xl p-5">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  <span className="font-semibold text-primary">Latest</span>
                  <span>{lead.category}</span>
                </div>
                {lead.cover ? (
                  <img src={lead.cover} alt="" loading="lazy" className="mt-4 aspect-[16/10] w-full rounded-xl object-cover" />
                ) : (
                  <div className="bg-brand mt-4 aspect-[16/10] w-full rounded-xl opacity-40" />
                )}
                <h2 className="mt-4 font-display text-xl font-semibold leading-snug">{lead.title}</h2>
                <div className="mt-3 text-xs text-muted-foreground">{lead.author} · {fmt(lead.date)} · {lead.readMinutes} min read</div>
              </Link>
            ) : (
              <div className="glass rounded-2xl p-8 text-center">
                <Inbox className="mx-auto size-7 text-muted-foreground" />
                <div className="mt-3 font-display text-lg font-semibold">Nothing published yet</div>
                <p className="mt-2 text-sm text-muted-foreground">The first article is on its way. Sign in to the studio to write it.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-white/5">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-white/5 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Stat value={String(posts.length)} label={`${posts.length === 1 ? "article" : "articles"} published`} />
          <Stat value={String(topics.length)} label={`${topics.length === 1 ? "topic" : "topics"} covered`} />
          <Stat value={fmt(posts[0]?.date ?? "")} label="Most recent" />
        </div>
      </section>

      <section id="latest" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className={eyebrow}>Archive</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">{lead ? "More from the journal" : "All articles"}</h2>
          </div>
          <a href="/sitemap.xml" className="text-sm text-muted-foreground transition-colors hover:text-primary">Sitemap →</a>
        </div>

        {rest.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="glass card-hover flex flex-col overflow-hidden rounded-2xl">
                {p.cover ? (
                  <img src={p.cover} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
                ) : (
                  <div className="bg-brand aspect-[16/9] w-full opacity-30" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{p.category}</div>
                  <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{p.title}</h3>
                  {p.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{p.excerpt}</p>}
                  <div className="mt-auto pt-4 text-xs text-muted-foreground">{p.author} · {fmt(p.date)} · {p.readMinutes} min read</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass mt-8 flex flex-col items-center rounded-2xl px-6 py-14 text-center">
            <Inbox className="size-8 text-muted-foreground" />
            <h3 className="mt-4 font-display text-xl font-semibold">More articles are in the works</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Drafts and scheduled pieces move through review before they appear here. Check back soon, or sign in to the studio to see the pipeline.
            </p>
            <Link to="/auth" className="btn-ghost mt-6">Open the studio</Link>
          </div>
        )}
      </section>

      <section id="topics" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className={eyebrow}>Index</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Topics</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Every article is filed under a single topic so the archive stays easy to scan.</p>
          </div>
          <div className="lg:col-span-8">
            {topics.length ? (
              <ol className="divide-y divide-white/5 border-y border-white/5">
                {topics.map(([name, n], i) => (
                  <li key={name} className="flex items-baseline justify-between gap-6 py-4">
                    <span className="flex items-baseline gap-4">
                      <span className="text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-display text-lg font-semibold">{name}</span>
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">{n} article{n === 1 ? "" : "s"}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Topics appear as soon as the first article is published.</p>
            )}
          </div>
        </div>
      </section>

      <section id="studio" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <div className="glass relative overflow-hidden rounded-3xl p-8 md:p-12">
          <div className="bg-brand pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-25 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className={eyebrow}>Behind the byline</div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">The Blog Studio</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Everything you read here is written, reviewed, scheduled and published in one place — with editorial
              roles, SEO checks and an approval trail on every article.
            </p>
            <ul className="mt-7 grid gap-3 text-sm sm:grid-cols-2">
              {["Draft with AI assistance", "Editorial review and approval", "Scheduled publishing", "Search-optimised articles"].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-muted-foreground">
                  <Check className="size-4 shrink-0 text-primary" />{f}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/auth" className="btn-primary">Team sign in <ArrowRight className="size-4" /></Link>
              <a href="#latest" className="btn-ghost">Keep reading</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <img src={logo.url} alt="" className="size-7 rounded bg-foreground p-0.5" />
            <div>
              <div className="font-display text-sm font-semibold">NeuralVarsity.ai</div>
              <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} NeuralVarsity. All rights reserved.</div>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            <a href="#latest" className="transition-colors hover:text-primary">Articles</a>
            <a href="#topics" className="transition-colors hover:text-primary">Topics</a>
            <a href="/sitemap.xml" className="transition-colors hover:text-primary">Sitemap</a>
            <Link to="/auth" className="transition-colors hover:text-primary">Team sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="py-6 sm:px-6 sm:first:pl-0">
      <div className="font-display text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
    </div>
  );
}
