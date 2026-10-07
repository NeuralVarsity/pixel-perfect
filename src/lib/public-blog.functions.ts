import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export const getPublishedBlog = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
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
    };
  });
