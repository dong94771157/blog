import { NextRequest, NextResponse } from "next/server";
import { aiChat, resolveApiKey, type ChatMessage } from "@/lib/ai";
import { getAISettings, getSiteSettings } from "@/lib/settings";

// AI 客服对话接口
// GET：检查 AI 客服是否启用（前端决定是否显示悬浮按钮）
export async function GET() {
  const settings = await getAISettings();
  return NextResponse.json({
    enabled: settings.enabled && Boolean(resolveApiKey(settings)),
  });
}

// POST：对话
export async function POST(request: NextRequest) {
  const settings = await getAISettings();

  if (!settings.enabled) {
    return NextResponse.json(
      { error: "AI 客服未启用，请联系站长开启" },
      { status: 503 }
    );
  }

  if (!resolveApiKey(settings)) {
    return NextResponse.json(
      { error: "AI 接口未配置，请联系站长" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const messages: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages
          .filter(
            (m: { role: string; content: string }) =>
              m &&
              ["user", "assistant"].includes(m.role) &&
              typeof m.content === "string"
          )
          .slice(-20) // 最多保留最近 20 条，防止 token 超限
          .map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content.slice(0, 2000), // 单条消息限长
          }))
      : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }

    // 构建站点上下文
    const site = await getSiteSettings();
    const siteContext = `网站名：${site.siteName}，描述：${site.description}`;

    const reply = await aiChat(messages, siteContext);

    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "AI 回复失败，请稍后重试",
      },
      { status: 500 }
    );
  }
}