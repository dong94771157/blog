// ===== 软件下载 =====
export interface DownloadItem {
  id: string;
  name: string; // 软件名称
  url: string; // 下载链接
  size: string; // 文件大小（如 "12.5 MB"）
  platform: string; // 平台（如 "Windows" / "macOS" / "Android"）
  version: string; // 版本号
  note: string; // 备注（如 "含激活教程"）
  // 付费下载
  paid: boolean; // 是否付费下载
  price: number; // 下载价格（元，paid 为 true 时生效）
}

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
  // 软件下载
  downloads: DownloadItem[];
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
  downloads?: DownloadItem[];
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
  // 下载项购买（文章整体购买时为空）
  downloadId?: string;
  downloadName?: string;
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
  // SEO 与作者
  author: string; // 站长/作者名
  keywords: string; // SEO 关键词（逗号分隔）
  // 功能开关
  commentEnabled: boolean; // 留言功能开关
  registrationEnabled: boolean; // 读者注册开关
  // 站长挂件
  avatarUrl: string; // 挂件头像（留空使用默认伤感男孩形象）
  ownerBio: string; // 站长一句话简介
  // 页脚
  footerText: string; // 自定义页脚文案（留空显示默认）
  contact: {
    email: string;
    github: string;
    twitter: string;
    telegram: string;
    qq: string;
    wechat: string;
    bilibili: string; // B站主页
  };
}

export const defaultSiteSettings: SiteSettings = {
  siteName: "我的博客",
  domain: "",
  logoUrl: "",
  faviconUrl: "",
  description: "记录技术与生活",
  icp: "",
  author: "",
  keywords: "",
  commentEnabled: true,
  registrationEnabled: true,
  footerText: "",
  avatarUrl: "",
  ownerBio: "一个深夜写代码的伤感男孩，用文字记录孤独与温柔。",
  contact: {
    email: "",
    github: "",
    twitter: "",
    telegram: "",
    qq: "",
    wechat: "",
    bilibili: "",
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
  // 通用设置
  general: {
    rechargeEnabled: boolean; // 余额充值功能开关
    minRecharge: number; // 最低充值金额
    maxRecharge: number; // 最高充值金额
  };
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
    gateway: string; // 网关地址（正式/沙箱）
  };
  donate: {
    enabled: boolean;
    title: string;
    desc: string; // 赞赏说明文案
    wechatQr: string; // 微信收款码图片 URL
    alipayQr: string; // 支付宝收款码图片 URL
  };
}

export const defaultPaymentSettings: PaymentSettings = {
  general: {
    rechargeEnabled: true,
    minRecharge: 1,
    maxRecharge: 1000,
  },
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
    gateway: "https://openapi.alipay.com/gateway.do",
  },
  donate: {
    enabled: false,
    title: "赞赏支持",
    desc: "如果文章对你有帮助，可以请我喝杯咖啡~",
    wechatQr: "",
    alipayQr: "",
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
  type: "donate" | "recharge"; // 订单类型：赞赏 / 充值
  userId: string | null; // 充值订单关联的用户
  createdAt: number;
  paidAt: number | null;
}

// ===== AI 配置 =====
export interface AISettings {
  enabled: boolean; // AI 客服总开关
  provider: "openai" | "deepseek" | "qwen" | "zhipu" | "moonshot" | "siliconflow" | "ollama" | "custom";
  apiUrl: string; // API 基础地址（如 https://api.openai.com/v1）
  apiKey: string;
  model: string; // 模型名（如 gpt-4o-mini / deepseek-chat）
  systemPrompt: string; // 客服人设提示词
  temperature: number;
  // 留言 AI 审核
  moderationEnabled: boolean; // AI 自动审核留言开关
  autoApprove: boolean; // 无违规时自动通过（否则进入待审核）
  moderationPrompt: string; // 审核提示词（可自定义规则）
  notifyOnViolation: boolean; // 发现违规时邮件通知站长
}

export const defaultAISettings: AISettings = {
  enabled: false,
  provider: "openai",
  apiUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  systemPrompt:
    "你是一个友好可爱的二次元博客客服助手，名字叫小樱。用亲切的语气回答访客关于博客内容、付费阅读、软件下载等问题。回答要简洁有趣，可以适当使用表情符号。如果不知道答案，请引导用户联系站长。",
  temperature: 0.7,
  moderationEnabled: false,
  autoApprove: true,
  moderationPrompt:
    "你是一个内容审核员。请判断以下留言是否包含：1.广告/垃圾信息 2.辱骂/人身攻击 3.色情/低俗内容 4.政治敏感/违法违规内容 5.诈骗/钓鱼链接。只回复JSON格式：{\"violated\":true/false,\"reason\":\"违规原因(无违规则为空)\",\"category\":\"spam/abuse/porn/political/scam/none\"}",
  notifyOnViolation: true,
};

// ===== 留言 =====
export interface Comment {
  id: string;
  postId: string;
  postTitle: string;
  userId: string | null; // 已登录用户 ID
  authorName: string; // 昵称（未登录时手填）
  content: string;
  status: "pending" | "approved" | "rejected";
  aiReview: {
    violated: boolean;
    reason: string;
    category: string;
  } | null;
  createdAt: number;
}

// ===== 友情链接 =====
export interface FriendLink {
  id: string;
  name: string; // 站点名称
  url: string; // 站点地址
  logo: string; // 站点 Logo/头像 URL（可选）
  desc: string; // 站点描述
  status: "pending" | "approved" | "rejected";
  createdAt: number;
}

// ===== 产品/服务推荐 =====
export interface ProductPromo {
  id: string;
  title: string; // 产品名称
  desc: string; // 推荐语
  image: string; // 封面图 URL
  url: string; // 购买/了解链接
  price: string; // 价格描述（如 "¥99/年" / "免费"）
  badge: string; // 角标（如 "限时优惠" / "推荐"）
  sort: number; // 排序（越小越靠前）
  enabled: boolean; // 是否展示
  createdAt: number;
}