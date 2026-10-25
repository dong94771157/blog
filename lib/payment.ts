import { PaymentSettings, Order } from "./types";
import { getPaymentSettings, createOrder, getOrder, updateOrder } from "./settings";
import { getUserById, updateUser } from "./store";

// ---- 工具函数 ----
function generateTradeNo(): string {
  const now = new Date();
  const date = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `BLOG${date}${rand}`;
}

async function md5(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest("MD5", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Web Crypto 不支持 MD5，使用纯 JS 实现
function md5Sync(input: string): string {
  // 简易 MD5 实现（适用于易支付签名）
  function md5cycle(x: number[], k: number[]) {
    let [a, b, c, d] = x;
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019807793);
    c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
  }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function add32(a: number, b: number) {
    return (a + b) & 0xffffffff;
  }
  function md5blk(s: string) {
    const md5blks: number[] = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  function rhex(n: number) {
    const hexChr = "0123456789abcdef";
    let s = "";
    for (let j = 0; j < 4; j++) {
      s += hexChr.charAt((n >> (j * 8 + 4)) & 0x0f) + hexChr.charAt((n >> (j * 8)) & 0x0f);
    }
    return s;
  }
  function hex(x: number[]) {
    return x.map(rhex).join("");
  }
  function md51(s: string) {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i: number;
    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    const tail = new Array(16).fill(0);
    for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0; }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  // 处理 UTF-8
  const utf8 = unescape(encodeURIComponent(input));
  return hex(md51(utf8));
}

// RSA-SHA256 签名（用于支付宝/微信支付）
async function rsaSign(data: string, privateKeyPem: string): Promise<string> {
  const pemContents = privateKeyPem
    .replace(/-----BEGIN[^-]+-----/, "")
    .replace(/-----END[^-]+-----/, "")
    .replace(/\s/g, "");
  const binaryDer = atob(pemContents);
  const derBytes = new Uint8Array(binaryDer.length);
  for (let i = 0; i < binaryDer.length; i++) derBytes[i] = binaryDer.charCodeAt(i);

  const key = await crypto.subtle.importKey(
    "pkcs8",
    derBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// 订单附加选项
export interface OrderOptions {
  type?: "donate" | "recharge";
  userId?: string | null;
}

// ---- 易支付 ----
export async function createEpayOrder(
  amount: number,
  message: string,
  origin: string,
  options?: OrderOptions
): Promise<{ payUrl: string; outTradeNo: string }> {
  const settings = await getPaymentSettings();
  const { apiUrl, pid, key } = settings.epay;
  if (!apiUrl || !pid || !key) throw new Error("易支付配置不完整");

  const orderType = options?.type || "donate";
  const outTradeNo = generateTradeNo();
  const params: Record<string, string> = {
    pid,
    type: "alipay", // 默认支付宝，前端可切换
    out_trade_no: outTradeNo,
    notify_url: `${origin}/api/payment/notify/epay`,
    return_url: `${origin}/api/payment/return`,
    name: orderType === "recharge" ? `余额充值 ¥${amount}` : `博客赞赏 ¥${amount}`,
    money: amount.toFixed(2),
  };

  // MD5 签名：按参数名 ASCII 排序拼接
  const sorted = Object.keys(params).sort();
  const signStr = sorted.map((k) => `${k}=${params[k]}`).join("&") + key;
  params.sign = md5Sync(signStr);
  params.sign_type = "MD5";

  // 保存订单
  const order: Order = {
    id: outTradeNo,
    outTradeNo,
    channel: "epay",
    amount,
    message,
    status: "pending",
    type: orderType,
    userId: options?.userId || null,
    createdAt: Date.now(),
    paidAt: null,
  };
  await createOrder(order);

  const query = new URLSearchParams(params).toString();
  return { payUrl: `${apiUrl}/submit.php?${query}`, outTradeNo };
}

// ---- 微信支付 Native（扫码）----
export async function createWechatOrder(
  amount: number,
  message: string,
  origin: string,
  options?: OrderOptions
): Promise<{ codeUrl: string; outTradeNo: string }> {
  const settings = await getPaymentSettings();
  const { appId, mchId, apiV3Key, serialNo, privateKey } = settings.wechat;
  if (!appId || !mchId || !apiV3Key || !privateKey) throw new Error("微信支付配置不完整");

  const orderType = options?.type || "donate";
  const outTradeNo = generateTradeNo();
  const body = {
    appid: appId,
    mchid: mchId,
    description: orderType === "recharge" ? `余额充值 ¥${amount}` : `博客赞赏 ¥${amount}`,
    out_trade_no: outTradeNo,
    notify_url: `${origin}/api/payment/notify/wechat`,
    amount: { total: Math.round(amount * 100), currency: "CNY" },
  };

  // V3 签名
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = outTradeNo;
  const signature = await rsaSign(`${timestamp}\n${nonce}\nPOST\n/v3/pay/transactions/native\n${JSON.stringify(body)}\n`, privateKey);
  const authHeader = `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${serialNo}",signature="${signature}"`;

  const res = await fetch("https://api.mch.weixin.qq.com/v3/pay/transactions/native", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.code_url) throw new Error(data.message || "微信支付下单失败");

  const order: Order = {
    id: outTradeNo,
    outTradeNo,
    channel: "wechat",
    amount,
    message,
    status: "pending",
    type: orderType,
    userId: options?.userId || null,
    createdAt: Date.now(),
    paidAt: null,
  };
  await createOrder(order);

  return { codeUrl: data.code_url, outTradeNo };
}

// ---- 支付宝当面付 ----
export async function createAlipayOrder(
  amount: number,
  message: string,
  origin: string,
  options?: OrderOptions
): Promise<{ qrCode: string; outTradeNo: string }> {
  const settings = await getPaymentSettings();
  const { appId, privateKey, gateway } = settings.alipay;
  if (!appId || !privateKey) throw new Error("支付宝配置不完整");

  const orderType = options?.type || "donate";
  const outTradeNo = generateTradeNo();
  const bizContent = JSON.stringify({
    out_trade_no: outTradeNo,
    total_amount: amount.toFixed(2),
    subject: orderType === "recharge" ? `余额充值 ¥${amount}` : `博客赞赏 ¥${amount}`,
    body: message || "博客赞赏",
  });

  const params: Record<string, string> = {
    app_id: appId,
    method: "alipay.trade.precreate",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
    version: "1.0",
    notify_url: `${origin}/api/payment/notify/alipay`,
    biz_content: bizContent,
  };

  // RSA2 签名
  const sorted = Object.keys(params).sort();
  const signStr = sorted.map((k) => `${k}=${params[k]}`).join("&");
  params.sign = await rsaSign(signStr, privateKey);

  const res = await fetch(gateway || "https://openapi.alipay.com/gateway.do", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const data = await res.json();
  const resp = data.alipay_trade_precreate_response;
  if (!resp || !resp.qr_code) throw new Error(resp?.sub_msg || resp?.msg || "支付宝下单失败");

  const order: Order = {
    id: outTradeNo,
    outTradeNo,
    channel: "alipay",
    amount,
    message,
    status: "pending",
    type: orderType,
    userId: options?.userId || null,
    createdAt: Date.now(),
    paidAt: null,
  };
  await createOrder(order);

  return { qrCode: resp.qr_code, outTradeNo };
}

// ---- 回调验证 ----
export async function verifyEpayNotify(params: Record<string, string>): Promise<boolean> {
  const settings = await getPaymentSettings();
  const { key } = settings.epay;
  const sign = params.sign;
  if (!sign) return false;
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sorted = Object.keys(filtered).sort();
  const signStr = sorted.map((k) => `${k}=${filtered[k]}`).join("&") + key;
  return md5Sync(signStr) === sign;
}

export async function markOrderPaid(outTradeNo: string): Promise<Order | null> {
  const existing = await getOrder(outTradeNo);
  if (!existing || existing.status === "paid") return existing;

  const order = await updateOrder(outTradeNo, { status: "paid", paidAt: Date.now() });
  if (!order) return null;

  // 充值订单：给用户加余额
  if (order.type === "recharge" && order.userId) {
    const user = await getUserById(order.userId);
    if (user) {
      await updateUser(user.id, { balance: user.balance + order.amount });
    }
  }

  return order;
}

// RSA-SHA256 验签（用于支付宝回调）
async function rsaVerify(data: string, signatureB64: string, publicKeyPem: string): Promise<boolean> {
  let pem = publicKeyPem.trim();
  if (!pem.includes("-----BEGIN")) {
    pem = `-----BEGIN PUBLIC KEY-----\n${pem}\n-----END PUBLIC KEY-----`;
  }
  const pemContents = pem
    .replace(/-----BEGIN[^-]+-----/, "")
    .replace(/-----END[^-]+-----/, "")
    .replace(/\s/g, "");
  const binaryDer = atob(pemContents);
  const derBytes = new Uint8Array(binaryDer.length);
  for (let i = 0; i < binaryDer.length; i++) derBytes[i] = binaryDer.charCodeAt(i);

  const key = await crypto.subtle.importKey(
    "spki",
    derBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = Uint8Array.from(atob(signatureB64), (c) => c.charCodeAt(0));
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sigBytes, new TextEncoder().encode(data));
}

// AES-256-GCM 解密（用于微信支付 V3 回调）
async function decryptAes256Gcm(ciphertextB64: string, associatedData: string, keyStr: string): Promise<string> {
  const keyBytes = new TextEncoder().encode(keyStr);
  const cipherBytes = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
  const iv = cipherBytes.slice(0, 12);
  const data = cipherBytes.slice(12);
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(associatedData) },
    key,
    data
  );
  return new TextDecoder().decode(decrypted);
}

// ---- 微信支付回调解析 ----
export async function parseWechatNotify(body: {
  event_type?: string;
  resource?: { ciphertext: string; associated_data: string };
}): Promise<{ outTradeNo: string; tradeState: string } | null> {
  if (!body.resource?.ciphertext) return null;
  const settings = await getPaymentSettings();
  try {
    const plain = await decryptAes256Gcm(
      body.resource.ciphertext,
      body.resource.associated_data || "",
      settings.wechat.apiV3Key
    );
    const data = JSON.parse(plain);
    return {
      outTradeNo: data.out_trade_no || "",
      tradeState: data.trade_state || "",
    };
  } catch {
    return null;
  }
}

// ---- 支付宝回调验签 ----
export async function verifyAlipayNotify(params: Record<string, string>): Promise<boolean> {
  const settings = await getPaymentSettings();
  const { alipayPublicKey } = settings.alipay;
  const sign = params.sign;
  if (!sign || !alipayPublicKey) return false;
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sorted = Object.keys(filtered).sort();
  const signStr = sorted.map((k) => `${k}=${filtered[k]}`).join("&");
  try {
    return await rsaVerify(signStr, sign, alipayPublicKey);
  } catch {
    return false;
  }
}

export { generateTradeNo };