import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const generateCover = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ prompt: z.string().min(3).max(500) }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { url: "", error: "AI is not available right now." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [{ role: "user", content: `Editorial blog cover image, wide 16:9, no text: ${data.prompt}` }],
      }),
    });
    if (res.status === 429) return { url: "", error: "Too many requests — try again shortly." };
    if (res.status === 402) return { url: "", error: "AI credits are used up." };
    if (!res.ok) return { url: "", error: "Image generation failed." };
    const j = (await res.json()) as { choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[] };
    const url = j.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? "";
    return { url, error: url ? null : "No image returned." };
  });
