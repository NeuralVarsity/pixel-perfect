export function friendlyError(error: unknown): string {
  const msg = (error as { message?: string })?.message ?? String(error ?? "");
  if (typeof navigator !== "undefined" && !navigator.onLine) return "You're offline. We'll retry when your connection returns.";
  if (/failed to fetch|network|load failed/i.test(msg)) return "Network problem — please check your connection and try again.";
  if (/jwt|expired|unauthorized|refresh token/i.test(msg)) return "Your session expired. Please sign in again.";
  if (/row-level security|permission denied|42501/i.test(msg)) return "You don't have permission to do that.";
  if (/payload too large|exceeded the maximum|413/i.test(msg)) return "That file is too large. Please use a smaller image.";
  if (/duplicate key|23505/i.test(msg)) return "That already exists — try a different name or slug.";
  return msg || "Something went wrong. Please try again.";
}
