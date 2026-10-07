import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, FileText, FolderTree, Tags, Image, Users, Search, BarChart3,
  PenLine, CalendarClock, CheckCircle2, Settings, ChevronsLeft, Moon, Sun, Bell, Plus, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/posts", label: "Blog Posts", icon: FileText },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/tags", label: "Tags", icon: Tags },
  { to: "/media", label: "Media Library", icon: Image },
  { to: "/authors", label: "Authors", icon: Users },
  { to: "/seo", label: "SEO Management", icon: Search },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/drafts", label: "Drafts", icon: PenLine },
  { to: "/scheduled", label: "Scheduled Posts", icon: CalendarClock },
  { to: "/published", label: "Published Posts", icon: CheckCircle2 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(true);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  return (
    <div className="flex min-h-screen w-full">
      <aside className={cn("glass sticky top-0 z-20 hidden h-screen shrink-0 flex-col rounded-none border-y-0 border-l-0 transition-all duration-300 md:flex", collapsed ? "w-[72px]" : "w-64")}>
        <div className="flex h-16 items-center gap-2 px-4">
          <div className="bg-brand grid size-9 shrink-0 place-items-center rounded-xl text-accent-foreground"><Sparkles className="size-5" /></div>
          {!collapsed && <div className="font-display text-sm font-bold leading-tight">NeuralVarsity<span className="text-brand">.ai</span><div className="text-[11px] font-medium text-muted-foreground">Blog Studio</div></div>}
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {nav.map((n) => {
            const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} title={n.label}
                className={cn("group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground")}>
                {active && <span className="bg-brand absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full" />}
                <n.icon className={cn("size-4 shrink-0 transition-transform group-hover:scale-110", active && "text-primary")} />
                {!collapsed && <span className="truncate">{n.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button onClick={() => setCollapsed(!collapsed)} className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted">
          <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />{!collapsed && "Collapse"}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-10 flex h-16 items-center gap-3 rounded-none border-x-0 border-t-0 px-4 md:px-8">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input className="field pl-9" placeholder="Search posts, media, authors…" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className="btn px-2.5" aria-label="Toggle theme">{dark ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
            <button className="btn px-2.5" aria-label="Notifications"><Bell className="size-4" /></button>
            <Link to="/posts/new" className="btn-primary"><Plus className="size-4" /><span className="hidden sm:inline">New post</span></Link>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b px-4 py-2 md:hidden">
          {nav.map((n) => <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-muted-foreground" activeProps={{ className: "bg-muted text-foreground" }} activeOptions={{ exact: n.to === "/" }}>{n.label}</Link>)}
        </nav>
        <main className="flex-1 px-4 py-8 md:px-8 animate-in fade-in duration-500">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cls = status === "Published" ? "bg-success/15 text-success" : status === "Scheduled" ? "bg-primary/15 text-primary" : "bg-warning/15 text-warning";
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", cls)}><span className="size-1.5 rounded-full bg-current" />{status}</span>;
}
