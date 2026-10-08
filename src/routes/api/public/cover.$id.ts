import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Permanent share image for published articles: re-signs the private cover on every request.
export const Route = createFileRoute("/api/public/cover/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = z.string().uuid().safeParse(params.id);
        if (!id.success) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: b } = await supabaseAdmin.from("blogs").select("cover_url, status").eq("id", id.data).maybeSingle();
        if (!b || b.status !== "published" || !b.cover_url) return new Response("Not found", { status: 404 });
        const m = b.cover_url.match(/\/storage\/v1\/object\/(?:sign|public)\/(blog-images|media-library|author-images)\/([^?]+)/);
        if (!m) {
          if (b.cover_url.startsWith("https://")) return Response.redirect(b.cover_url, 302);
          return new Response("Not found", { status: 404 });
        }
        const { data: file, error } = await supabaseAdmin.storage.from(m[1]).download(decodeURIComponent(m[2]));
        if (error || !file) return new Response("Not found", { status: 404 });
        return new Response(file, {
          headers: { "Content-Type": file.type || "image/jpeg", "Cache-Control": "public, max-age=86400, s-maxage=604800" },
        });
      },
    },
  },
});
