import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { usePosts } from "@/lib/blog-store";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Library — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "All images used across NeuralVarsity.ai posts." },
      { property: "og:title", content: "Media Library — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "All images used across NeuralVarsity.ai posts." },
    ],
  }),
  component: Page,
});

function Page() {
  const posts = usePosts();
  const [uploads, setUploads] = useState<string[]>([]);
  const images = [...uploads, ...Array.from(new Set(posts.map((p) => p.image).filter(Boolean)))];
  return (
    <>
      <PageHeader title="Media Library" subtitle={`${images.length} files`} action={
        <label className="btn-primary cursor-pointer"><Upload className="size-4" />Upload
          <input type="file" hidden multiple accept="image/*" onChange={(e) => Array.from(e.target.files ?? []).forEach((f) => { const r = new FileReader(); r.onload = () => setUploads((u) => [r.result as string, ...u]); r.readAsDataURL(f); })} />
        </label>} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {images.map((src, i) => <img key={i} src={src} alt="" loading="lazy" className="glass aspect-video w-full rounded-xl object-cover p-1 transition-transform hover:scale-[1.02]" />)}
      </div>
    </>
  );
}
