# Hive — Diet Tracking App

## 项目概述
一款 AI 驱动的饮食追踪应用，帮助用户记录每日饮食、分析营养摄入、管理健康目标。

## Tech Stack
| 层级 | 技术 |
|------|------|
| 前端 | React Native (Expo) |
| 后端 | Next.js 14 + Prisma + PostgreSQL |
| 认证 | Clerk |
| 支付 | RevenueCat |
| AI   | Fireworks API + Qwen 模型 |
| 食物数据 | USDA FoodData Central API |

## 目录结构
```
Hive/
├── app/          # React Native Expo 前端
├── backend/      # Next.js API routes
├── prisma/       # 数据库 schema
└── shared/       # 共享类型定义
```

## 编码规范
- 语言: TypeScript，严格模式
- 组件: 函数组件 + React Hooks，禁用 class 组件
- 样式: NativeWind（Tailwind for React Native）
- 命名: 组件 PascalCase，函数 camelCase，常量 UPPER_SNAKE_CASE
- 每个文件只导出一个主组件或函数

## Commit 格式
```
feat(scope): 简短描述
fix(scope): 简短描述
chore(scope): 简短描述
```
scope 可选值: auth, food, diary, ai, payments, ui

## 完成任务后必做
1. 运行 `npm run lint`（如有错误必须修复）
2. 确认新文件有对应的 TypeScript 类型
3. 在 issue 评论中输出: `DONE: <一句话总结做了什么>`

## 重要约束
- 不要修改 `prisma/schema.prisma` 除非 issue 明确要求
- 不要安装新依赖包，除非 issue 明确要求
- API keys 和密钥统一放在 `.env.local`，不要硬编码
- 所有 AI 调用通过 `lib/fireworks.ts` 统一封装
