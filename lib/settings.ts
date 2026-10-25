import { getKV } from "./store";
import {
  SiteSettings,
  NotifySettings,
  PaymentSettings,
  AISettings,
  Order,
  Comment,
  FriendLink,
  ProductPromo,
  defaultSiteSettings,
  defaultNotifySettings,
  defaultPaymentSettings,
  defaultAISettings,
} from "./types";

// KV 键名
const KEY_SITE = "settings:site";
const KEY_NOTIFY = "settings:notify";
const KEY_PAYMENT = "settings:payment";
const KEY_AI = "settings:ai";
const ORDER_PREFIX = "order:";
const COMMENT_PREFIX = "comment:";
const FRIEND_PREFIX = "friend:";
const PRODUCT_PREFIX = "product:";

// 深度合并（保留默认值中用户未覆盖的字段）
function deepMerge<T>(defaults: T, overrides: Partial<T>): T {
  const result = { ...defaults } as Record<string, unknown>;
  const src = overrides as Record<string, unknown>;
  for (const key of Object.keys(src)) {
    if (
      src[key] &&
      typeof src[key] === "object" &&
      !Array.isArray(src[key]) &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], src[key]);
    } else if (src[key] !== undefined) {
      result[key] = src[key];
    }
  }
  return result as T;
}

// ---- 网站设置 ----
export async function getSiteSettings(): Promise<SiteSettings> {
  const kv = getKV();
  const raw = await kv.get(KEY_SITE);
  if (!raw) return { ...defaultSiteSettings };
  try {
    return deepMerge(defaultSiteSettings, JSON.parse(raw));
  } catch {
    return { ...defaultSiteSettings };
  }
}

export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const kv = getKV();
  const merged = deepMerge(await getSiteSettings(), settings);
  await kv.put(KEY_SITE, JSON.stringify(merged));
  return merged;
}

// ---- 通知配置 ----
export async function getNotifySettings(): Promise<NotifySettings> {
  const kv = getKV();
  const raw = await kv.get(KEY_NOTIFY);
  if (!raw) return { ...defaultNotifySettings };
  try {
    return deepMerge(defaultNotifySettings, JSON.parse(raw));
  } catch {
    return { ...defaultNotifySettings };
  }
}

export async function saveNotifySettings(settings: Partial<NotifySettings>): Promise<NotifySettings> {
  const kv = getKV();
  const merged = deepMerge(await getNotifySettings(), settings);
  await kv.put(KEY_NOTIFY, JSON.stringify(merged));
  return merged;
}

// ---- 支付配置 ----
export async function getPaymentSettings(): Promise<PaymentSettings> {
  const kv = getKV();
  const raw = await kv.get(KEY_PAYMENT);
  if (!raw) return { ...defaultPaymentSettings };
  try {
    return deepMerge(defaultPaymentSettings, JSON.parse(raw));
  } catch {
    return { ...defaultPaymentSettings };
  }
}

export async function savePaymentSettings(settings: Partial<PaymentSettings>): Promise<PaymentSettings> {
  const kv = getKV();
  const merged = deepMerge(await getPaymentSettings(), settings);
  await kv.put(KEY_PAYMENT, JSON.stringify(merged));
  return merged;
}

// ---- 订单 ----
export async function createOrder(order: Order): Promise<void> {
  const kv = getKV();
  await kv.put(`${ORDER_PREFIX}${order.outTradeNo}`, JSON.stringify(order));
}

export async function getOrder(outTradeNo: string): Promise<Order | null> {
  const kv = getKV();
  const raw = await kv.get(`${ORDER_PREFIX}${outTradeNo}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Order;
  } catch {
    return null;
  }
}

export async function updateOrder(outTradeNo: string, updates: Partial<Order>): Promise<Order | null> {
  const existing = await getOrder(outTradeNo);
  if (!existing) return null;
  const kv = getKV();
  const updated = { ...existing, ...updates };
  await kv.put(`${ORDER_PREFIX}${outTradeNo}`, JSON.stringify(updated));
  return updated;
}

export async function getAllOrders(): Promise<Order[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: ORDER_PREFIX, limit: 256 });
  const orders: Order[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        orders.push(JSON.parse(raw));
      } catch {
        // 跳过
      }
    }
  }
  return orders.sort((a, b) => b.createdAt - a.createdAt);
}

// ---- AI 配置 ----
export async function getAISettings(): Promise<AISettings> {
  const kv = getKV();
  const raw = await kv.get(KEY_AI);
  if (!raw) return { ...defaultAISettings };
  try {
    return deepMerge(defaultAISettings, JSON.parse(raw));
  } catch {
    return { ...defaultAISettings };
  }
}

export async function saveAISettings(settings: Partial<AISettings>): Promise<AISettings> {
  const kv = getKV();
  const merged = deepMerge(await getAISettings(), settings);
  await kv.put(KEY_AI, JSON.stringify(merged));
  return merged;
}

// ---- 留言 ----
export async function createComment(comment: Comment): Promise<void> {
  const kv = getKV();
  await kv.put(`${COMMENT_PREFIX}${comment.id}`, JSON.stringify(comment));
}

export async function getComment(id: string): Promise<Comment | null> {
  const kv = getKV();
  const raw = await kv.get(`${COMMENT_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Comment;
  } catch {
    return null;
  }
}

export async function updateComment(id: string, updates: Partial<Comment>): Promise<Comment | null> {
  const existing = await getComment(id);
  if (!existing) return null;
  const kv = getKV();
  const updated = { ...existing, ...updates };
  await kv.put(`${COMMENT_PREFIX}${id}`, JSON.stringify(updated));
  return updated;
}

export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: COMMENT_PREFIX, limit: 500 });
  const comments: Comment[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        const c = JSON.parse(raw) as Comment;
        if (c.postId === postId && c.status === "approved") {
          comments.push(c);
        }
      } catch {
        // 跳过
      }
    }
  }
  return comments.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllComments(): Promise<Comment[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: COMMENT_PREFIX, limit: 500 });
  const comments: Comment[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        comments.push(JSON.parse(raw));
      } catch {
        // 跳过
      }
    }
  }
  return comments.sort((a, b) => b.createdAt - a.createdAt);
}

