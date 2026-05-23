// Hive types
export type Status = 'idle' | 'thinking' | 'working' | 'in-meeting' | 'done'

export interface I18nField {
  en: string
  zh: string
}

export interface Agent {
  id: string
  name: string
  emoji: string
  roleKey: string
  specialty: I18nField
  status: Status
  task: I18nField | null
  tasks: number
  avgMs: number
  joinedDays: number
  tilt: number
}

export interface Message {
  from: string
  kind: 'agent' | 'user'
  t: string
  text: I18nField | string
  streaming?: boolean
}

export interface ActivityEntry {
  t: string
  who: string
  verb: I18nField
  detail: I18nField
  tone: Status
}

export interface DecisionEntry {
  en: string
  zh: string
}

export interface ActionItemEntry {
  who: string
  text: I18nField
}

export interface MeetingData {
  topic: I18nField
  startedAt: string
  attendees: string[]
  messages: Message[]
}

// Legacy types for existing API routes
export type AgentStatus = Status | 'error'

export interface Task {
  id: string
  input: string
  assignedTo: string[]
  status: 'pending' | 'running' | 'done'
  createdAt: Date
}

export interface MeetingMessage {
  id: string
  agentId: string
  agentName: string
  agentEmoji: string
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export interface LogEntry {
  id: string
  timestamp: Date
  agentId: string
  agentName: string
  agentEmoji: string
  message: string
  type: 'task' | 'meeting' | 'system' | 'error'
}
