import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { invalidate, roleLabel, useMe, useProfiles, type Role } from "@/lib/blog-store";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Manage who can write, edit and publish on NeuralVarsity.ai." },
      { property: "og:title", content: "Users & Roles — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Manage who can write, edit and publish on NeuralVarsity.ai." },
    ],
  }),
  component: Page,
});

const roles: Role[] = ["super_admin", "admin", "editor", "author"];

function Page() {
  const me = useMe();
  const people = useProfiles();
  const canManage = me?.can("super_admin", "admin");
  const isSuper = me?.can("super_admin");

  const setRole = async (userId: string, current: Role[], role: Role) => {
    const { error: e1 } = await supabase.from("user_roles").delete().eq("user_id", userId).in("role", current);
    if (e1) { toast.error(e1.message); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) toast.error(error.message); else { toast.success("Role updated"); invalidate("profiles", "me"); }
  };

  return (
    <>
      <PageHeader title="Users & Roles" subtitle={canManage ? "Change what each person can do." : "Only admins can change roles."} />
      <div className="glass divide-y rounded-2xl">
        {people.map((p) => {
          const current = p.roles[0] ?? "author";
          const locked = !canManage || p.id === me?.id || (!isSuper && current === "super_admin");
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1"><div className="font-medium">{p.full_name || p.email}</div><div className="text-xs text-muted-foreground">{p.email}</div></div>
              <select className="field w-44" value={current} disabled={locked} onChange={(e) => setRole(p.id, p.roles, e.target.value as Role)}>
                {roles.filter((r) => isSuper || r !== "super_admin" || current === "super_admin").map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        <p><b className="text-foreground">Super Admin</b> — full access.</p>
        <p><b className="text-foreground">Admin</b> — manage all blogs, users, categories and media.</p>
        <p><b className="text-foreground">Editor</b> — create, edit and review any blog.</p>
        <p><b className="text-foreground">Author</b> — create blogs and edit their own.</p>
      </div>
    </>
  );
}
