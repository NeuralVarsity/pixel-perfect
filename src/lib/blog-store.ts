import { QueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Block } from "@/components/BlockEditor";

export type Status = "Draft" | "Review" | "Approved" | "Scheduled" | "Published";
export const statusList: Status[] = ["Draft", "Review", "Approved", "Scheduled", "Published"];
type DbStatus = "draft" | "review" | "approved" | "scheduled" | "published";
export const toDb = (s: Status) => s.toLowerCase() as DbStatus;
const fromDb = (s: string) => (s.charAt(0).toUpperCase() + s.slice(1)) as Status;

export type Post = {
  id: string;
  title: string;
  slug: string;
  image: string;
  author: string;
  authorId: string;
  category: string;
  categoryId: string | null;
  tags: string[];
  status: Status;
  views: number;
  published: string;
  updated: string;
  publishAt: string | null;
  blocks: Block[];
  metaTitle: string;
  metaDescription: string;
  keyword: string;
  coverAlt: string;
  coverCaption: string;
  wordCount: number;
  aiAssisted: boolean;
};

let qc: QueryClient | null = null;
export const setQueryClient = (c: QueryClient) => { qc = c; };
export const invalidate = (...keys: string[]) => keys.forEach((k) => qc?.invalidateQueries({ queryKey: [k] }));

const day = (d: string | null) => (d ? d.slice(0, 10) : "—");

export type PageView = { blog_id: string; visitor_id: string; read_seconds: number; created_at: string; referrer: string | null };

export async function fetchPageViews(): Promise<PageView[]> {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString();
  const { data, error } = await supabase.from("page_views").select("blog_id, visitor_id, read_seconds, created_at, referrer").gte("created_at", since).order("created_at", { ascending: false }).limit(20000);
  if (error) throw error;
  return data ?? [];
}
export function usePageViews() {
  return useQuery({ queryKey: ["page_views"], queryFn: fetchPageViews }).data ?? [];
}

async function fetchPosts(): Promise<Post[]> {
  await supabase.rpc("publish_due_posts");
  const [{ data, error }, { data: views }] = await Promise.all([
    supabase.from("blogs").select("*, category:categories(name), blog_tags(tag:tags(name))").order("updated_at", { ascending: false }),
    supabase.from("page_views").select("blog_id").limit(50000),
  ]);
  if (error) throw error;
  const counts = new Map<string, number>();
  (views ?? []).forEach((v) => counts.set(v.blog_id, (counts.get(v.blog_id) ?? 0) + 1));
  return (data ?? []).map((b) => mapPost(b as unknown as RawBlog, counts.get(b.id) ?? 0));
}

type RawBlog = {
  id: string; title: string; slug: string; cover_url: string | null; author_name: string; author_id: string;
  category: { name: string } | null; category_id: string | null; blog_tags: { tag: { name: string } | null }[];
  status: string; published_at: string | null; updated_at: string; publish_at: string | null; blocks: unknown;
  meta_title: string | null; meta_description: string | null; focus_keyword: string | null; cover_alt: string | null;
  cover_caption: string | null; word_count: number; ai_assisted: boolean;
};
export function mapPost(b: RawBlog, views = 0): Post {
  return {
    id: b.id, title: b.title, slug: b.slug, image: b.cover_url ?? "", author: b.author_name || "Unknown", authorId: b.author_id,
    category: b.category?.name ?? "Uncategorized", categoryId: b.category_id,
    tags: (b.blog_tags ?? []).map((t) => t.tag?.name).filter((x): x is string => !!x),
    status: fromDb(b.status), views, published: day(b.published_at ?? b.publish_at), updated: day(b.updated_at),
    publishAt: b.publish_at, blocks: Array.isArray(b.blocks) ? (b.blocks as Block[]) : [],
    metaTitle: b.meta_title ?? "", metaDescription: b.meta_description ?? "", keyword: b.focus_keyword ?? "",
    coverAlt: b.cover_alt ?? "", coverCaption: b.cover_caption ?? "", wordCount: b.word_count, aiAssisted: b.ai_assisted,
  };
}

export function usePostsQuery() {
  return useQuery({ queryKey: ["posts"], queryFn: fetchPosts });
}
export function usePosts() {
  return usePostsQuery().data ?? [];
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  }).data ?? [];
}
export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  }).data ?? [];
}

export type Role = "super_admin" | "admin" | "editor" | "author";
export const roleLabel: Record<Role, string> = { super_admin: "Super Admin", admin: "Admin", editor: "Editor", author: "Author" };
export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const [{ data: p, error }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      return (p ?? []).map((x) => ({ ...x, roles: (r ?? []).filter((y) => y.user_id === x.id).map((y) => y.role as Role) }));
    },
  }).data ?? [];
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      const list = (roles ?? []).map((r) => r.role as Role);
      const can = (...rs: Role[]) => list.some((r) => rs.includes(r));
      return { id: user.id, email: user.email ?? "", name: profile?.full_name || user.email || "", roles: list, can };
    },
  }).data;
}

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
export async function uploadImage(bucket: "blog-images" | "media-library" | "author-images", file: Blob, name = "image") {
  const { data: u } = await supabase.auth.getUser();
  const ext = (file.type.split("/")[1] || "png").replace("jpeg", "jpg");
  const path = `${u.user?.id ?? "anon"}/${Date.now()}-${name.replace(/[^a-z0-9.-]/gi, "-").slice(0, 40)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data: s, error: e2 } = await supabase.storage.from(bucket).createSignedUrl(path, TEN_YEARS);
  if (e2 || !s) throw e2 ?? new Error("No URL");
  return { path, url: s.signedUrl };
}
export async function dataUrlToBlob(src: string) {
  return (await fetch(src)).blob();
}

const fail = (e: { message: string } | null) => { if (e) { toast.error(e.message); return true; } return false; };

export const blog = {
  async remove(ids: string[]) {
    const { error } = await supabase.from("blogs").delete().in("id", ids);
    if (!fail(error)) invalidate("posts", "activity");
  },
  async setStatus(ids: string[], status: Status) {
    const { error } = await supabase.from("blogs").update({ status: toDb(status) }).in("id", ids);
    if (!fail(error)) invalidate("posts", "activity", "notifications");
  },
  async duplicate(id: string) {
    const { data: me } = await supabase.auth.getUser();
    const { data: src, error } = await supabase.from("blogs").select("*").eq("id", id).single();
    if (fail(error) || !src || !me.user) return;
    const { id: _id, created_at: _c, updated_at: _u, published_at: _p, ...rest } = src;
    const { error: e2 } = await supabase.from("blogs").insert({
      ...rest, title: src.title + " (copy)", slug: `${src.slug}-copy-${Date.now().toString(36)}`,
      status: "draft", author_id: me.user.id, publish_at: null,
    });
    if (!fail(e2)) invalidate("posts");
  },
};
