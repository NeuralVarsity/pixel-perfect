import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

/**
 * Publishable-key client for public reads. RLS still applies: the only rows
 * visible here are the ones anonymous readers are allowed to see.
 */
function anonClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getPublishedBlog = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    const url = new URL(req.url);
    const fwd = url.hostname === "localhost" ? req.headers.get("x-forwarded-host") : null;
    const origin = fwd ? `https://${fwd}` : url.origin;
    const sb = anonClient();
    const { data: b } = await sb
      .from("blogs")
      .select("id, title, slug, cover_url, cover_alt, cover_caption, author_name, published_at, blocks, meta_title, meta_description, word_count, category:categories(name)")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!b) return null;
    return {
      id: b.id, title: b.title, slug: b.slug, cover: b.cover_url, coverAlt: b.cover_alt ?? "", coverCaption: b.cover_caption ?? "",
      author: b.author_name, date: (b.published_at ?? "").slice(0, 10), blocks: JSON.parse(JSON.stringify(b.blocks ?? [])),
      metaTitle: b.meta_title ?? b.title, metaDescription: b.meta_description ?? "", readMinutes: Math.max(1, Math.round(b.word_count / 220)),
      category: (b.category as { name: string } | null)?.name ?? "",
      shareImage: b.cover_url ? `${origin}/api/public/cover/${b.id}` : null,
      origin,
    };
  });

export type PublicPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readMinutes: number;
  cover: string | null;
};

/** Newest published articles, for the public home page. */
export const getPublishedList = createServerFn({ method: "GET" }).handler(async (): Promise<PublicPost[]> => {
  const sb = anonClient();
  const { data, error } = await sb
    .from("blogs")
    .select("id, title, slug, cover_url, author_name, published_at, word_count, meta_description, category:categories(name)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    excerpt: (b.meta_description ?? "").slice(0, 180),
    author: b.author_name || "NeuralVarsity",
    date: (b.published_at ?? "").slice(0, 10),
    category: (b.category as { name: string } | null)?.name ?? "Insights",
    readMinutes: Math.max(1, Math.round(b.word_count / 220)),
    cover: b.cover_url,
  }));
});
