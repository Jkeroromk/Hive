# Hive — AI 多智能体协作平台

> 你的 AI 团队，随时待命。

Hive 是一个为创始人和 CEO 打造的 AI 多智能体工作平台。13 名专属 AI 团队成员各司其职，涵盖产品、工程、设计、数据、市场、销售、财务等职能，可分配任务、召开 AI 会议、协作推进项目。

---

## 功能亮点

- **13 名专属 AI Agent** — Ming（产品）、Taro（工程）、Luna（设计）、Rio（数据）、Juno（增长）、Orion（财务）等，每人有明确的专业边界和独立视角
- **工作区上下文** — 填写一次公司/CEO 信息，所有 Agent 回答时都带着你的业务背景
- **流式任务分配** — 实时 SSE streaming，指派任务后立即看到 AI 输出
- **AI 多人会议室** — 发起会议话题，多名 Agent 各自发言、互不重复，形成真实讨论
- **项目管理** — 关联对话、会议记录和文件附件，完整追踪项目进展
- **文件上传** — 支持 PDF、Word、Excel、图片等格式，Agent 可读取文件内容作为上下文
- **用量统计** — 实时显示 Token 消耗、请求次数，按 Groq 付费价估算成本
- **深色 / 浅色主题** — 跟随偏好，持久化保存
- **中英双语** — 完整 i18n 支持，一键切换

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 App Router |
| AI | Groq API（llama-3.3-70b-versatile）|
| 认证 | Clerk v7 |
| 数据库 | PostgreSQL + Prisma |
| 状态管理 | Zustand（持久化） |
| 流式输出 | Server-Sent Events（SSE）|
| 文件解析 | pdf-parse、mammoth、xlsx |
| 样式 | CSS 变量 + Tailwind |

---

## 快速开始

### 1. 克隆并安装依赖

```bash
git clone https://github.com/Jkeroromk/Hive.git
cd Hive
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，填入以下信息：

```bash
cp .env.example .env.local
```

```env
# Groq — 免费注册：https://console.groq.com → API Keys
GROQ_API_KEY=gsk_...

# Clerk — 免费注册：https://clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# 数据库 — 推荐 Neon（免费）：https://neon.tech
DATABASE_URL=postgresql://...
```

### 3. 初始化数据库

```bash
npx prisma db push
```

### 4. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

---

## 使用指南

1. **注册登录** — 首次访问自动跳转登录页
2. **设置工作区** — 点击右上角 ⚙️，填写公司名称、使命、当前优先级，Agent 会基于此背景回答
3. **分配任务** — 点击 Agent 卡片上的「任务」按钮，输入指令，实时查看 AI 输出
4. **召开会议** — 点击「会议」Tab，填写议题，选择参会 Agent，启动多人 AI 讨论
5. **项目管理** — 点击「项目」Tab，创建项目，关联对话和会议记录
6. **查看用量** — 设置 → 用量统计，查看 Token 消耗和请求次数

---

## 部署

推荐一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Jkeroromk/Hive)

部署时在 Vercel 环境变量面板填入上述所有 env 变量即可。

---

## 免费额度参考

| 服务 | 免费额度 |
|------|---------|
| Groq | ~6,000 请求/天，约 500K tokens/天 |
| Clerk | 10,000 月活用户 |
| Neon | 0.5 GB 存储，无限请求 |
| Vercel | 100GB 带宽/月 |

---

## License

MIT
