import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { blog, statusList, usePosts, type Status } from "@/lib/blog-store";
import { StatusBadge } from "./AppShell";
import { cn } from "@/lib/utils";

export function GridView() {
  const posts = usePosts();
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {posts.map((p) => (
        <Link key={p.id} to="/posts/new" search={{ id: p.id }} className="glass group overflow-hidden rounded-2xl transition-transform hover:-translate-y-1">
          <div className="overflow-hidden"><img src={p.image} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
          <div className="p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{p.category}</span><StatusBadge status={p.status} /></div>
            <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{p.title}</h3>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{p.author} · {p.updated}</span><span className="inline-flex items-center gap-1"><Eye className="size-3" />{p.views.toLocaleString()}</span></div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function ListView() {
  const posts = usePosts();
  return (
    <div className="glass divide-y rounded-2xl">
      {posts.map((p) => (
        <Link key={p.id} to="/posts/new" search={{ id: p.id }} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50">
          <img src={p.image} alt="" loading="lazy" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{p.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{p.author} · {p.category} · updated {p.updated}</div>
          </div>
          <span className="hidden text-sm tabular-nums text-muted-foreground sm:block">{p.views.toLocaleString()} views</span>
          <StatusBadge status={p.status} />
        </Link>
      ))}
    </div>
  );
}

export function KanbanView() {
  const posts = usePosts();
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<Status | null>(null);
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statusList.map((s) => {
        const col = posts.filter((p) => p.status === s);
        return (
          <div key={s} onDragOver={(e) => { e.preventDefault(); setOver(s); }} onDragLeave={() => setOver(null)}
            onDrop={() => { if (drag) { blog.setStatus([drag], s); toast.success(`Moved to ${s}`); } setDrag(null); setOver(null); }}
            className={cn("glass flex w-72 shrink-0 flex-col rounded-2xl p-3 transition-colors", over === s && "ring-2 ring-primary")}>
            <div className="mb-3 flex items-center justify-between px-1"><StatusBadge status={s} /><span className="text-xs text-muted-foreground">{col.length}</span></div>
            <div className="min-h-24 space-y-2">
              {col.map((p) => (
                <div key={p.id} draggable onDragStart={() => setDrag(p.id)} className={cn("cursor-grab rounded-xl border bg-background p-3 shadow-sm transition-all hover:border-primary active:cursor-grabbing", drag === p.id && "opacity-40")}>
                  <img src={p.image} alt="" loading="lazy" className="mb-2 aspect-[16/8] w-full rounded-lg object-cover" />
                  <div className="text-sm font-semibold leading-snug">{p.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{p.author}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
