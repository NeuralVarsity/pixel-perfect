import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { PostsTable } from "@/components/PostsTable";

export const Route = createFileRoute("/published")({
  head: () => ({
    meta: [
      { title: "Published Posts — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Everything live on NeuralVarsity.ai." },
      { property: "og:title", content: "Published Posts — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Everything live on NeuralVarsity.ai." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Published Posts" subtitle="Everything live on NeuralVarsity.ai." />
      <PostsTable fixedStatus="Published" />
    </>
  ),
});
