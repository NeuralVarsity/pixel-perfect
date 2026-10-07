
create type public.app_role as enum ('super_admin','admin','editor','author');
create type public.blog_status as enum ('draft','review','approved','scheduled','published');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.has_any_role(_user_id uuid, _roles public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = any(_roles))
$$;

create policy "Signed-in users can see roles" on public.user_roles for select to authenticated using (true);
create policy "Admins grant roles" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(),'super_admin') or (public.has_role(auth.uid(),'admin') and role <> 'super_admin'));
create policy "Admins revoke roles" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(),'super_admin') or (public.has_role(auth.uid(),'admin') and role <> 'super_admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles readable by staff" on public.profiles for select to authenticated using (true);
create policy "Update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);
grant select on public.categories, public.tags to anon;
grant select, insert, update, delete on public.categories, public.tags to authenticated;
grant all on public.categories, public.tags to service_role;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
create policy "Categories readable" on public.categories for select to anon, authenticated using (true);
create policy "Staff insert categories" on public.categories for insert to authenticated
  with check (public.has_any_role(auth.uid(), array['super_admin','admin','editor']::public.app_role[]));
create policy "Staff update categories" on public.categories for update to authenticated
  using (public.has_any_role(auth.uid(), array['super_admin','admin','editor']::public.app_role[]));
create policy "Staff delete categories" on public.categories for delete to authenticated
  using (public.has_any_role(auth.uid(), array['super_admin','admin']::public.app_role[]));
create policy "Tags readable" on public.tags for select to anon, authenticated using (true);
create policy "Signed-in add tags" on public.tags for insert to authenticated with check (length(name) between 1 and 40);
create policy "Staff delete tags" on public.tags for delete to authenticated
  using (public.has_any_role(auth.uid(), array['super_admin','admin','editor']::public.app_role[]));

create table public.blogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  author_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  status public.blog_status not null default 'draft',
  blocks jsonb not null default '[]'::jsonb,
  cover_url text,
  cover_alt text,
  cover_caption text,
  meta_title text,
  meta_description text,
  focus_keyword text,
  word_count int not null default 0,
  publish_at timestamptz,
  published_at timestamptz,
  ai_assisted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blogs_status_idx on public.blogs(status);
create index blogs_author_idx on public.blogs(author_id);
create index blogs_updated_idx on public.blogs(updated_at desc);
grant select on public.blogs to anon;
grant select, insert, update, delete on public.blogs to authenticated;
grant all on public.blogs to service_role;
alter table public.blogs enable row level security;
create policy "Public reads published" on public.blogs for select to anon using (status = 'published');
create policy "Staff read all blogs" on public.blogs for select to authenticated using (true);
create policy "Create own blogs" on public.blogs for insert to authenticated with check (author_id = auth.uid());
create policy "Edit own or as editor" on public.blogs for update to authenticated
  using (author_id = auth.uid() or public.has_any_role(auth.uid(), array['super_admin','admin','editor']::public.app_role[]))
  with check (author_id = auth.uid() or public.has_any_role(auth.uid(), array['super_admin','admin','editor']::public.app_role[]));
create policy "Delete own or as admin" on public.blogs for delete to authenticated
  using (author_id = auth.uid() or public.has_any_role(auth.uid(), array['super_admin','admin']::public.app_role[]));

create table public.blog_tags (
  blog_id uuid not null references public.blogs(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (blog_id, tag_id)
);
create index blog_tags_tag_idx on public.blog_tags(tag_id);
grant select on public.blog_tags to anon;
grant select, insert, delete on public.blog_tags to authenticated;
grant all on public.blog_tags to service_role;
alter table public.blog_tags enable row level security;
create policy "Blog tags readable" on public.blog_tags for select to anon, authenticated using (true);
create policy "Blog editors add tags" on public.blog_tags for insert to authenticated
  with check (exists (select 1 from public.blogs b where b.id = blog_id and (b.author_id = auth.uid() or public.has_any_role(auth.uid(), array['super_admin','admin','editor']::public.app_role[]))));
create policy "Blog editors remove tags" on public.blog_tags for delete to authenticated
  using (exists (select 1 from public.blogs b where b.id = blog_id and (b.author_id = auth.uid() or public.has_any_role(auth.uid(), array['super_admin','admin','editor']::public.app_role[]))));

create table public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null default 'media-library',
  path text not null,
  url text not null,
  name text not null,
  folder text not null default 'General',
  mime_type text,
  size_bytes bigint,
  alt text,
  created_at timestamptz not null default now()
);
create index media_created_idx on public.media(created_at desc);
grant select, insert, update, delete on public.media to authenticated;
grant all on public.media to service_role;
alter table public.media enable row level security;
create policy "Staff read media" on public.media for select to authenticated using (true);
create policy "Upload own media" on public.media for insert to authenticated with check (owner_id = auth.uid());
create policy "Edit own media or admin" on public.media for update to authenticated
  using (owner_id = auth.uid() or public.has_any_role(auth.uid(), array['super_admin','admin']::public.app_role[]));
create policy "Delete own media or admin" on public.media for delete to authenticated
  using (owner_id = auth.uid() or public.has_any_role(auth.uid(), array['super_admin','admin']::public.app_role[]));

create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid not null references public.blogs(id) on delete cascade,
  visitor_id text not null,
  referrer text,
  read_seconds int not null default 0,
  created_at timestamptz not null default now()
);
create index page_views_blog_idx on public.page_views(blog_id);
create index page_views_created_idx on public.page_views(created_at desc);
grant insert on public.page_views to anon;
grant select, insert on public.page_views to authenticated;
grant all on public.page_views to service_role;
alter table public.page_views enable row level security;
create policy "Anyone records views of published posts" on public.page_views for insert to anon, authenticated
  with check (exists (select 1 from public.blogs b where b.id = blog_id and b.status = 'published') and read_seconds between 0 and 7200 and length(visitor_id) <= 64);
