import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPublishedBlog } from "@/lib/public-blog.functions";
import { ArticleView } from "@/components/ArticleView";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPublishedBlog({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Not found — NeuralVarsity.ai" }, { name: "robots", content: "noindex" }] };
    const meta = [
      { title: `${loaderData.metaTitle} — NeuralVarsity.ai` },
      { name: "description", content: loaderData.metaDescription },
      { property: "og:title", content: loaderData.metaTitle },
      { property: "og:description", content: loaderData.metaDescription },
      { property: "og:type", content: "article" },
    ];
    return { meta };
  },
  notFoundComponent: () => <div className="grid min-h-screen place-items-center text-muted-foreground">This article isn't published.</div>,
  errorComponent: () => <div className="grid min-h-screen place-items-center text-muted-foreground">This article couldn't load.</div>,
  component: Page,
});

function Page() {
  const post = Route.useLoaderData();
  useEffect(() => {
    let vid = localStorage.getItem("nv-visitor");
    if (!vid) { vid = crypto.randomUUID(); localStorage.setItem("nv-visitor", vid); }
    const start = Date.now();
    let sent = false;
    const send = () => {
      if (sent) return; sent = true;
      void supabase.from("page_views").insert({ blog_id: post.id, visitor_id: vid!, referrer: document.referrer.slice(0, 300) || null, read_seconds: Math.min(7200, Math.round((Date.now() - start) / 1000)) });
    };
    const onHide = () => { if (document.visibilityState === "hidden") send(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", send);
    return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", send); send(); };
  }, [post.id]);
  return <div className="px-4 py-16"><ArticleView a={post} /></div>;
}
