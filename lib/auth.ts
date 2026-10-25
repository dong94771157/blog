/**
 * 认证工具 - 基于 Web Crypto API 的 JWT（Edge Runtime 兼容）
 *
 * 环境变量：
 *   ADMIN_USERNAME - 管理员用户名（默认 admin）
 *   ADMIN_PASSWORD - 管理员密码（默认 admin123，生产环境务必修改）
 *   JWT_SECRET     - JWT 签名密钥（默认随机生成，生产环境务必设置固定值）
 */

const COOKIE_NAME = "blog_token";

function getSecret(): string {
  return process.env.JWT_SECRET || "edgeone-blog-dev-secret-change-me";
}

function base64UrlEncode(data: ArrayBuffer | string): string {
  const str = typeof data === "string" ? data : String.fromCharCode(...new Uint8Array(data));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded + "=".repeat((4 - (str.length % 4)) % 4));
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64UrlEncode(signature);
}

/** 生成 JWT token */
export async function signToken(payload: Record<string, unknown>, expiresInSec = 7 * 24 * 3600): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const bodyB64 = base64UrlEncode(JSON.stringify(body));
  const signature = await hmacSign(`${headerB64}.${bodyB64}`, getSecret());
  return `${headerB64}.${bodyB64}.${signature}`;
}

/** 验证 JWT token，返回 payload 或 null */
export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, bodyB64, signature] = parts;
    const expectedSig = await hmacSign(`${headerB64}.${bodyB64}`, getSecret());
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(base64UrlDecode(bodyB64));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** 验证用户名密码 */
export function verifyCredentials(username: string, password: string): boolean {
  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  return username === adminUser && password === adminPass;
}

/** 从请求中提取并验证 token */
export async function isAuthenticated(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie") || "";
  const token = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload !== null;
}

export { COOKIE_NAME };

// ===== 读者用户认证 =====
const USER_COOKIE_NAME = "user_token";

/** 密码哈希（SHA-256 + salt） */
export async function hashPassword(password: string): Promise<string> {
  const salt = Math.random().toString(36).slice(2, 10);
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashHex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${salt}:${hashHex}`;
}

/** 验证密码 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const computed = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return computed === hashHex;
}

/** 从请求中提取 cookie 值 */
function getCookie(request: Request, name: string): string | undefined {
  const cookie = request.headers.get("cookie") || "";
  return cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

/** 生成用户 token */
export async function signUserToken(userId: string, username: string): Promise<string> {
  return signToken({ sub: userId, username, role: "user" }, 30 * 24 * 3600);
}

/** 从请求中获取当前登录用户 ID（读者），未登录返回 null */
export async function getCurrentUserId(request: Request): Promise<string | null> {
  const token = getCookie(request, USER_COOKIE_NAME);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "user" || !payload.sub) return null;
  return payload.sub as string;
}

/** 从请求中获取当前登录用户名（读者） */
export async function getCurrentUsername(request: Request): Promise<string | null> {
  const token = getCookie(request, USER_COOKIE_NAME);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "user" || !payload.username) return null;
  return payload.username as string;
}

export { USER_COOKIE_NAME };