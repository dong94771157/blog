import { Post, PostInput, Category, User, Purchase, KVNamespace } from "./types";

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
  // EdgeOne 环境中绑定的 KV 变量名（控制台绑定 KV 命名空间后生效）
  if (g.BLOG_KV) return g.BLOG_KV as KVNamespace;
  // GitHub 分支存储（GITHUB_TOKEN 环境变量存在时启用，数据持久化到 GIT_KV_BRANCH 分支）
  if (process.env.GITHUB_TOKEN) {
    if (!g.__gitKV) g.__gitKV = new GitHubKV();
    return g.__gitKV as KVNamespace;
  }
  // 本地开发：使用内存存储（全局单例，热更新不丢失）
  if (!g.__memoryKV) g.__memoryKV = new MemoryStore();
  return g.__memoryKV as KVNamespace;
}

// ---- GitHub 分支存储（Git 即数据库）----
// 将 KV 数据以加密文件形式持久化到仓库独立分支，部署/实例回收后数据不丢失。
// 值使用 AES-256-GCM 加密（密钥来自 GIT_KV_SECRET），文件名仅含非敏感键名。

const GITKV_DIR = "kv/";
const GITKV_ENC_PREFIX = "enc1:";

function b64EncodeBytes(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64DecodeBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64EncodeText(text: string): string {
  return b64EncodeBytes(new TextEncoder().encode(text));
}

function b64DecodeText(b64: string): string {
  return new TextDecoder().decode(b64DecodeBytes(b64));
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptValue(value: string, secret: string): Promise<string> {
  const key = await deriveAesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    new TextEncoder().encode(value) as unknown as BufferSource
  );
  return `${GITKV_ENC_PREFIX}${b64EncodeBytes(iv)}.${b64EncodeBytes(new Uint8Array(cipher))}`;
}

async function decryptValue(stored: string, secret: string): Promise<string> {
  const body = stored.slice(GITKV_ENC_PREFIX.length);
  const [ivB64, dataB64] = body.split(".");
  const key = await deriveAesKey(secret);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64DecodeBytes(ivB64) as unknown as BufferSource },
    key,
    b64DecodeBytes(dataB64) as unknown as BufferSource
  );
  return new TextDecoder().decode(plain);
}

class GitHubKV implements KVNamespace {
  private repo = process.env.GIT_KV_REPO || "dong94771157/blog";
  private branch = process.env.GIT_KV_BRANCH || "kv-data";
  private token = process.env.GITHUB_TOKEN || "";
  private secret = process.env.GIT_KV_SECRET || "";
  private cache = new Map<string, { value: string; ts: number }>();
  private tree: Map<string, string> | null = null;
  private treeTs = 0;

  private path(key: string): string {
    // 键名中的冒号替换为双下划线，其余保持原样（键名均为 ASCII）
    return GITKV_DIR + key.split(":").join("__");
  }

  private unpath(path: string): string {
    return path.slice(GITKV_DIR.length).split("__").join(":");
  }