// ---- 友情链接 ----
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createFriendLink(link: FriendLink): Promise<void> {
  const kv = getKV();
  await kv.put(`${FRIEND_PREFIX}${link.id}`, JSON.stringify(link));
}

export async function getFriendLink(id: string): Promise<FriendLink | null> {
  const kv = getKV();
  const raw = await kv.get(`${FRIEND_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FriendLink;
  } catch {
    return null;
  }
}

export async function updateFriendLink(id: string, updates: Partial<FriendLink>): Promise<FriendLink | null> {
  const existing = await getFriendLink(id);
  if (!existing) return null;
  const kv = getKV();
  const updated = { ...existing, ...updates };
  await kv.put(`${FRIEND_PREFIX}${id}`, JSON.stringify(updated));
  return updated;
}

export async function deleteFriendLink(id: string): Promise<boolean> {
  const existing = await getFriendLink(id);
  if (!existing) return false;
  const kv = getKV();
  await kv.delete(`${FRIEND_PREFIX}${id}`);
  return true;
}

/** 公开：只返回已通过的友链 */
export async function getApprovedFriendLinks(): Promise<FriendLink[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: FRIEND_PREFIX, limit: 256 });
  const links: FriendLink[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        const l = JSON.parse(raw) as FriendLink;
        if (l.status === "approved") links.push(l);
      } catch {
        // 跳过
      }
    }
  }
  return links.sort((a, b) => a.createdAt - b.createdAt);
}

/** 管理：返回全部友链 */
export async function getAllFriendLinks(): Promise<FriendLink[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: FRIEND_PREFIX, limit: 256 });
  const links: FriendLink[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        links.push(JSON.parse(raw));
      } catch {
        // 跳过
      }
    }
  }
  return links.sort((a, b) => b.createdAt - a.createdAt);
}

// ---- 产品/服务推荐 ----
export async function createProduct(product: ProductPromo): Promise<void> {
  const kv = getKV();
  await kv.put(`${PRODUCT_PREFIX}${product.id}`, JSON.stringify(product));
}

export async function getProduct(id: string): Promise<ProductPromo | null> {
  const kv = getKV();
  const raw = await kv.get(`${PRODUCT_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProductPromo;
  } catch {
    return null;
  }
}

export async function updateProduct(id: string, updates: Partial<ProductPromo>): Promise<ProductPromo | null> {
  const existing = await getProduct(id);
  if (!existing) return null;
  const kv = getKV();
  const updated = { ...existing, ...updates };
  await kv.put(`${PRODUCT_PREFIX}${id}`, JSON.stringify(updated));
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const existing = await getProduct(id);
  if (!existing) return false;
  const kv = getKV();
  await kv.delete(`${PRODUCT_PREFIX}${id}`);
  return true;
}

/** 公开：返回已启用的产品（按 sort 排序） */
export async function getEnabledProducts(): Promise<ProductPromo[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: PRODUCT_PREFIX, limit: 256 });
  const products: ProductPromo[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        const p = JSON.parse(raw) as ProductPromo;
        if (p.enabled) products.push(p);
      } catch {
        // 跳过
      }
    }
  }
  return products.sort((a, b) => a.sort - b.sort || b.createdAt - a.createdAt);
}

/** 管理：返回全部产品 */
export async function getAllProducts(): Promise<ProductPromo[]> {
  const kv = getKV();
  const result = await kv.list({ prefix: PRODUCT_PREFIX, limit: 256 });
  const products: ProductPromo[] = [];
  for (const { key } of result.keys) {
    const raw = await kv.get(key);
    if (raw) {
      try {
        products.push(JSON.parse(raw));
      } catch {
        // 跳过
      }
    }
  }
  return products.sort((a, b) => a.sort - b.sort || b.createdAt - a.createdAt);
}

export { genId };