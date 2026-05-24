'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TaskRecord {
  id: string
  agentId: string
  agentName: string
  agentEmoji: string
  task: string
  output: string
  timestamp: number
}

export interface HiveMeetingMessage {
  id: string
  from: string
  kind: 'agent' | 'user'
  t: string
  text: string
}

export interface MeetingRecord {
  id: string
  topic: string
  participantIds: string[]
  messages: HiveMeetingMessage[]
  startedAt: number
  endedAt?: number
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  requestCount: number
}

export interface WorkspaceContext {
  ceoName: string
  companyName: string
  industry: string
  mission: string
  stage: string
  teamSize: string
  topPriorities: string
  commStyle: string
}

interface HiveStore {
  taskHistory: TaskRecord[]
  addTaskRecord: (r: TaskRecord) => void
  clearTaskHistory: () => void

  theme: string
  setTheme: (t: string) => void
  lang: string
  setLang: (l: string) => void

  workspace: WorkspaceContext | null
  setWorkspace: (w: WorkspaceContext) => void

  tokenUsage: TokenUsage
  addTokenUsage: (prompt: number, completion: number) => void
  resetTokenUsage: () => void

  meetingHistory: MeetingRecord[]
  startMeeting: (id: string, topic: string, participantIds: string[]) => void
  addMeetingMessage: (meetingId: string, msg: HiveMeetingMessage) => void
  appendToLastMeetingMessage: (meetingId: string, text: string) => void
  sealLastMeetingMessage: (meetingId: string) => void
  endCurrentMeeting: (meetingId: string) => void
  clearMeetingHistory: () => void
}

export const useHiveStore = create<HiveStore>()(
  persist(
    (set) => ({
      taskHistory: [],
      addTaskRecord: (r) =>
        set((s) => ({ taskHistory: [r, ...s.taskHistory].slice(0, 200) })),
      clearTaskHistory: () => set({ taskHistory: [] }),

      theme: 'dark',
      setTheme: (t) => set({ theme: t }),
      lang: 'zh',
      setLang: (l) => set({ lang: l }),

      workspace: null,
      setWorkspace: (w) => set({ workspace: w }),

      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, requestCount: 0 },
      addTokenUsage: (prompt, completion) =>
        set((s) => ({
          tokenUsage: {
            promptTokens:    s.tokenUsage.promptTokens    + prompt,
            completionTokens:s.tokenUsage.completionTokens + completion,
            totalTokens:     s.tokenUsage.totalTokens     + prompt + completion,
            requestCount:    s.tokenUsage.requestCount    + 1,
          },
        })),
      resetTokenUsage: () =>
        set({ tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, requestCount: 0 } }),

      meetingHistory: [],
      startMeeting: (id, topic, participantIds) =>
        set((s) => ({
          meetingHistory: [
            { id, topic, participantIds, messages: [], startedAt: Date.now() },
            ...s.meetingHistory,
          ].slice(0, 50),
        })),
      addMeetingMessage: (meetingId, msg) =>
        set((s) => ({
          meetingHistory: s.meetingHistory.map((m) =>
            m.id === meetingId ? { ...m, messages: [...m.messages, msg] } : m
          ),
        })),
      appendToLastMeetingMessage: (meetingId, text) =>
        set((s) => ({
          meetingHistory: s.meetingHistory.map((m) => {
            if (m.id !== meetingId) return m
            const msgs = [...m.messages]
            if (msgs.length === 0) return m
            const last = msgs[msgs.length - 1]
            msgs[msgs.length - 1] = { ...last, text: last.text + text }
            return { ...m, messages: msgs }
          }),
        })),
      sealLastMeetingMessage: (meetingId) =>
        set((s) => ({
          meetingHistory: s.meetingHistory.map((m) =>
            m.id === meetingId ? { ...m } : m
          ),
        })),
      endCurrentMeeting: (meetingId) =>
        set((s) => ({
          meetingHistory: s.meetingHistory.map((m) =>
            m.id === meetingId ? { ...m, endedAt: Date.now() } : m
          ),
        })),
      clearMeetingHistory: () => set({ meetingHistory: [] }),
    }),
    { name: 'hive-v1' }
  )
)
