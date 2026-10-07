import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { PostsTable } from "@/components/PostsTable";

export const Route = createFileRoute("/_authenticated/scheduled")({
  head: () => ({
    meta: [
      { title: "Scheduled Posts — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Posts queued to go live automatically." },
      { property: "og:title", content: "Scheduled Posts — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Posts queued to go live automatically." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Scheduled Posts" subtitle="Posts queued to go live automatically." />
      <PostsTable fixedStatus="Scheduled" />
    </>
  ),
});
