import { Post, PostInput, KVNamespace } from "./types";

/**
 * EdgeOne KV 存储抽象层
 *
 * 生产环境（EdgeOne Makers）：
 *   KV 命名空间绑定到项目后，通过全局变量 BLOG_KV 访问。
 *   在控制台「项目 > KV 存储」中绑定命名空间，变量名填 BLOG_KV。
 *
 * 本地开发：
 *   使用内存存储模拟，npm run dev 即可完整测试后台功能。
 */

// ---- 内存存储（本地开发用）----
class MemoryStore implements KVNamespace {
  private data = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{
    keys: { key: string }[];
    complete: boolean;
    cursor: string | null;
  }> {
    let keys = [...this.data.keys()]
      .filter((k) => !options?.prefix || k.startsWith(options.prefix))
      .sort();
    if (options?.cursor) {
      const idx = keys.findIndex((k) => k > options.cursor!);
      keys = idx >= 0 ? keys.slice(idx) : [];
    }
    const limit = options?.limit ?? 256;
    const page = keys.slice(0, limit);
    return {
      keys: page.map((key) => ({ key })),
      complete: keys.length <= limit,
      cursor: keys.length > limit ? page[page.length - 1] : null,
    };
  }
}

// 获取 KV 实例（导出供其他模块使用）
export function getKV(): KVNamespace {
  const g = globalThis as Record<string, unknown>;
  // EdgeOne 环境中绑定的 KV 变量名
  if (g.BLOG_KV) return g.BLOG_KV as KVNamespace;
  // 本地开发：使用内存存储（全局单例，热更新不丢失）
  if (!g.__memoryKV) g.__memoryKV = new MemoryStore();
  return g.__memoryKV as KVNamespace;
}

// ---- 工具函数 ----
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeExcerpt(content: string, maxLen = 120): string {
  const plain = content
    .replace(/[#*`>\-\[\]()!]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + "..." : plain;
}

// ---- 文章 CRUD ----
const POST_PREFIX = "post:";
const SLUG_PREFIX = "slug:";

/** 获取所有文章（按创建时间倒序） */
export async function getAllPosts(includeUnpublished = false): Promise<Post[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: POST_PREFIX, limit: 256 });
  const posts: Post[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        const post = JSON.parse(raw) as Post;
        if (includeUnpublished || post.published) {
          posts.push(post);
        }
      } catch {
        // 跳过损坏的数据
      }
    }
  }
  return posts.sort((a, b) => b.createdAt - a.createdAt);
}

/** 根据 slug 获取文章 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const kv = getKV();
  const id = await kv.get(`${SLUG_PREFIX}${slug}`);
  if (!id) return null;
  const raw = await kv.get(`${POST_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Post;
  } catch {
    return null;
  }
}

/** 根据 ID 获取文章 */
export async function getPostById(id: string): Promise<Post | null> {
  const kv = getKV();
  const raw = await kv.get(`${POST_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Post;
  } catch {
    return null;
  }
}

/** 创建文章 */
export async function createPost(input: PostInput): Promise<Post> {
  const kv = getKV();
  const id = generateId();
  let slug = input.slug ? slugify(input.slug) : slugify(input.title);
  if (!slug) slug = `post-${id}`;

  // 确保 slug 唯一
  const existing = await kv.get(`${SLUG_PREFIX}${slug}`);
  if (existing) slug = `${slug}-${id.slice(-4)}`;

  const now = Date.now();
  const post: Post = {
    id,
    title: input.title,
    slug,
    content: input.content,
    excerpt: input.excerpt || makeExcerpt(input.content),
    tags: input.tags || [],
    published: input.published ?? false,
    createdAt: now,
    updatedAt: now,
  };

  await kv.put(`${POST_PREFIX}${id}`, JSON.stringify(post));
  await kv.put(`${SLUG_PREFIX}${slug}`, id);
  return post;
}

/** 更新文章 */
export async function updatePost(id: string, input: Partial<PostInput>): Promise<Post | null> {
  const existing = await getPostById(id);
  if (!existing) return null;

  const kv = getKV();
  const updated: Post = {
    ...existing,
    ...input,
    excerpt: input.excerpt || (input.content ? makeExcerpt(input.content) : existing.excerpt),
    updatedAt: Date.now(),
  };

  // 如果 slug 变了，更新索引
  if (input.slug && slugify(input.slug) !== existing.slug) {
    let newSlug = slugify(input.slug);
    const conflict = await kv.get(`${SLUG_PREFIX}${newSlug}`);
    if (conflict && conflict !== id) newSlug = `${newSlug}-${id.slice(-4)}`;
    await kv.delete(`${SLUG_PREFIX}${existing.slug}`);
    updated.slug = newSlug;
    await kv.put(`${SLUG_PREFIX}${newSlug}`, id);
  }

  await kv.put(`${POST_PREFIX}${id}`, JSON.stringify(updated));
  return updated;
}

/** 删除文章 */
export async function deletePost(id: string): Promise<boolean> {
  const existing = await getPostById(id);
  if (!existing) return false;
  const kv = getKV();
  await kv.delete(`${POST_PREFIX}${id}`);
  await kv.delete(`${SLUG_PREFIX}${existing.slug}`);
  return true;
}