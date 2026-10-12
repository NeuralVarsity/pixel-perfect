import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, Eye, FileText, Pencil, PenLine, Plus } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/AppShell";
import { usePosts } from "@/lib/blog-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Blogs — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Write, edit and manage NeuralVarsity.ai blog posts." },
      { property: "og:title", content: "Your Blogs — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Write, edit and manage NeuralVarsity.ai blog posts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const shortcuts = [
  { label: "All posts", status: undefined, to: "/posts", icon: FileText },
  { label: "Drafts", status: "Draft", to: "/drafts", icon: PenLine },
  { label: "Scheduled", status: "Scheduled", to: "/scheduled", icon: CalendarClock },
  { label: "Published", status: "Published", to: "/published", icon: CheckCircle2 },
] as const;

function Dashboard() {
  const posts = usePosts();
  const recent = [...posts].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 8);

  return (
    <>
      <PageHeader
        title="Your blogs"
        subtitle="Write, edit and publish from one simple workspace."
        action={<Link to="/posts/new" className="btn-primary"><Plus className="size-4" />New post</Link>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {shortcuts.map((item) => {
          const total = item.status ? posts.filter((post) => post.status === item.status).length : posts.length;
          return (
            <Link key={item.label} to={item.to} className="glass group rounded-xl p-4 transition-colors hover:border-primary/30">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <item.icon className="size-4 text-primary" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold tabular-nums">{total}</div>
            </Link>
          );
        })}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Recent blogs</h2>
          <Link to="/posts" className="text-sm font-medium text-primary hover:underline">View all blogs</Link>
        </div>

        <div className="glass overflow-hidden rounded-xl">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="mb-4 grid size-12 place-items-center rounded-lg bg-primary/10 text-primary"><PenLine className="size-5" /></span>
              <h3 className="font-semibold">Write your first blog</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Start with an idea. Your draft saves while you write.</p>
              <Link to="/posts/new" className="btn-primary mt-5"><Plus className="size-4" />New post</Link>
            </div>
          ) : (
            <ul className="divide-y">
              {recent.map((post) => (
                <li key={post.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/40 sm:px-5">
                  {post.image ? (
                    <img src={post.image} alt="" loading="lazy" className="h-12 w-16 shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="grid h-12 w-16 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><FileText className="size-4" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link to="/posts/new" search={{ id: post.id }} className="block truncate font-medium hover:text-primary">{post.title}</Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{post.author}</span><span>·</span><span className="shrink-0">{post.updated}</span>
                    </div>
                  </div>
                  <div className="hidden items-center gap-3 sm:flex">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Eye className="size-3.5" />{post.views.toLocaleString()}</span>
                    <StatusBadge status={post.status} />
                  </div>
                  <Link to="/posts/new" search={{ id: post.id }} aria-label={`Edit ${post.title}`} title="Edit" className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="size-4" /></Link>
                  <Link to="/preview/$id" params={{ id: post.id }} aria-label={`Preview ${post.title}`} title="Preview" className="hidden size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:grid"><Eye className="size-4" /></Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}