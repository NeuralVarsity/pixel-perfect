import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ImagePlus, Sparkles, X, Crop, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateCover } from "@/lib/image.functions";
import { cn } from "@/lib/utils";

export const presets = [
  { label: "Blog Cover", w: 1600, h: 900 },
  { label: "Instagram", w: 1080, h: 1080 },
  { label: "LinkedIn", w: 1200, h: 627 },
  { label: "Twitter/X", w: 1600, h: 900 },
  { label: "YouTube", w: 1280, h: 720 },
];

export type ImageMeta = { src: string | null; alt: string; caption: string };

export function FeaturedImage({ value, onChange, title }: { value: ImageMeta; onChange: (v: ImageMeta) => void; title: string }) {
  const gen = useServerFn(generateCover);
  const [drag, setDrag] = useState(false);
  const [preset, setPreset] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [quality, setQuality] = useState(82);
  const [cropping, setCropping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState("");
  const p = presets[preset]!;

  const load = (file?: File) => {
    if (!file) return;
    if (!/image\/(jpeg|png|webp)/.test(file.type)) { toast.error("Use JPG, PNG or WEBP"); return; }
    const r = new FileReader(); r.onload = () => onChange({ ...value, src: r.result as string }); r.readAsDataURL(file);
  };

  const applyCrop = () => {
    if (!value.src) return;
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = p.w; c.height = p.h;
      const ctx = c.getContext("2d")!;
      const scale = Math.max(p.w / img.width, p.h / img.height) * zoom;
      const dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, (p.w - dw) * (x / 100), (p.h - dh) * (y / 100), dw, dh);
      const out = c.toDataURL("image/webp", quality / 100);
      onChange({ ...value, src: out });
      setCropping(false); setZoom(1);
      toast.success(`Resized to ${p.w}×${p.h} · ${Math.round((out.length * 0.75) / 1024)} KB`);
    };
    img.onerror = () => toast.error("Couldn't process this image");
    img.src = value.src;
  };

  const ai = async () => {
    const q = prompt || title;
    if (!q) { toast.error("Describe the image first"); return; }
    setBusy(true);
    try { const r = await gen({ data: { prompt: q } }); if (r.error) toast.error(r.error); else onChange({ ...value, src: r.url }); }
    catch { toast.error("Image generation failed"); }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {presets.map((pr, i) => <button key={pr.label} onClick={() => setPreset(i)} className={cn("rounded-full border px-2 py-0.5 text-[11px] transition-colors hover:border-primary/60", i === preset && "border-primary bg-primary/10 text-primary")}>{pr.label}</button>)}
      </div>
      {value.src ? (
        <div className="group relative overflow-hidden rounded-xl bg-muted shadow-lg ring-1 ring-border animate-in fade-in zoom-in-95 duration-300" style={{ aspectRatio: `${p.w}/${p.h}` }}>
          <img src={value.src} alt={value.alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" style={{ transform: cropping ? `scale(${zoom})` : undefined, objectPosition: cropping ? `${x}% ${y}%` : undefined }} />
          {!cropping && (
            <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-2 bg-background/70 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
              <button className="btn bg-background" onClick={() => setCropping(true)}><Crop className="size-4" />Crop</button>
              <label className="btn cursor-pointer bg-background">Replace<input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => load(e.target.files?.[0])} /></label>
              <button className="btn bg-background" aria-label="Remove image" onClick={() => onChange({ ...value, src: null })}><X className="size-4" /></button>
            </div>
          )}
        </div>
      ) : (
        <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files[0]); }}
          className={cn("group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed border-border bg-gradient-to-b from-primary/5 to-transparent px-4 text-center transition-all duration-300 hover:border-primary/60 hover:from-primary/10 focus-within:ring-2 focus-within:ring-ring", drag && "scale-[1.01] border-primary from-primary/15")}
          style={{ aspectRatio: `${p.w}/${p.h}` }}>
          <span className={cn("relative grid size-14 place-items-center rounded-2xl border border-primary/25 bg-background/60 text-primary shadow-sm transition-transform duration-300 group-hover:-translate-y-1", drag && "-translate-y-1")}>
            <ImagePlus className="size-6" />
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">+</span>
          </span>
          <span className="text-sm font-medium text-foreground">{drag ? "Drop to upload" : <>Drag an image here or <span className="text-primary">browse</span></>}</span>
          <span className="text-xs text-muted-foreground">JPG, PNG or WEBP · best at {p.w}×{p.h}</span>
          <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={(e) => load(e.target.files?.[0])} />
        </label>
      )}
      {cropping && (
        <div className="space-y-2 rounded-xl border p-3 text-xs animate-in fade-in">
          <Slider label="Zoom" value={zoom * 100} min={100} max={300} onChange={(v) => setZoom(v / 100)} />
          <Slider label="Horizontal" value={x} min={0} max={100} onChange={setX} />
          <Slider label="Vertical" value={y} min={0} max={100} onChange={setY} />
          <Slider label={`Compression quality ${quality}%`} value={quality} min={40} max={100} onChange={setQuality} />
          <div className="flex gap-2"><button className="btn-primary py-1" onClick={applyCrop}>Apply {p.w}×{p.h}</button><button className="btn py-1" onClick={() => setCropping(false)}>Cancel</button></div>
        </div>
      )}
      <div className="flex gap-2">
        <input className="field text-xs" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe an AI cover image…" />
        <button className="btn-primary shrink-0 px-3" onClick={ai} disabled={busy} aria-label="Generate image">{busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}</button>
      </div>
      <input className="field text-xs" placeholder="Alt text (for accessibility & SEO)" value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
      <input className="field text-xs" placeholder="Caption" value={value.caption} onChange={(e) => onChange({ ...value, caption: e.target.value })} />
    </div>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return <label className="block"><span className="text-muted-foreground">{label}</span><input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" /></label>;
}
