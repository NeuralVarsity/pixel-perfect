<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Published-article share images go through /api/public/cover/$id, which streams the private cover only for published posts — storage buckets stay private and links never expire.
- Users are soft-deleted (profiles.deactivated_at + roles removed); blogs/media FKs to auth.users are ON DELETE RESTRICT so content is never lost.
- Scheduled posts are published by a once-a-minute pg_cron job calling publish_due_posts(), which logs each publish and retries failures next run.