create policy "Staff read views" on public.page_views for select to authenticated using (true);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null default 'blog',
  entity_id uuid,
  details text,
  created_at timestamptz not null default now()
);
create index activity_created_idx on public.activity_logs(created_at desc);
grant select, insert on public.activity_logs to authenticated;
grant all on public.activity_logs to service_role;
alter table public.activity_logs enable row level security;
create policy "Staff read activity" on public.activity_logs for select to authenticated using (true);
create policy "Log own actions" on public.activity_logs for insert to authenticated with check (actor_id = auth.uid());

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Create own notifications" on public.notifications for insert to authenticated with check (user_id = auth.uid());
create policy "Update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "Delete own notifications" on public.notifications for delete to authenticated using (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare first_user boolean;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)), new.email);
  select not exists (select 1 from public.user_roles) into first_user;
  insert into public.user_roles (user_id, role) values (new.id, case when first_user then 'super_admin'::public.app_role else 'author'::public.app_role end);
  insert into public.notifications (user_id, title, body, link)
    select ur.user_id, 'New user joined', coalesce(new.email,'') || ' signed up', '/users'
    from public.user_roles ur where ur.role in ('super_admin','admin') and ur.user_id <> new.id;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.blog_lifecycle()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    insert into public.activity_logs (actor_id, action, entity_id, details) values (auth.uid(), 'Blog deleted', old.id, old.title);
    return old;
  end if;
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  return new;
end $$;

create or replace function public.blog_after_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_logs (actor_id, action, entity_id, details) values (auth.uid(), 'Blog created', new.id, new.title);
  elsif new.status is distinct from old.status then
    insert into public.activity_logs (actor_id, action, entity_id, details) values (auth.uid(), 'Status changed to ' || new.status, new.id, new.title);
  else
    insert into public.activity_logs (actor_id, action, entity_id, details) values (auth.uid(), 'Blog updated', new.id, new.title);
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    insert into public.notifications (user_id, title, body, link) values (new.author_id, 'Blog published', new.title, '/blog/' || new.slug);
  end if;
  if new.status = 'review' and (tg_op = 'INSERT' or old.status <> 'review') then
    insert into public.notifications (user_id, title, body, link)
      select distinct ur.user_id, 'Review required', new.title, '/posts/new?id=' || new.id
      from public.user_roles ur where ur.role in ('super_admin','admin','editor') and ur.user_id <> new.author_id;
  end if;
  return new;
end $$;
create trigger blogs_before_write before insert or update on public.blogs for each row execute function public.blog_lifecycle();
create trigger blogs_after_write after insert or update on public.blogs for each row execute function public.blog_after_write();
create trigger blogs_after_delete after delete on public.blogs for each row execute function public.blog_lifecycle();

create or replace function public.publish_due_posts()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.blogs set status = 'published' where status = 'scheduled' and publish_at is not null and publish_at <= now();
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.publish_due_posts() from anon, public;
grant execute on function public.publish_due_posts() to authenticated;

create policy "Staff read cms images" on storage.objects for select to authenticated using (bucket_id in ('blog-images','media-library','author-images'));
create policy "Signed-in upload cms images" on storage.objects for insert to authenticated with check (bucket_id in ('blog-images','media-library','author-images') and owner = auth.uid());
create policy "Owners update cms images" on storage.objects for update to authenticated using (bucket_id in ('blog-images','media-library','author-images') and owner = auth.uid());
create policy "Owners or admins delete cms images" on storage.objects for delete to authenticated
  using (bucket_id in ('blog-images','media-library','author-images') and (owner = auth.uid() or public.has_any_role(auth.uid(), array['super_admin','admin']::public.app_role[])));
