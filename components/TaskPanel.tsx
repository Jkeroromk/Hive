// @ts-nocheck
'use client'
import { useState, useRef, useEffect } from 'react'
import { useOfficeStore } from '@/lib/store'
import { v4 as uuidv4 } from 'uuid'

export default function TaskPanel() {
  const [taskInput, setTaskInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState('')
  const outputRef = useRef<HTMLDivElement>(null)

  const { selectedAgents, agents, updateAgentStatus, addLog } = useOfficeStore()
  const selectedAgent = agents.find(a => a.id === selectedAgents[0])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const handleAssign = async () => {
    if (!taskInput.trim() || !selectedAgent || isRunning) return

    setIsRunning(true)
    setOutput('')

    addLog({
      id: uuidv4(),
      timestamp: new Date(),
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      agentEmoji: selectedAgent.emoji,
      message: `收到任务: ${taskInput.slice(0, 50)}`,
      type: 'task',
    })

    updateAgentStatus(selectedAgent.id, 'thinking', taskInput.slice(0, 40) + '...')

    try {
      const response = await fetch('/api/agents/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent.id, task: taskInput }),
      })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
          const lines = part.split('\n')
          const eventLine = lines.find(l => l.startsWith('event: '))
          const dataLine = lines.find(l => l.startsWith('data: '))
          if (!eventLine || !dataLine) continue

          const eventType = eventLine.slice(7)
          try {
            const data = JSON.parse(dataLine.slice(6))
            if (eventType === 'status') {
              updateAgentStatus(
                data.agentId,
                data.status,
                data.status === 'working' ? taskInput.slice(0, 40) : undefined,
                data.lastOutput
              )
            } else if (eventType === 'delta') {
              setOutput(prev => prev + data.text)
            }
          } catch {}
        }
      }
    } catch {
      updateAgentStatus(selectedAgent.id, 'error')
    } finally {
      setIsRunning(false)
    }
  }

  if (selectedAgents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
        <div className="text-4xl">👈</div>
        <div className="text-sm text-center">
          点击左边的 Agent 卡片
          <br />
          选中后可以派任务或开会
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{selectedAgent?.emoji}</span>
        <div>
          <div className="font-semibold text-white">{selectedAgent?.name}</div>
          <div className="text-xs text-gray-400">{selectedAgent?.description}</div>
        </div>
      </div>

      <textarea
        value={taskInput}
        onChange={e => setTaskInput(e.target.value)}
        placeholder={`给 ${selectedAgent?.name} 派一个任务...\n\n例如：帮我分析一下做一个 AI 写作工具的市场前景`}
        className="flex-1 min-h-[120px] bg-gray-800 text-white rounded-xl p-3 text-sm resize-none border border-gray-700 focus:outline-none focus:border-blue-500 placeholder-gray-600"
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAssign()
        }}
      />

      <button
        onClick={handleAssign}
        disabled={isRunning || !taskInput.trim()}
        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
      >
        {isRunning ? '执行中...' : '⚡ 派发任务 (⌘↵)'}
      </button>

      {output && (
        <div
          ref={outputRef}
          className="flex-1 overflow-y-auto bg-gray-800 rounded-xl p-3 text-sm text-gray-200 whitespace-pre-wrap font-mono leading-relaxed border border-gray-700"
        >
          {output}
          {isRunning && <span className="animate-pulse">▋</span>}
        </div>
      )}
    </div>
  )
}
