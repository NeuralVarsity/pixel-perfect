import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { setQueryClient } from "./lib/blog-store";
import { friendlyError } from "./lib/friendly-error";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 2, retryDelay: (n) => Math.min(1000 * 2 ** n, 8000) } },
    queryCache: new QueryCache({
      onError: (error) => {
        if (typeof window === "undefined") return;
        void import("sonner").then(({ toast }) => toast.error(friendlyError(error), { id: "load-error" }));
      },
    }),
  });
  setQueryClient(queryClient);

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
