import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpDown, Copy, Download, Eye, Pencil, Trash2, Upload, Send, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { blog, categories, usePosts, type Post, type Status } from "@/lib/blog-store";
import { StatusBadge } from "./AppShell";

const PAGE = 6;

export function PostsTable({ fixedStatus }: { fixedStatus?: Status }) {
  const all = usePosts();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>(fixedStatus ?? "All");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<{ k: keyof Post; dir: 1 | -1 }>({ k: "updated", dir: -1 });
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<string[]>([]);

  const rows = useMemo(() => {
    return all
      .filter((p) => (status === "All" || p.status === status) && (cat === "All" || p.category === cat))
      .filter((p) => (p.title + p.author + p.tags.join(" ")).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (a[sort.k]! > b[sort.k]! ? 1 : -1) * sort.dir);
  }, [all, q, status, cat, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);
  const sortBy = (k: keyof Post) => setSort((s) => ({ k, dir: s.k === k ? (s.dir * -1 as 1 | -1) : -1 }));

  const exportCsv = () => {
    const head = "Title,Author,Category,Tags,Status,Views,Published,Updated";
    const body = rows.map((p) => [p.title, p.author, p.category, p.tags.join("|"), p.status, p.views, p.published, p.updated].map((v) => `"${v}"`).join(","));
    const url = URL.createObjectURL(new Blob([[head, ...body].join("\n")], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "blogs.csv" }).click();
    toast.success(`Exported ${rows.length} posts`);
  };
  const bulk = (fn: () => void, msg: string) => { fn(); toast.success(msg); setSel([]); };
  const Th = ({ k, children }: { k: keyof Post; children: string }) => (
    <th className="px-3 py-3 text-left"><button onClick={() => sortBy(k)} className="inline-flex items-center gap-1 hover:text-foreground">{children}<ArrowUpDown className="size-3" /></button></th>
  );

  return (
    <div className="glass rounded-2xl">
      <div className="flex flex-wrap items-center gap-2 border-b p-4">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className="field max-w-xs" placeholder="Search blogs…" />
        {!fixedStatus && (
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="field w-auto">
            {["All", "Draft", "Review", "Approved", "Scheduled", "Published"].map((s) => <option key={s}>{s}</option>)}
          </select>
        )}
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="field w-auto">
          {["All", ...categories].map((s) => <option key={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <label className="btn cursor-pointer"><Upload className="size-4" />Import<input type="file" accept=".csv,.json" hidden onChange={() => toast.success("Import queued")} /></label>
          <button onClick={exportCsv} className="btn"><Download className="size-4" />Export CSV</button>
        </div>
      </div>

      {sel.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-primary/5 px-4 py-2 text-sm animate-in slide-in-from-top-1">
          <span className="font-semibold">{sel.length} selected</span>
          <button className="btn py-1" onClick={() => bulk(() => blog.setStatus(sel, "Published"), "Published")}>Publish</button>
          <button className="btn py-1" onClick={() => bulk(() => blog.setStatus(sel, "Draft"), "Moved to drafts")}>Unpublish</button>
          <button className="btn py-1 text-destructive" onClick={() => bulk(() => blog.remove(sel), "Deleted")}>Delete</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr className="border-b">
              <th className="w-10 px-4"><input type="checkbox" checked={view.length > 0 && view.every((p) => sel.includes(p.id))} onChange={(e) => setSel(e.target.checked ? view.map((p) => p.id) : [])} /></th>
              <th className="px-3 py-3 text-left">Post</th>
              <Th k="author">Author</Th><Th k="category">Category</Th>
              <th className="px-3 text-left">Tags</th><Th k="status">Status</Th><Th k="views">Views</Th>
              <Th k="published">Published</Th><Th k="updated">Updated</Th>
              <th className="px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {view.map((p) => (
              <tr key={p.id} className="group border-b transition-colors last:border-0 hover:bg-muted/50">
                <td className="px-4"><input type="checkbox" checked={sel.includes(p.id)} onChange={(e) => setSel(e.target.checked ? [...sel, p.id] : sel.filter((x) => x !== p.id))} /></td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" loading="lazy" className="h-10 w-14 rounded-md object-cover" />
                    <span className="max-w-[240px] font-semibold leading-snug">{p.title}</span>
                  </div>
                </td>
                <td className="px-3 text-muted-foreground">{p.author}</td>
                <td className="px-3">{p.category}</td>
                <td className="px-3"><div className="flex gap-1">{p.tags.map((t) => <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs">#{t}</span>)}</div></td>
                <td className="px-3"><StatusBadge status={p.status} /></td>
                <td className="px-3 tabular-nums">{p.views.toLocaleString()}</td>
                <td className="px-3 text-muted-foreground">{p.published}</td>
                <td className="px-3 text-muted-foreground">{p.updated}</td>
                <td className="px-3">
                  <div className="flex justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                    <IconBtn label="View" onClick={() => toast(p.title)}><Eye /></IconBtn>
                    <IconBtn label="Edit" onClick={() => nav({ to: "/posts/new", search: { id: p.id } })}><Pencil /></IconBtn>
                    <IconBtn label="Duplicate" onClick={() => { blog.duplicate(p.id); toast.success("Duplicated"); }}><Copy /></IconBtn>
                    {p.status === "Published"
                      ? <IconBtn label="Unpublish" onClick={() => blog.setStatus([p.id], "Draft")}><EyeOff /></IconBtn>
                      : <IconBtn label="Publish" onClick={() => { blog.setStatus([p.id], "Published"); toast.success("Published"); }}><Send /></IconBtn>}
                    <IconBtn label="Delete" onClick={() => { blog.remove([p.id]); toast.success("Deleted"); }}><Trash2 className="text-destructive" /></IconBtn>
                  </div>
                </td>
              </tr>
            ))}
            {view.length === 0 && <tr><td colSpan={10} className="py-16 text-center text-muted-foreground">No posts found. <Link to="/posts/new" className="text-primary underline">Write one</Link></td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 text-sm text-muted-foreground">
        <span>{rows.length} posts</span>
        <div className="flex items-center gap-2">
          <button className="btn py-1" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
          <span>{page + 1} / {pages}</span>
          <button className="btn py-1" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button title={label} aria-label={label} onClick={onClick} className="grid size-8 place-items-center rounded-md hover:bg-muted [&_svg]:size-4">{children}</button>;
}
