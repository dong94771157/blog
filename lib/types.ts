// ===== 文章类型 =====
export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  categoryId: string | null;
  coverUrl: string;
  published: boolean;
  // 付费阅读
  paid: boolean;
  price: number;
  freeContent: string; // 免费预览部分（markdown）
  createdAt: number;
  updatedAt: number;
}

export interface PostInput {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  categoryId?: string | null;
  coverUrl?: string;
  published?: boolean;
  paid?: boolean;
  price?: number;
  freeContent?: string;
}

// ===== 分类 =====
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string; // 分类标签颜色
  createdAt: number;
}

// ===== 用户（读者） =====
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar: string; // 头像 URL（可选）
  balance: number; // 账户余额（充值后用于购买文章）
  createdAt: number;
}

// 用户信息（不含敏感字段）
export type PublicUser = Omit<User, "passwordHash">;

// ===== 购买记录 =====
export interface Purchase {
  id: string;
  userId: string;
  postId: string;
  postTitle: string;
  amount: number;
  createdAt: number;
}

// ===== KV 存储接口 =====
export interface KVNamespace {
  get(key: string, options?: { type?: string }): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{
    keys: { key: string }[];
    complete: boolean;
    cursor: string | null;
  }>;
}

// ===== 网站设置 =====
export interface SiteSettings {
  siteName: string;
  domain: string;
  logoUrl: string;
  faviconUrl: string;
  description: string;
  icp: string;
  contact: {
    email: string;
    github: string;
    twitter: string;
    telegram: string;
    qq: string;
    wechat: string;
  };
}

export const defaultSiteSettings: SiteSettings = {
  siteName: "我的博客",
  domain: "",
  logoUrl: "",
  faviconUrl: "",
  description: "记录技术与生活",
  icp: "",
  contact: {
    email: "",
    github: "",
    twitter: "",
    telegram: "",
    qq: "",
    wechat: "",
  },
};

// ===== 通知配置 =====
export interface NotifySettings {
  smtp: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    to: string;
  };
  feishu: {
    enabled: boolean;
    webhook: string;
    secret: string;
  };
  wecom: {
    enabled: boolean;
    webhook: string;
  };
  telegram: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
}

export const defaultNotifySettings: NotifySettings = {
  smtp: {
    enabled: false,
    host: "",
    port: 465,
    secure: true,
    user: "",
    pass: "",
    from: "",
    to: "",
  },
  feishu: { enabled: false, webhook: "", secret: "" },
  wecom: { enabled: false, webhook: "" },
  telegram: { enabled: false, botToken: "", chatId: "" },
};

// ===== 支付配置 =====
export interface PaymentSettings {
  epay: {
    enabled: boolean;
    apiUrl: string;
    pid: string;
    key: string;
  };
  wechat: {
    enabled: boolean;
    appId: string;
    mchId: string;
    apiV3Key: string;
    serialNo: string;
    privateKey: string;
  };
  alipay: {
    enabled: boolean;
    appId: string;
    privateKey: string;
    alipayPublicKey: string;
  };
  donate: {
    enabled: boolean;
    title: string;
    amounts: number[];
    customAmount: boolean;
  };
}

export const defaultPaymentSettings: PaymentSettings = {
  epay: { enabled: false, apiUrl: "", pid: "", key: "" },
  wechat: {
    enabled: false,
    appId: "",
    mchId: "",
    apiV3Key: "",
    serialNo: "",
    privateKey: "",
  },
  alipay: {
    enabled: false,
    appId: "",
    privateKey: "",
    alipayPublicKey: "",
  },
  donate: {
    enabled: false,
    title: "赞赏支持",
    amounts: [5, 10, 20, 50, 100],
    customAmount: true,
  },
};

// ===== 订单 =====
export interface Order {
  id: string;
  outTradeNo: string;
  channel: "epay" | "wechat" | "alipay";
  amount: number;
  message: string;
  status: "pending" | "paid" | "failed";
  createdAt: number;
  paidAt: number | null;
}