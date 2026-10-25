import { NotifySettings } from "./types";
import { getNotifySettings } from "./settings";

export interface NotifyMessage {
  title: string;
  content: string;
  url?: string;
}

export interface NotifyResult {
  channel: string;
  success: boolean;
  error?: string;
}

// ---- SMTP 邮件 ----
async function sendSmtp(settings: NotifySettings["smtp"], msg: NotifyMessage): Promise<void> {
  // 动态引入 nodemailer（EdgeOne 云函数环境需配置 externalNodeModules）
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: { user: settings.user, pass: settings.pass },
  });
  await transporter.sendMail({
    from: settings.from || settings.user,
    to: settings.to,
    subject: msg.title,
    html: `<h2>${msg.title}</h2><p>${msg.content}</p>${msg.url ? `<p><a href="${msg.url}">查看详情</a></p>` : ""}`,
  });
}

// ---- 飞书 ----
async function sendFeishu(settings: NotifySettings["feishu"], msg: NotifyMessage): Promise<void> {
  const body: Record<string, unknown> = {
    msg_type: "text",
    content: { text: `${msg.title}\n${msg.content}${msg.url ? `\n${msg.url}` : ""}` },
  };
  // 签名（如果配置了 secret）
  if (settings.secret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(settings.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}\n${settings.secret}`));
    const sign = btoa(String.fromCharCode(...new Uint8Array(sig)));
    body.timestamp = timestamp;
    body.sign = sign;
  }
  const res = await fetch(settings.webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.code !== 0 && data.StatusCode !== 0) {
    throw new Error(data.msg || data.StatusMessage || "飞书发送失败");
  }
}

// ---- 企业微信 ----
async function sendWecom(settings: NotifySettings["wecom"], msg: NotifyMessage): Promise<void> {
  const res = await fetch(settings.webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msgtype: "text",
      text: {
        content: `${msg.title}\n${msg.content}${msg.url ? `\n${msg.url}` : ""}`,
      },
    }),
  });
  const data = await res.json();
  if (data.errcode !== 0) {
    throw new Error(data.errmsg || "企业微信发送失败");
  }
}

// ---- Telegram ----
async function sendTelegram(settings: NotifySettings["telegram"], msg: NotifyMessage): Promise<void> {
  const text = `*${msg.title}*\n${msg.content}${msg.url ? `\n${msg.url}` : ""}`;
  const res = await fetch(
    `https://api.telegram.org/bot${settings.botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: settings.chatId,
        text,
        parse_mode: "Markdown",
      }),
    }
  );
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || "Telegram 发送失败");
  }
}

/**
 * 发送通知到所有已启用的渠道
 */
export async function sendNotification(msg: NotifyMessage): Promise<NotifyResult[]> {
  const settings = await getNotifySettings();
  const results: NotifyResult[] = [];

  const tasks: { channel: string; enabled: boolean; fn: () => Promise<void> }[] = [
    {
      channel: "smtp",
      enabled: settings.smtp.enabled,
      fn: () => sendSmtp(settings.smtp, msg),
    },
    {
      channel: "feishu",
      enabled: settings.feishu.enabled,
      fn: () => sendFeishu(settings.feishu, msg),
    },
    {
      channel: "wecom",
      enabled: settings.wecom.enabled,
      fn: () => sendWecom(settings.wecom, msg),
    },
    {
      channel: "telegram",
      enabled: settings.telegram.enabled,
      fn: () => sendTelegram(settings.telegram, msg),
    },
  ];

  for (const task of tasks) {
    if (!task.enabled) continue;
    try {
      await task.fn();
      results.push({ channel: task.channel, success: true });
    } catch (err) {
      results.push({
        channel: task.channel,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

/**
 * 测试指定渠道的通知
 */
export async function testNotification(channel: string): Promise<NotifyResult> {
  const settings = await getNotifySettings();
  const msg: NotifyMessage = {
    title: "🔔 博客通知测试",
    content: "恭喜！通知渠道配置成功，这是一条测试消息。",
  };

  try {
    switch (channel) {
      case "smtp":
        if (!settings.smtp.enabled) throw new Error("SMTP 未启用");
        await sendSmtp(settings.smtp, msg);
        break;
      case "feishu":
        if (!settings.feishu.enabled) throw new Error("飞书未启用");
        await sendFeishu(settings.feishu, msg);
        break;
      case "wecom":
        if (!settings.wecom.enabled) throw new Error("企业微信未启用");
        await sendWecom(settings.wecom, msg);
        break;
      case "telegram":
        if (!settings.telegram.enabled) throw new Error("Telegram 未启用");
        await sendTelegram(settings.telegram, msg);
        break;
      default:
        throw new Error(`未知渠道: ${channel}`);
    }
    return { channel, success: true };
  } catch (err) {
    return {
      channel,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 文章发布通知
 */
export async function notifyNewPost(title: string, slug: string, siteName: string, origin?: string): Promise<void> {
  const base = origin || "";
  await sendNotification({
    title: `📝 ${siteName} 发布了新文章`,
    content: title,
    url: `${base}/posts/${slug}`,
  });
}

/**
 * 赞赏通知
 */
export async function notifyDonation(amount: number, message: string, siteName: string): Promise<void> {
  await sendNotification({
    title: `💰 ${siteName} 收到赞赏`,
    content: `金额：¥${amount}\n留言：${message || "无"}`,
  });
}