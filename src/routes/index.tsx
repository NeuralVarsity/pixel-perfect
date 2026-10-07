import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeuralVarsity.ai Blog Studio" },
      { name: "description", content: "Write, manage and publish NeuralVarsity.ai articles." },
      { property: "og:title", content: "NeuralVarsity.ai Blog Studio" },
      { property: "og:description", content: "Write, manage and publish NeuralVarsity.ai articles." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
