import { AISettings } from "./types";
import { getAISettings } from "./settings";

// OpenAI 兼容消息格式
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// 各主流厂商 API 预设地址（均兼容 OpenAI /v1/chat/completions 格式）
export const AI_PROVIDER_PRESETS: Record<
  string,
  { apiUrl: string; models: string[]; label: string }
> = {
  openai: {
    apiUrl: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "o4-mini"],
    label: "OpenAI",
  },
  edgeone: {
    // EdgeOne Makers AI 网关（OpenAI 协议兼容）
    // Key 来源（按优先级）：后台填写的 Key > 环境变量 AI_GATEWAY_API_KEY > MAKERS_MODELS_KEY
    // 模型 ID 以 @makers/ 开头，可在 EdgeOne 控制台 Makers/Models 查看可用模型
    apiUrl: "https://ai-gateway.edgeone.link/v1",
    models: [
      "@makers/deepseek-v4-flash",
      "@makers/kimi-k2.6",
      "@makers/glm-4.6",
      "@makers/qwen3-max",
    ],
    label: "EdgeOne AI（腾讯云边缘网关）",
  },
  deepseek: {
    apiUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-reasoner"],
    label: "DeepSeek（深度求索）",
  },
  qwen: {
    apiUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    models: ["qwen-plus", "qwen-turbo", "qwen-max"],
    label: "通义千问（阿里）",
  },
  zhipu: {
    apiUrl: "https://open.bigmodel.cn/api/paas/v4",
    models: ["glm-4-flash", "glm-4-air", "glm-4-plus"],
    label: "智谱清言（GLM）",
  },
  moonshot: {
    apiUrl: "https://api.moonshot.cn/v1",
    models: ["moonshot-v1-8k", "moonshot-v1-32k"],
    label: "月之暗面（Kimi）",
  },
  siliconflow: {
    apiUrl: "https://api.siliconflow.cn/v1",
    models: [
      "Qwen/Qwen2.5-7B-Instruct",
      "deepseek-ai/DeepSeek-V3",
      "THUDM/glm-4-9b-chat",
    ],
    label: "硅基流动（SiliconFlow）",
  },
  ollama: {
    apiUrl: "http://localhost:11434/v1",
    models: ["llama3.2", "qwen2.5", "deepseek-r1"],
    label: "Ollama（本地部署）",
  },
  custom: {
    apiUrl: "",
    models: [],
    label: "自定义接口",
  },
};

/**
 * 解析实际使用的 API Key
 * 优先级：后台填写的 Key > 环境变量 AI_GATEWAY_API_KEY（EdgeOne Makers 自动注入）> MAKERS_MODELS_KEY
 */
export function resolveApiKey(settings: AISettings): string {
  if (settings.apiKey) return settings.apiKey;
  return (
    process.env.AI_GATEWAY_API_KEY ||
    process.env.MAKERS_MODELS_KEY ||
    ""
  );
}

/**
 * 调用 OpenAI 兼容的 Chat Completions 接口
 * 兼容 OpenAI / EdgeOne AI / DeepSeek / 通义千问 / 智谱 / Kimi / SiliconFlow / Ollama 等
 */
export async function chatCompletion(
  settings: AISettings,
  messages: ChatMessage[]
): Promise<string> {
  const apiKey = resolveApiKey(settings);
  if (!apiKey) {
    throw new Error(
      "AI Key 未配置：请在后台填写 API Key，或在 EdgeOne 控制台配置环境变量 AI_GATEWAY_API_KEY"
    );
  }

  // EdgeOne AI 网关要求 model 使用 provider/model 格式（@makers/ 开头）
  // 若后台残留旧格式模型名或为空，自动纠偏为默认内置模型
  let model = (settings.model || "").trim();
  if (settings.provider === "edgeone" && !model.startsWith("@makers/")) {
    model = AI_PROVIDER_PRESETS.edgeone.models[0];
  }

  const url = `${settings.apiUrl.replace(/\/$/, "")}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: settings.temperature,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `AI 接口请求失败 (${res.status}): ${errText.slice(0, 200)}`
    );
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI 返回内容为空");
  }
  return content as string;
}

/**
 * AI 客服对话
 * 自动注入系统提示词和站点上下文
 */
export async function aiChat(
  history: ChatMessage[],
  siteContext?: string
): Promise<string> {
  const settings = await getAISettings();
  if (!settings.enabled) {
    throw new Error("AI 客服未启用");
  }

  const systemMessages: ChatMessage[] = [
    { role: "system", content: settings.systemPrompt },
  ];
  if (siteContext) {
    systemMessages.push({
      role: "system",
      content: `站点信息：${siteContext}`,
    });
  }

  return chatCompletion(settings, [...systemMessages, ...history]);
}

// 审核结果
export interface ModerationResult {
  violated: boolean;
  reason: string;
  category: string;
}

/**
 * AI 留言审核
 * 判断留言是否违规，返回结构化结果
 */
export async function moderateContent(
  content: string,
  authorName: string
): Promise<ModerationResult> {
  const settings = await getAISettings();

  // AI 审核模式
  if (
    settings.moderationEnabled &&
    settings.enabled &&
    resolveApiKey(settings)
  ) {
    try {
      const messages: ChatMessage[] = [
        { role: "system", content: settings.moderationPrompt },
        {
          role: "user",
          content: `昵称：${authorName}\n留言内容：${content}`,
        },
      ];
      const raw = await chatCompletion(
        { ...settings, temperature: 0.1 },
        messages
      );

      // 尝试解析 JSON 结果
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          violated: Boolean(parsed.violated),
          reason: String(parsed.reason || ""),
          category: String(parsed.category || "none"),
        };
      }
    } catch {
      // AI 审核失败，降级到关键词审核
    }
  }

  // 降级：简单关键词审核（AI 未启用或审核失败时）
  const badWords = [
    "赌博", "代开发票", "刷单", "办证", "枪支", "毒品",
    "色情", "裸聊", "约炮", "vpn翻墙", "外挂",
  ];
  const lower = content.toLowerCase();
  const hit = badWords.find((w) => lower.includes(w));
  if (hit) {
    return {
      violated: true,
      reason: `包含违规关键词：${hit}`,
      category: "spam",
    };
  }

  return { violated: false, reason: "", category: "none" };
}