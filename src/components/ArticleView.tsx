import type { Block } from "./BlockEditor";

const ytId = (u: string) => u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)?.[1];

export type ArticleData = {
  title: string; cover: string | null; coverAlt: string; coverCaption: string; author: string;
  date: string; category: string; blocks: Block[]; readMinutes: number;
};

export function ArticleView({ a }: { a: ArticleData }) {
  return (
    <article className="mx-auto max-w-3xl">
      <div className="text-sm font-semibold text-primary">{a.category}</div>
      <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">{a.title}</h1>
      <div className="mt-4 text-sm text-muted-foreground">{a.author} · {a.date} · {a.readMinutes} min read</div>
      {a.cover && (
        <figure className="mt-8">
          <img src={a.cover} alt={a.coverAlt} className="w-full rounded-2xl" />
          {a.coverCaption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{a.coverCaption}</figcaption>}
        </figure>
      )}
      <div className="mt-10 space-y-6 text-[18px] leading-8">
        {a.blocks.map((b) => <BlockOut key={b.id} b={b} />)}
      </div>
    </article>
  );
}

function BlockOut({ b }: { b: Block }) {
  switch (b.type) {
    case "h2": return <h2 className="pt-4 text-3xl font-bold">{b.text}</h2>;
    case "h3": return <h3 className="pt-2 text-2xl font-semibold">{b.text}</h3>;
    case "quote": return <blockquote className="border-l-4 border-primary pl-5 font-display text-2xl italic">{b.text}</blockquote>;
    case "callout": return <div className="rounded-xl bg-primary/10 p-5">{b.text}</div>;
    case "cta": return <div className="bg-brand rounded-xl p-6 font-display text-xl font-bold text-accent-foreground">{b.text}</div>;
    case "button": return <a href={b.extra || "#"} className="btn-primary">{b.text}</a>;
    case "faq": return <details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">{b.text}</summary><p className="mt-2 text-muted-foreground">{b.extra}</p></details>;
    case "code": return <pre className="overflow-x-auto rounded-xl bg-muted p-4 font-mono text-sm leading-6">{b.text}</pre>;
    case "image": return b.text ? <figure><img src={b.text} alt={b.extra ?? ""} className="w-full rounded-xl" />{b.extra && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{b.extra}</figcaption>}</figure> : null;
    case "video": case "embed": {
      const id = ytId(b.text);
      if (id) return <iframe className="aspect-video w-full rounded-xl" src={`https://www.youtube.com/embed/${id}`} title="Video" allowFullScreen />;
      return b.text ? <a href={b.text} target="_blank" rel="noreferrer" className="block rounded-xl border p-4 text-primary">{b.text}</a> : null;
    }
    case "table": {
      const rows = b.text.split("\n").filter(Boolean).map((r) => r.split(","));
      return <div className="overflow-x-auto rounded-xl border"><table className="w-full text-base"><tbody>{rows.map((r, i) => <tr key={i} className={i === 0 ? "bg-muted font-semibold" : "border-t"}>{r.map((c, j) => <td key={j} className="px-3 py-2">{c.trim()}</td>)}</tr>)}</tbody></table></div>;
    }
    default: return b.text ? <p className="whitespace-pre-wrap">{b.text}</p> : null;
  }
}
