create extension if not exists pg_cron;

-- Scheduled publishing: per-post, logged, failures retried next run
create or replace function public.publish_due_posts()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n int := 0; r record;
begin
  for r in select id, title from public.blogs where status = 'scheduled' and publish_at is not null and publish_at <= now() for update skip locked loop
    begin
      update public.blogs set status = 'published' where id = r.id;
      insert into public.activity_logs (actor_id, action, entity_id, details) values (null, 'Scheduled publish', r.id, r.title);
      n := n + 1;
    exception when others then
      insert into public.activity_logs (actor_id, action, entity_id, details) values (null, 'Scheduled publish failed (will retry)', r.id, left(sqlerrm, 300));
    end;
  end loop;
  return n;
end $$;
revoke execute on function public.publish_due_posts() from public, anon;

-- Safe user deletion: accounts with content can't be hard-deleted
alter table public.blogs drop constraint blogs_author_id_fkey;
alter table public.blogs add constraint blogs_author_id_fkey foreign key (author_id) references auth.users(id) on delete restrict;
alter table public.media drop constraint media_owner_id_fkey;
alter table public.media add constraint media_owner_id_fkey foreign key (owner_id) references auth.users(id) on delete restrict;

alter table public.profiles add column if not exists deactivated_at timestamptz;

create or replace function public.guard_profile_deactivation()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.deactivated_at is distinct from old.deactivated_at
     and not public.has_any_role(auth.uid(), array['super_admin','admin']::public.app_role[]) then
    raise exception 'Only admins can deactivate or reactivate users';
  end if;
  if new.id <> auth.uid() and (new.full_name, new.bio, new.avatar_url, new.email) is distinct from (old.full_name, old.bio, old.avatar_url, old.email) then
    raise exception 'You can only edit your own profile details';
  end if;
  return new;
end $$;
revoke execute on function public.guard_profile_deactivation() from public, anon, authenticated;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile_deactivation();

create policy "Admins update profiles" on public.profiles for update to authenticated
  using (public.has_any_role(auth.uid(), array['super_admin','admin']::public.app_role[]))
  with check (public.has_any_role(auth.uid(), array['super_admin','admin']::public.app_role[]));

-- Only people with a role (active staff) can read internal content
drop policy if exists "Staff read all blogs" on public.blogs;
create policy "Staff read all blogs" on public.blogs for select to authenticated
  using (public.has_any_role(auth.uid(), array['super_admin','admin','editor','author']::public.app_role[]) or author_id = auth.uid());
drop policy if exists "Staff read media" on public.media;
create policy "Staff read media" on public.media for select to authenticated
  using (public.has_any_role(auth.uid(), array['super_admin','admin','editor','author']::public.app_role[]));
drop policy if exists "Create own blogs" on public.blogs;
create policy "Create own blogs" on public.blogs for insert to authenticated
  with check (author_id = auth.uid() and public.has_any_role(auth.uid(), array['super_admin','admin','editor','author']::public.app_role[]));