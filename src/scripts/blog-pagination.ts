import { getCollection } from 'astro:content';

export const BLOG_PAGE_SIZE = 12;

export interface BlogListPageData {
  posts: any[];
  currentPage: number;
  lastPage: number;
}

export async function getBlogListPage(requestedPage: number): Promise<BlogListPageData | null> {
  const sorted = (await getCollection('blog')).sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  );
  const lastPage = Math.max(1, Math.ceil(sorted.length / BLOG_PAGE_SIZE));
  if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > lastPage) {
    return null;
  }
  return {
    posts: sorted.slice((requestedPage - 1) * BLOG_PAGE_SIZE, requestedPage * BLOG_PAGE_SIZE),
    currentPage: requestedPage,
    lastPage,
  };
}
