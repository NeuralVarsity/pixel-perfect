import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader } from "@/components/AppShell";
import { useProfiles } from "@/lib/blog-store";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({
    meta: [
      { title: "Activity Log — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Audit history of every change in the Blog Studio." },
      { property: "og:title", content: "Activity Log — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Audit history of every change in the Blog Studio." },
    ],
  }),
  component: Page,
});

function Page() {
  const people = useProfiles();
  const { data = [] } = useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const who = (id: string | null) => { const p = people.find((x) => x.id === id); return p?.full_name || p?.email || "System"; };
  return (
    <>
      <PageHeader title="Activity Log" subtitle="The latest 200 changes." />
      {data.length === 0 ? <EmptyState title="No activity yet" /> : (
        <ol className="glass divide-y rounded-2xl">
          {data.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <span className="bg-brand size-2 rounded-full" />
              <span className="font-medium">{who(a.actor_id)}</span>
              <span className="text-muted-foreground">{a.action}</span>
              {a.details && <span className="truncate">“{a.details}”</span>}
              <span className="ml-auto text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
