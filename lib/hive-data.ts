import { Agent, I18nField, Status } from '@/types'

export function tx(obj: I18nField | string | null | undefined, lang: string): string {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  const field = obj as I18nField
  return (field as unknown as Record<string, string>)[lang] ?? field.en ?? ''
}

export const STATUS_CONFIG: Record<Status, { dotVar: string; textVar: string; glowVar: string | null }> = {
  idle:       { dotVar: '--text-mute',  textVar: '--text-dim',  glowVar: null },
  thinking:   { dotVar: '--amber-soft', textVar: '--amber-soft',glowVar: '--amber-glow' },
  working:    { dotVar: '--amber',      textVar: '--amber',     glowVar: '--amber-glow' },
  'in-meeting':{ dotVar: '--purple',    textVar: '--purple',    glowVar: null },
  done:       { dotVar: '--green',      textVar: '--green',     glowVar: null },
}

export function sv(status: Status, kind: 'dotVar' | 'textVar' | 'glowVar'): string {
  const v = STATUS_CONFIG[status]?.[kind]
  return v ? `var(${v})` : 'transparent'
}

export const AGENTS: Agent[] = [
  { id:'pm-ming',  name:'Ming',   emoji:'🧭', roleKey:'role.pm',
    specialty:{ en:'Roadmap, specs, prioritisation. Translates fuzzy ideas into shippable scope.',
                zh:'路线图、规格、优先级。把模糊的想法翻译成可交付的范围。' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:-2.4 },
  { id:'dev-taro', name:'Taro',   emoji:'⚙️', roleKey:'role.eng',
    specialty:{ en:'Full-stack TypeScript. Loves clean diffs, hates flaky tests.',
                zh:'全栈 TypeScript。喜欢干净的 diff，讨厌不稳定的测试。' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:1.6 },
  { id:'dz-luna',  name:'Luna',   emoji:'✦',  roleKey:'role.design',
    specialty:{ en:'Systems thinker. Builds visual languages, ships pixel-perfect.',
                zh:'系统化思考。构建视觉语言，像素级交付。' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:-1.2 },
  { id:'da-rio',   name:'Rio',    emoji:'⌬',  roleKey:'role.data',
    specialty:{ en:'SQL, dashboards, north-star metrics. Asks "compared to what?"',
                zh:'SQL、看板、北极星指标。爱问"对比的是什么？"' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:2.8 },
  { id:'wr-sage',  name:'Sage',   emoji:'✎',  roleKey:'role.writer',
    specialty:{ en:'Voice & tone, docs, launch copy. Edits ruthlessly.',
                zh:'声调与文风、文档、发布文案。下笔狠。' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:-2.9 },
  { id:'rs-kai',   name:'Kai',    emoji:'◎',  roleKey:'role.research',
    specialty:{ en:'Interview synth, journey maps, opportunity sizing.',
                zh:'访谈综合、用户旅程、机会规模评估。' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:1.9 },
  { id:'qa-owl',   name:'Owl',    emoji:'◉',  roleKey:'role.qa',
    specialty:{ en:'Test plans, edge cases, regression hunting.',
                zh:'测试计划、边缘情况、回归排查。' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:-2.1 },
  { id:'op-bee',   name:'Bee',    emoji:'⬡',  roleKey:'role.ops',
    specialty:{ en:'Procurement, vendor mgmt, internal tooling glue.',
                zh:'采购、供应商管理、内部工具粘合。' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:2.4 },
  { id:'mk-juno',  name:'Juno',   emoji:'△',  roleKey:'role.growth',
    specialty:{ en:'Funnels, paid + organic, copywriting that converts.',
                zh:'漏斗、付费 + 自然增长、能转化的文案。' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:-1.8 },
  { id:'sl-finn',  name:'Finn',   emoji:'➤',  roleKey:'role.sales',
    specialty:{ en:'Discovery, demos, enterprise pipeline.',
                zh:'需求挖掘、演示、企业销售管线。' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:2.1 },
  { id:'sp-iris',  name:'Iris',   emoji:'✺',  roleKey:'role.support',
    specialty:{ en:'Tickets, runbooks, customer empathy.',
                zh:'工单、运行手册、客户同理心。' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:-2.6 },
  { id:'sec-vega', name:'Vega',   emoji:'⌖',  roleKey:'role.security',
    specialty:{ en:'Threat modelling, SOC2, audit prep.',
                zh:'威胁建模、SOC2、审计准备。' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:-2.4 },
  { id:'fn-orion', name:'Orion',  emoji:'∮',  roleKey:'role.finance',
    specialty:{ en:'Budgeting, runway, board pack prep.',
                zh:'预算、现金流、董事会材料。' },
    status:'idle', task:null, tasks:0, avgMs:0, joinedDays:0, tilt:1.4 },
]

