import { useSyncExternalStore } from "react";
import c1 from "@/assets/cover-1.jpg";
import c2 from "@/assets/cover-2.jpg";
import c3 from "@/assets/cover-3.jpg";

export type Status = "Published" | "Draft" | "Scheduled";
export type Post = {
  id: string;
  title: string;
  slug: string;
  image: string;
  author: string;
  category: string;
  tags: string[];
  status: Status;
  views: number;
  published: string;
  updated: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  keyword?: string;
};

export const categories = ["Machine Learning", "Career", "Generative AI", "Data Science", "Tutorials"];
export const authors = ["Aarav Mehta", "Priya Nair", "Rohan Das", "Sara Iyer"];
const covers = [c1, c2, c3];

const titles = [
  "A Practical Guide to Transformers in 2026",
  "How to Land Your First ML Engineering Role",
  "Prompt Engineering Is Dead. Long Live Agents.",
  "Feature Stores Explained for Beginners",
  "Fine-tuning Small Models on a Laptop",
  "The Data Scientist's Guide to Storytelling",
  "RAG Pipelines That Actually Work",
  "Interview Prep: 50 Questions on Deep Learning",
  "Vector Databases Compared",
  "From Notebook to Production in One Week",
  "Ethics in AI Education",
  "Diffusion Models, Visually Explained",
];
const statuses: Status[] = ["Published", "Published", "Draft", "Scheduled", "Published", "Draft"];

let posts: Post[] = titles.map((t, i) => ({
  id: String(i + 1),
  title: t,
  slug: t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  image: covers[i % 3]!,
  author: authors[i % authors.length]!,
  category: categories[i % categories.length]!,
  tags: [["llm", "nlp"], ["career"], ["agents", "llm"], ["mlops"], ["fine-tuning"], ["storytelling"]][i % 6]!,
  status: statuses[i % statuses.length]!,
  views: statuses[i % statuses.length] === "Published" ? 18420 - i * 1290 : 0,
  published: `2026-0${(i % 9) + 1}-1${i % 9}`,
  updated: `2026-09-${String(10 + i).padStart(2, "0")}`,
}));

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));

export function usePosts() {
  return useSyncExternalStore(subscribe, () => posts, () => posts);
}
export const blog = {
  get: (id: string) => posts.find((p) => p.id === id),
  upsert(p: Post) {
    posts = posts.some((x) => x.id === p.id) ? posts.map((x) => (x.id === p.id ? p : x)) : [p, ...posts];
    emit();
  },
  remove(ids: string[]) {
    posts = posts.filter((p) => !ids.includes(p.id));
    emit();
  },
  setStatus(ids: string[], status: Status) {
    posts = posts.map((p) => (ids.includes(p.id) ? { ...p, status } : p));
    emit();
  },
  duplicate(id: string) {
    const p = posts.find((x) => x.id === id);
    if (!p) return;
    posts = [{ ...p, id: String(Date.now()), title: p.title + " (copy)", status: "Draft", views: 0 }, ...posts];
    emit();
  },
};
export const defaultCover = c1;