  private async gh(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`https://api.github.com/repos/${this.repo}/contents/${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "blog-kv",
        ...(init?.headers || {}),
      },
    });
  }

  private fresh(ts: number, ttlMs: number): boolean {
    return Date.now() - ts < ttlMs;
  }

  private async loadTree(force = false): Promise<Map<string, string>> {
    if (!force && this.tree && this.fresh(this.treeTs, 30_000)) return this.tree;
    const res = await fetch(
      `https://api.github.com/repos/${this.repo}/git/trees/${this.branch}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "blog-kv",
        },
      }
    );
    if (!res.ok) throw new Error(`GitHubKV loadTree ${res.status}`);
    const data = (await res.json()) as { tree: { path: string; type: string; sha: string }[] };
    const map = new Map<string, string>();
    for (const item of data.tree) {
      if (item.type === "blob" && item.path.startsWith(GITKV_DIR)) {
        map.set(item.path, item.sha);
      }
    }
    this.tree = map;
    this.treeTs = Date.now();
    return map;
  }

  private async prepare(value: string): Promise<string> {
    return this.secret ? encryptValue(value, this.secret) : value;
  }

  private async reveal(stored: string): Promise<string> {
    if (stored.startsWith(GITKV_ENC_PREFIX)) {
      if (!this.secret) throw new Error("GitHubKV: 值已加密但未配置 GIT_KV_SECRET");
      return decryptValue(stored, this.secret);
    }
    return stored;
  }

  async get(key: string): Promise<string | null> {
    const hit = this.cache.get(key);
    if (hit && this.fresh(hit.ts, 60_000)) return hit.value;
    try {
      const res = await this.gh(`${this.path(key)}?ref=${this.branch}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`GitHubKV get ${res.status}`);
      const data = (await res.json()) as { content?: string; sha: string };
      const value = await this.reveal(b64DecodeText((data.content || "").replace(/\n/g, "")));
      if (this.tree) this.tree.set(this.path(key), data.sha);
      this.cache.set(key, { value, ts: Date.now() });
      return value;
    } catch (err) {
      console.error("GitHubKV get failed:", key, err);
      return hit ? hit.value : null; // 网络异常时回退旧缓存
    }
  }

  async put(key: string, value: string): Promise<void> {
    const content = await this.prepare(value);
    let sha: string | undefined;
    try {
      const tree = await this.loadTree();
      sha = tree.get(this.path(key));
    } catch {
      try {
        const res = await this.gh(`${this.path(key)}?ref=${this.branch}`);
        if (res.ok) sha = ((await res.json()) as { sha: string }).sha;
      } catch {
        /* 无 sha 则按新建处理 */
      }
    }
    const body: Record<string, unknown> = {
      message: `kv: ${key}`,
      content: b64EncodeText(content),
      branch: this.branch,
    };
    if (sha) body.sha = sha;
    const res = await this.gh(this.path(key), { method: "PUT", body: JSON.stringify(body) });
    if (!res.ok && res.status === 409 && sha) {
      // sha 过期（并发写入），刷新后重试一次
      const cur = await this.gh(`${this.path(key)}?ref=${this.branch}`);
      if (cur.ok) {
        body.sha = ((await cur.json()) as { sha: string }).sha;
        const retry = await this.gh(this.path(key), { method: "PUT", body: JSON.stringify(body) });
        if (!retry.ok) throw new Error(`GitHubKV put retry ${retry.status}`);
      }
    } else if (!res.ok) {
      throw new Error(`GitHubKV put ${res.status}`);
    }
    const data = (await res.json()) as { content?: { sha?: string } };
    if (this.tree && data.content?.sha) this.tree.set(this.path(key), data.content.sha);
    this.cache.set(key, { value, ts: Date.now() });
  }

  async delete(key: string): Promise<void> {
    let sha: string | undefined;
    try {
      const res = await this.gh(`${this.path(key)}?ref=${this.branch}`);
      if (res.status === 404) return;
      if (res.ok) sha = ((await res.json()) as { sha: string }).sha;
    } catch (err) {
      console.error("GitHubKV delete lookup failed:", key, err);
      return;
    }
    const res = await this.gh(this.path(key), {
      method: "DELETE",
      body: JSON.stringify({ message: `kv del: ${key}`, sha, branch: this.branch }),
    });
    if (!res.ok) throw new Error(`GitHubKV delete ${res.status}`);
    this.cache.delete(key);
    if (this.tree) this.tree.delete(this.path(key));
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
    try {
      const tree = await this.loadTree();
      let keys = [...tree.keys()].map((p) => this.unpath(p)).sort();
      if (options?.prefix) keys = keys.filter((k) => k.startsWith(options.prefix!));
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
    } catch (err) {
      console.error("GitHubKV list failed:", err);
      return { keys: [], complete: true, cursor: null };
    }
  }
}

// ---- 工具函数 ----
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function slugify(text: string): string {
  // 中文转拼音首字母（无外部依赖的轻量实现）：仅提取 ASCII 部分，
  // 中文段落整体压缩为 "z" 占位保证可读性，避免中文 slug 在某些环境 404。
  const ascii = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")  // 非 ASCII 全部替换为空格
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  // 如果 ASCII 部分为空（纯中文标题），返回空串让调用方走 fallback (post-<id>)
  return ascii;
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
    categoryId: input.categoryId || null,
    coverUrl: input.coverUrl || "",
    published: input.published ?? false,
    paid: input.paid ?? false,
    price: input.price ?? 0,
    freeContent: input.freeContent || "",
    downloads: input.downloads || [],
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

// ---- 分类 CRUD ----
const CATEGORY_PREFIX = "category:";
const CATEGORY_SLUG_PREFIX = "category-slug:";

export async function getAllCategories(): Promise<Category[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: CATEGORY_PREFIX, limit: 256 });
  const categories: Category[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        categories.push(JSON.parse(raw));
      } catch {
        // 跳过
      }
    }
  }
  return categories.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const kv = getKV();
  const raw = await kv.get(`${CATEGORY_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const kv = getKV();
  const id = await kv.get(`${CATEGORY_SLUG_PREFIX}${slug}`);
  if (!id) return null;
  return getCategoryById(id);
}

export async function createCategory(input: Omit<Category, "id" | "createdAt">): Promise<Category> {
  const kv = getKV();
  const id = generateId();
  let slug = slugify(input.slug || input.name);
  if (!slug) slug = `cat-${id}`;
  const existing = await kv.get(`${CATEGORY_SLUG_PREFIX}${slug}`);
  if (existing) slug = `${slug}-${id.slice(-4)}`;

  const category: Category = {
    ...input,
    slug,
    id,
    createdAt: Date.now(),
  };
  await kv.put(`${CATEGORY_PREFIX}${id}`, JSON.stringify(category));
  await kv.put(`${CATEGORY_SLUG_PREFIX}${slug}`, id);
  return category;
}

export async function updateCategory(id: string, input: Partial<Category>): Promise<Category | null> {
  const existing = await getCategoryById(id);
  if (!existing) return null;
  const kv = getKV();
  const updated: Category = { ...existing, ...input, id, createdAt: existing.createdAt };
  // slug 变了更新索引
  if (input.slug && slugify(input.slug) !== existing.slug) {
    let newSlug = slugify(input.slug);
    const conflict = await kv.get(`${CATEGORY_SLUG_PREFIX}${newSlug}`);
    if (conflict && conflict !== id) newSlug = `${newSlug}-${id.slice(-4)}`;
    await kv.delete(`${CATEGORY_SLUG_PREFIX}${existing.slug}`);
    updated.slug = newSlug;
    await kv.put(`${CATEGORY_SLUG_PREFIX}${newSlug}`, id);
  }
  await kv.put(`${CATEGORY_PREFIX}${id}`, JSON.stringify(updated));
  return updated;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const existing = await getCategoryById(id);
  if (!existing) return false;
  const kv = getKV();
  await kv.delete(`${CATEGORY_PREFIX}${id}`);
  await kv.delete(`${CATEGORY_SLUG_PREFIX}${existing.slug}`);
  // 将该分类下的文章 categoryId 置空
  const posts = await getAllPosts(true);
  for (const post of posts) {
    if (post.categoryId === id) {
      await updatePost(post.id, { categoryId: null });
    }
  }
  return true;
}

// ---- 用户 CRUD ----
const USER_PREFIX = "user:";
const USER_NAME_PREFIX = "user-name:"; // username -> id 索引
const USER_EMAIL_PREFIX = "user-email:"; // email -> id 索引

export async function getUserById(id: string): Promise<User | null> {
  const kv = getKV();
  const raw = await kv.get(`${USER_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const kv = getKV();
  const id = await kv.get(`${USER_NAME_PREFIX}${username.toLowerCase()}`);
  if (!id) return null;
  return getUserById(id);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const kv = getKV();
  const id = await kv.get(`${USER_EMAIL_PREFIX}${email.toLowerCase()}`);
  if (!id) return null;
  return getUserById(id);
}

export async function getAllUsers(): Promise<User[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: USER_PREFIX, limit: 256 });
  const users: User[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        users.push(JSON.parse(raw));
      } catch {
        // 跳过
      }
    }
  }
  return users.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createUser(input: Omit<User, "id" | "createdAt">): Promise<User> {
  const kv = getKV();
  const id = generateId();
  const user: User = { ...input, id, createdAt: Date.now() };
  await kv.put(`${USER_PREFIX}${id}`, JSON.stringify(user));
  await kv.put(`${USER_NAME_PREFIX}${input.username.toLowerCase()}`, id);
  await kv.put(`${USER_EMAIL_PREFIX}${input.email.toLowerCase()}`, id);
  return user;
}

export async function updateUser(id: string, input: Partial<User>): Promise<User | null> {
  const existing = await getUserById(id);
  if (!existing) return null;
  const kv = getKV();
  const updated: User = { ...existing, ...input, id, createdAt: existing.createdAt };
  await kv.put(`${USER_PREFIX}${id}`, JSON.stringify(updated));
  return updated;
}

export async function deleteUser(id: string): Promise<boolean> {
  const existing = await getUserById(id);
  if (!existing) return false;
  const kv = getKV();
  await kv.delete(`${USER_PREFIX}${id}`);
  await kv.delete(`${USER_NAME_PREFIX}${existing.username.toLowerCase()}`);
  await kv.delete(`${USER_EMAIL_PREFIX}${existing.email.toLowerCase()}`);
  return true;
}

// ---- 购买记录 CRUD ----
const PURCHASE_PREFIX = "purchase:";
const PURCHASE_USER_POST_PREFIX = "purchase-up:"; // userId:postId -> purchaseId 索引

export async function createPurchase(input: Omit<Purchase, "id" | "createdAt">): Promise<Purchase> {
  const kv = getKV();
  const id = generateId();
  const purchase: Purchase = { ...input, id, createdAt: Date.now() };
  await kv.put(`${PURCHASE_PREFIX}${id}`, JSON.stringify(purchase));
  // 文章购买索引：userId:postId；下载项购买索引：userId:postId:downloadId
  const indexKey = input.downloadId
    ? `${PURCHASE_USER_POST_PREFIX}${input.userId}:${input.postId}:${input.downloadId}`
    : `${PURCHASE_USER_POST_PREFIX}${input.userId}:${input.postId}`;
  await kv.put(indexKey, id);
  return purchase;
}

/** 检查用户是否已购买某文章 */
export async function hasPurchased(userId: string, postId: string): Promise<boolean> {
  const kv = getKV();
  const id = await kv.get(`${PURCHASE_USER_POST_PREFIX}${userId}:${postId}`);
  return !!id;
}

/** 检查用户是否已购买某下载项 */
export async function hasPurchasedDownload(
  userId: string,
  postId: string,
  downloadId: string
): Promise<boolean> {
  const kv = getKV();
  const id = await kv.get(
    `${PURCHASE_USER_POST_PREFIX}${userId}:${postId}:${downloadId}`
  );
  return !!id;
}

/** 获取用户在某文章下已购买的所有下载项 ID */
export async function getPurchasedDownloadIds(
  userId: string,
  postId: string
): Promise<string[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: `${PURCHASE_PREFIX}`, limit: 256 });
  const ids: string[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        const p = JSON.parse(raw) as Purchase;
        if (p.userId === userId && p.postId === postId && p.downloadId) {
          ids.push(p.downloadId);
        }
      } catch {
        // 跳过
      }
    }
  }
  return ids;
}

/** 获取用户所有购买记录 */
export async function getUserPurchases(userId: string): Promise<Purchase[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: `${PURCHASE_PREFIX}`, limit: 256 });
  const purchases: Purchase[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        const p = JSON.parse(raw) as Purchase;
        if (p.userId === userId) purchases.push(p);
      } catch {
        // 跳过
      }
    }
  }
  return purchases.sort((a, b) => b.createdAt - a.createdAt);
}

/** 获取文章的所有购买记录 */
export async function getPostPurchases(postId: string): Promise<Purchase[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: `${PURCHASE_PREFIX}`, limit: 256 });
  const purchases: Purchase[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        const p = JSON.parse(raw) as Purchase;
        if (p.postId === postId) purchases.push(p);
      } catch {
        // 跳过
      }
    }
  }
  return purchases.sort((a, b) => b.createdAt - a.createdAt);
}

/** 获取所有购买记录（后台用） */
export async function getAllPurchases(): Promise<Purchase[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: PURCHASE_PREFIX, limit: 256 });
  const purchases: Purchase[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        purchases.push(JSON.parse(raw));
      } catch {
        // 跳过
      }
    }
  }
  return purchases.sort((a, b) => b.createdAt - a.createdAt);
}