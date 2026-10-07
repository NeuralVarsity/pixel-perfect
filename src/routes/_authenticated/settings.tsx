import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { invalidate, uploadImage } from "@/lib/blog-store";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Manage your Blog Studio profile." },
      { property: "og:title", content: "Settings — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Manage your Blog Studio profile." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user!.id).single();
      return data;
    },
  });
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  useEffect(() => { if (profile) { setName(profile.full_name); setBio(profile.bio ?? ""); setAvatar(profile.avatar_url); } }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ full_name: name, bio, avatar_url: avatar, updated_at: new Date().toISOString() }).eq("id", profile.id);
    if (error) toast.error(error.message); else { toast.success("Profile saved"); invalidate("me", "profiles", "my-profile"); }
  };
  const pick = async (f?: File) => {
    if (!f) return;
    try { const { url } = await uploadImage("author-images", f, "avatar"); setAvatar(url); } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your author profile." />
      <form className="glass max-w-2xl space-y-5 rounded-2xl p-6" onSubmit={save}>
        <div className="flex items-center gap-4">
          {avatar ? <img src={avatar} alt="" className="size-16 rounded-full object-cover" /> : <div className="bg-brand size-16 rounded-full" />}
          <label className="btn cursor-pointer">Change photo<input type="file" hidden accept="image/*" onChange={(e) => pick(e.target.files?.[0])} /></label>
        </div>
        <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Full name</span><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Email</span><input className="field opacity-60" value={profile?.email ?? ""} disabled /></label>
        <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Bio</span><textarea className="field min-h-24" value={bio} onChange={(e) => setBio(e.target.value)} /></label>
        <button className="btn-primary">Save profile</button>
      </form>
    </>
  );
}
