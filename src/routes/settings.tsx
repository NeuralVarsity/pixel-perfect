import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Configure the NeuralVarsity.ai blog." },
      { property: "og:title", content: "Settings — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Configure the NeuralVarsity.ai blog." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Blog-wide defaults." />
      <form className="glass max-w-2xl space-y-5 rounded-2xl p-6" onSubmit={(e) => { e.preventDefault(); toast.success("Settings saved"); }}>
        {[["Blog name", "NeuralVarsity.ai Blog"], ["Base URL", "https://neuralvarsity.ai/blog"], ["Posts per page", "10"], ["Default meta description", "Learn AI, ML and data science with NeuralVarsity."]].map(([l, v]) => (
          <label key={l} className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">{l}</span><input className="field" defaultValue={v} /></label>
        ))}
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" defaultChecked />Allow comments on new posts</label>
        <button className="btn-primary">Save changes</button>
      </form>
    </>
  );
}
