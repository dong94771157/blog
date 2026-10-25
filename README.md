# 我的博客

基于 **Next.js 15 + EdgeOne Makers** 的全栈博客系统，前台展示 + 后台管理一体化，数据存储使用 EdgeOne KV，全球边缘网络加速。

## 功能特性

- **前台**：文章列表（ISR 自动刷新）、文章详情页（Markdown 渲染）、标签展示
- **后台管理**：登录认证、文章增删改查、草稿/发布状态切换、Markdown 编辑器
- **存储**：EdgeOne KV 持久化存储（本地开发自动降级为内存存储，零配置）
- **认证**：基于 Web Crypto API 的 JWT 认证，Edge Runtime 兼容
- **部署**：Git 推送自动部署，全球边缘加速，免费额度可用

## 技术栈

| 项目 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 样式 | Tailwind CSS 3 |
| Markdown | marked |
| 存储 | EdgeOne KV |
| 认证 | JWT (Web Crypto API) |
| 部署 | EdgeOne Makers |

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

打开 http://localhost:3000 查看前台，访问 http://localhost:3000/admin 进入后台。

默认登录账号：`admin` / `admin123`

> 本地开发无需配置 KV，自动使用内存存储模拟，所有后台功能均可完整测试。

### 自定义账号密码

复制 `.env.example` 为 `.env.local` 并修改：

```bash
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=your-password
JWT_SECRET=your-random-secret
```

## 部署到 EdgeOne Makers

### 前置条件

- [腾讯云账号](https://cloud.tencent.com/register)
- 代码已推送到 GitHub / GitLab / Gitee 等 Git 仓库

### 第一步：导入 Git 仓库

1. 访问 [EdgeOne Makers 控制台](https://console.cloud.tencent.com/edgeone/pages)，首次使用点击「立即开通」
2. 点击「GitHub」（或其他 Git 提供商），授权并选择仓库
3. 构建配置已由项目根目录的 `edgeone.json` 自动覆盖，无需手动填写

### 第二步：开始部署

1. 检查配置项无误后，点击「开始部署」
2. 等待构建完成（约 1-2 分钟），部署成功后会分配一个 `*.edgeone.app` 域名
3. 之后每次 `git push` 到部署分支，自动触发重新部署

### 第三步：配置环境变量

进入控制台 **项目设置 > 环境变量**，添加以下变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `ADMIN_USERNAME` | 管理员用户名 | `admin` |
| `ADMIN_PASSWORD` | 管理员密码（务必修改默认值） | `your-strong-password` |
| `JWT_SECRET` | JWT 签名密钥（随机长字符串） | 用下方命令生成 |

生成 JWT_SECRET：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> 配置环境变量后需重新部署一次才能生效。

### 第四步：绑定 KV 存储

博客文章数据需要持久化存储，使用 EdgeOne KV：

1. 进入控制台 **存储 > KV 存储**，点击「立即申请」开通
2. 点击「创建命名空间」，输入名称（如 `blog-data`）
3. 进入 **项目 > KV 存储**，点击「绑定命名空间」
4. **变量名必须填 `BLOG_KV`**（代码中通过此变量名访问）

> 未绑定 KV 时，线上环境数据无法持久化，每次部署后数据会丢失。

### 第五步：绑定自定义域名（可选）

1. 进入控制台 **域名管理**，添加自定义域名
2. 按提示添加 CNAME 解析记录
3. **注意**：加速区域选择「中国大陆」时，域名需完成 ICP 备案；选择「全球（不含中国大陆）」或「海外」则无需备案

## 使用指南

### 写文章

1. 访问 `你的域名/admin/login` 登录
2. 点击「新建文章」
3. 填写标题、内容（支持 Markdown 语法）等字段
4. 勾选「立即发布」或保存为草稿

### Markdown 支持

文章内容支持标准 Markdown + GFM 语法：

```markdown
# 一级标题

## 二级标题

**粗体** *斜体* `行内代码`

- 列表项
- 列表项

> 引用块

```js
console.log("代码块");
```

[链接](https://example.com)
```

## 项目结构

```
├── app/
│   ├── page.tsx              # 首页（文章列表）
│   ├── layout.tsx            # 全局布局
│   ├── posts/[slug]/         # 文章详情页
│   ├── admin/                # 后台管理
│   │   ├── login/            # 登录页
│   │   ├── posts/new/        # 新建文章
│   │   └── posts/[id]/       # 编辑文章
│   └── api/                  # API 路由
│       ├── auth/             # 登录/登出
│       └── posts/            # 文章 CRUD
├── components/
│   └── PostEditor.tsx        # 文章编辑器组件
├── lib/
│   ├── store.ts              # KV 存储抽象层（含本地内存降级）
│   ├── auth.ts               # JWT 认证工具
│   └── types.ts              # 类型定义
├── edgeone.json              # EdgeOne 部署配置
└── .env.example              # 环境变量示例
```

## 常见问题

**Q：本地开发需要配置 KV 吗？**
不需要。本地开发自动使用内存存储模拟，直接 `npm run dev` 即可。

**Q：部署后数据丢失了？**
检查是否已在控制台绑定 KV 命名空间，且变量名为 `BLOG_KV`。未绑定时数据无法持久化。

**Q：前台文章更新不及时？**
前台使用 ISR（60 秒增量静态再生），最长延迟 60 秒后自动刷新。可在后台重新发布文章触发更新。

**Q：忘记后台密码怎么办？**
在控制台环境变量中修改 `ADMIN_PASSWORD`，重新部署后生效。

## License

MIT