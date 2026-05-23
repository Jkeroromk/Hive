// @ts-nocheck
import { create } from 'zustand'
import { Agent, Task, MeetingMessage, LogEntry } from '@/types'
import { DEFAULT_AGENTS } from './agents'

interface OfficeStore {
  agents: Agent[]
  updateAgentStatus: (agentId: string, status: Agent['status'], currentTask?: string, lastOutput?: string) => void

  tasks: Task[]
  addTask: (task: Task) => void

  isMeetingActive: boolean
  meetingTopic: string
  meetingMessages: MeetingMessage[]
  startMeeting: (topic: string) => void
  endMeeting: () => void
  addMeetingMessage: (msg: MeetingMessage) => void
  updateLastMeetingMessage: (content: string) => void

  logs: LogEntry[]
  addLog: (log: LogEntry) => void

  selectedAgents: string[]
  toggleAgentSelection: (agentId: string) => void
  clearSelection: () => void

  activePanel: 'task' | 'meeting' | null
  setActivePanel: (panel: 'task' | 'meeting' | null) => void
}

export const useOfficeStore = create<OfficeStore>((set, get) => ({
  agents: DEFAULT_AGENTS,

  updateAgentStatus: (agentId, status, currentTask, lastOutput) =>
    set(state => ({
      agents: state.agents.map(a =>
        a.id === agentId
          ? { ...a, status, currentTask, lastOutput: lastOutput ?? a.lastOutput }
          : a
      ),
    })),

  tasks: [],
  addTask: (task) => set(state => ({ tasks: [task, ...state.tasks] })),

  isMeetingActive: false,
  meetingTopic: '',
  meetingMessages: [],
  startMeeting: (topic) => set({ isMeetingActive: true, meetingTopic: topic, meetingMessages: [] }),
  endMeeting: () => {
    const { agents } = get()
    set({
      isMeetingActive: false,
      agents: agents.map(a =>
        a.status === 'in-meeting' ? { ...a, status: 'idle', currentTask: undefined } : a
      ),
    })
  },
  addMeetingMessage: (msg) =>
    set(state => ({ meetingMessages: [...state.meetingMessages, msg] })),
  updateLastMeetingMessage: (text) =>
    set(state => {
      const msgs = [...state.meetingMessages]
      if (msgs.length > 0) {
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content: msgs[msgs.length - 1].content + text,
          isStreaming: true,
        }
      }
      return { meetingMessages: msgs }
    }),

  logs: [],
  addLog: (log) => set(state => ({ logs: [log, ...state.logs].slice(0, 100) })),

  selectedAgents: [],
  toggleAgentSelection: (agentId) =>
    set(state => ({
      selectedAgents: state.selectedAgents.includes(agentId)
        ? state.selectedAgents.filter(id => id !== agentId)
        : [...state.selectedAgents, agentId],
    })),
  clearSelection: () => set({ selectedAgents: [] }),

  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),
}))
