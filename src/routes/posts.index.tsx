import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { PostsTable } from "@/components/PostsTable";

export const Route = createFileRoute("/posts/")({
  head: () => ({
    meta: [
      { title: "Blog Posts — NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Search, filter, publish and manage every NeuralVarsity.ai article." },
      { property: "og:title", content: "Blog Posts — NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Search, filter, publish and manage every NeuralVarsity.ai article." },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Blog Posts" subtitle="Manage, publish and organize every article." action={<Link to="/posts/new" className="btn-primary"><Plus className="size-4" />New post</Link>} />
      <PostsTable />
    </>
  ),
});
