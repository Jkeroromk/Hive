// @ts-nocheck
'use client'
import { Agent } from '@/types'
import { useOfficeStore } from '@/lib/store'

const statusConfig = {
  idle:         { label: '待命中',  dot: 'bg-gray-400',                         ring: '' },
  thinking:     { label: '思考中',  dot: 'bg-yellow-400 animate-pulse',          ring: 'ring-2 ring-yellow-300' },
  working:      { label: '工作中',  dot: 'bg-blue-400 animate-pulse',            ring: 'ring-2 ring-blue-300' },
  'in-meeting': { label: '会议中',  dot: 'bg-purple-400 animate-pulse',          ring: 'ring-2 ring-purple-300' },
  done:         { label: '完成',    dot: 'bg-green-400',                         ring: 'ring-2 ring-green-300' },
  error:        { label: '出错了',  dot: 'bg-red-400',                           ring: 'ring-2 ring-red-300' },
}

export default function AgentCard({ agent }: { agent: Agent }) {
  const { selectedAgents, toggleAgentSelection } = useOfficeStore()
  const isSelected = selectedAgents.includes(agent.id)
  const config = statusConfig[agent.status]

  return (
    <div
      onClick={() => toggleAgentSelection(agent.id)}
      className={`
        relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200
        bg-gray-900 hover:bg-gray-800
        ${agent.color}
        ${isSelected ? 'ring-2 ring-white scale-105' : 'opacity-90 hover:opacity-100'}
        ${config.ring}
      `}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
          <span className="text-xs text-black font-bold">✓</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl">{agent.emoji}</div>
        <div>
          <div className="font-semibold text-white text-sm">{agent.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-2 h-2 rounded-full ${config.dot}`} />
            <span className="text-xs text-gray-400">{config.label}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-2">{agent.description}</div>

      {agent.currentTask && (
        <div className="text-xs text-gray-300 bg-gray-800 rounded-lg px-2 py-1.5 mt-2 line-clamp-2">
          {agent.status === 'thinking' && '💭 '}
          {agent.status === 'working' && '⚡ '}
          {agent.status === 'in-meeting' && '🗣️ '}
          {agent.currentTask}
        </div>
      )}

      {agent.lastOutput && agent.status === 'done' && (
        <div className="text-xs text-green-400 mt-2 line-clamp-2 opacity-75">
          ✅ {agent.lastOutput}...
        </div>
      )}
    </div>
  )
}
