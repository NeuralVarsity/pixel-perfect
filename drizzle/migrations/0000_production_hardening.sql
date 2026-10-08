-- Tighten reads: authors only see their own sensitive rows
drop policy if exists "Profiles readable by staff" on public.profiles;
create policy "Read own profile or as editor" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_any_role(auth.uid(), array['super_admin','admin','editor']::public.app_role[]));

drop policy if exists "Signed-in users can see roles" on public.user_roles;
create policy "Read own roles or as admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_any_role(auth.uid(), array['super_admin','admin']::public.app_role[]));

drop policy if exists "Staff read activity" on public.activity_logs;
create policy "Read own activity or as editor" on public.activity_logs for select to authenticated
  using (actor_id = auth.uid() or public.has_any_role(auth.uid(), array['super_admin','admin','editor']::public.app_role[]));

drop policy if exists "Staff read views" on public.page_views;
create policy "Read views of own posts or as editor" on public.page_views for select to authenticated
  using (public.has_any_role(auth.uid(), array['super_admin','admin','editor']::public.app_role[])
    or exists (select 1 from public.blogs b where b.id = page_views.blog_id and b.author_id = auth.uid()));

-- Trigger functions should never be called directly
revoke execute on function public.blog_after_write() from public, anon, authenticated;
revoke execute on function public.blog_lifecycle() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.publish_due_posts() from public, anon;

-- Missing indexes
create index if not exists media_owner_idx on public.media (owner_id);
create index if not exists blogs_category_idx on public.blogs (category_id);
create index if not exists activity_actor_idx on public.activity_logs (actor_id);
create index if not exists blogs_scheduled_idx on public.blogs (publish_at) where status = 'scheduled';
create index if not exists page_views_blog_created_idx on public.page_views (blog_id, created_at desc);