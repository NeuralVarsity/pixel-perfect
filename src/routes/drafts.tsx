import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { PostsTable } from "@/components/PostsTable";

export const Route = createFileRoute("/drafts")({
  head: () => ({
    meta: [
      { title: "Drafts — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Unfinished posts waiting for your next edit." },
      { property: "og:title", content: "Drafts — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Unfinished posts waiting for your next edit." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Drafts" subtitle="Unfinished posts waiting for your next edit." />
      <PostsTable fixedStatus="Draft" />
    </>
  ),
});
