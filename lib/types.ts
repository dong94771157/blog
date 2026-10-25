// 文章类型定义
export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown 内容
  excerpt: string; // 摘要
  tags: string[];
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

// 创建文章的输入
export interface PostInput {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  published?: boolean;
}

// KV 存储接口（EdgeOne KV 兼容）
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