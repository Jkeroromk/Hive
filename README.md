# Hive — AI 多智能体协作平台

> 你的 AI 团队，随时待命。不同的模型，像蜂巢里的工蜂一样各司其职。

Hive 是一个为创始人和 CEO 打造的 AI 多智能体工作平台。14 名 AI 团队成员覆盖产品、工程、设计、数据、市场、销售、财务等职能，可分配任务、召开 AI 会议、协作推进项目。每个成员可以跑在不同的模型上 —— Claude、Meta Muse Spark，或任何 OpenAI 兼容的模型。

---

## 功能亮点

- **多模型团队** — 每个 agent 可以单独指定模型，卡片上直接显示它跑在哪个模型上
- **跨模型审查** — 任务完成后一键让 Muse（Meta Muse Spark）审查；原作者逐条回应采纳或反驳，仍有分歧的地方标成「需要你拍板」
- **14 名专属 AI Agent** — Ming（产品）、Taro（工程）、Luna（设计）、Rio（数据）、Juno（增长）、Orion（财务）、Muse（跨模型审查）等
- **工作区上下文** — 填写一次公司/CEO 信息，所有 Agent 回答时都带着你的业务背景
- **流式任务分配** — 实时 SSE streaming，指派任务后立即看到 AI 输出
- **AI 多人会议室** — 不同模型的 agent 同场讨论；同一轮里后发言的人能看到前面的人说了什么
- **项目管理** — 关联对话、会议记录和文件附件
- **文件上传** — PDF、Word、Excel、图片等，Agent 可读取文件内容作为上下文
- **深色 / 浅色主题、中英双语**

---

## 模型配置

在 `.env.local` 里放你要用的 provider 的 key（完整说明见 `.env.example`）：

| Provider | 环境变量 | 用途 |
|---|---|---|
| Claude | `ANTHROPIC_API_KEY` | 默认团队模型 |
| Meta Muse Spark | `META_API_KEY` | Muse 审查员 |
| Groq / OpenRouter / OpenAI | `GROQ_API_KEY` / `OPENROUTER_API_KEY` / `OPENAI_API_KEY` | 可选 |

决定某个 agent 用哪个模型，优先级从高到低：

1. 环境变量 `HIVE_MODEL_<AGENT_ID>`，如 `HIVE_MODEL_DEV_TARO="anthropic:claude-opus-5-5"`
2. `lib/hive-data.ts` 里该 agent 的 `model` 字段
3. `HIVE_DEFAULT_MODEL`（不设时：有 Claude key 用 Claude Sonnet，否则有 Groq key 用 Llama）

### 加一个新模型当新角色

1. **新 provider**（只有接新的 API 平台时才需要）：在 `types/index.ts` 的 `ProviderId` 加个 id，在 `lib/models.ts` 加显示名，在 `lib/llm/providers.ts` 加一条配置。任何 OpenAI 兼容的接口只需要 `baseURL` + key。
2. **新 agent**：在 `lib/hive-data.ts` 的 `AGENTS` 加一条（可用 `model` 固定模型），在 `lib/agent-prompts.ts` 写它的角色 prompt，在 `lib/i18n.tsx` 加 `role.*` 文案。

---

## 代码结构

```
lib/llm/providers.ts   各 provider 的连接方式（仅服务端）
lib/llm/stream.ts      统一的流式接口：Anthropic Messages + OpenAI 兼容 Chat Completions
lib/llm/review-parse.ts 审查 / 回应 JSON 的容错解析
lib/models.ts          模型简写与显示名（前后端共用，不含 key）
lib/hive-data.ts       agent 名单
lib/agent-prompts.ts   角色 prompt + 审查 prompt
app/api/hive/task      单个 agent 执行任务
app/api/hive/meeting   多 agent 会议
app/api/hive/review    跨模型审查：审查 → 作者回应 → 分歧交给你
app/api/hive/models    每个 agent 实际用的模型 + key 是否已配置
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 App Router |
| AI | Anthropic SDK + OpenAI 兼容接口（Meta、Groq、OpenRouter、OpenAI） |
| 认证 | Clerk v7 |
| 数据库 | PostgreSQL + Prisma |
| 状态管理 | Zustand（持久化） |
| 流式输出 | Server-Sent Events（SSE） |
| 文件解析 | pdf-parse、mammoth、xlsx |
| 样式 | CSS 变量 + Tailwind |

---

## License

MIT
