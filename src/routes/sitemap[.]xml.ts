import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Built from whatever domain serves the request, so it works once a custom domain is connected.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
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
        const rows: { slug: string; updated_at: string }[] = [];
        for (let from = 0; ; from += 1000) {
          const { data, error } = await sb.from("blogs").select("slug, updated_at").eq("status", "published").order("published_at", { ascending: false }).range(from, from + 999);
          if (error) return new Response("Sitemap unavailable", { status: 503 });
          rows.push(...(data ?? []));
          if (!data || data.length < 1000) break;
        }
        const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows
          .map((r) => `  <url><loc>${esc(`${origin}/blog/${r.slug}`)}</loc><lastmod>${r.updated_at.slice(0, 10)}</lastmod></url>`)
          .join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
