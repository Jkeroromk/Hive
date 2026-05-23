'use client'
import { useState, useRef, useEffect } from 'react'
import { useOfficeStore } from '@/lib/store'
import { MeetingMessage } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export default function MeetingRoom() {
  const [userInput, setUserInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    selectedAgents,
    agents,
    isMeetingActive,
    meetingTopic,
    meetingMessages,
    startMeeting,
    endMeeting,
    addMeetingMessage,
    updateLastMeetingMessage,
    updateAgentStatus,
    addLog,
  } = useOfficeStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [meetingMessages])

  const runMeeting = async (topic: string, history: MeetingMessage[]) => {
    if (isRunning) return
    setIsRunning(true)

    selectedAgents.forEach(id =>
      updateAgentStatus(id, 'in-meeting', `会议: ${topic.slice(0, 30)}`)
    )

    try {
      const response = await fetch('/api/meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, participants: selectedAgents, history }),
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

            if (eventType === 'agent-start') {
              addMeetingMessage({
                id: uuidv4(),
                agentId: data.agentId,
                agentName: data.agentName,
                agentEmoji: data.agentEmoji,
                content: '',
                timestamp: new Date(),
                isStreaming: true,
              })
            } else if (eventType === 'delta') {
              updateLastMeetingMessage(data.text)
            } else if (eventType === 'agent-done') {
              addLog({
                id: uuidv4(),
                timestamp: new Date(),
                agentId: data.agentId,
                agentName: agents.find(a => a.id === data.agentId)?.name ?? data.agentId,
                agentEmoji: agents.find(a => a.id === data.agentId)?.emoji ?? '',
                message: `会议发言完毕`,
                type: 'meeting',
              })
            }
          } catch {}
        }
      }
    } finally {
      selectedAgents.forEach(id => updateAgentStatus(id, 'idle', undefined))
      setIsRunning(false)
    }
  }

  const handleNewMeeting = () => {
    if (!userInput.trim() || selectedAgents.length === 0) return
    const topic = userInput
    startMeeting(topic)
    setUserInput('')
    runMeeting(topic, [])
  }

  const handleUserSpeak = () => {
    if (!userInput.trim() || !isMeetingActive) return
    const userMsg: MeetingMessage = {
      id: uuidv4(),
      agentId: 'user',
      agentName: '你',
      agentEmoji: '🙋',
      content: userInput,
      timestamp: new Date(),
    }
    addMeetingMessage(userMsg)
    const newHistory = [...meetingMessages, userMsg]
    setUserInput('')
    runMeeting(meetingTopic, newHistory)
  }

  const selectedAgentNames = agents
    .filter(a => selectedAgents.includes(a.id))
    .map(a => `${a.emoji}${a.name}`)
    .join(' ')

  return (
    <div className="flex flex-col h-full gap-3">
      <div>
        <div className="font-semibold text-white text-sm">会议室</div>
        {selectedAgents.length > 0 ? (
          <div className="text-xs text-gray-400 mt-0.5">参会者: {selectedAgentNames}</div>
        ) : (
          <div className="text-xs text-gray-500 mt-0.5">请先选择参会的 Agent</div>
        )}
      </div>

      {isMeetingActive && (
        <div className="bg-purple-900/40 border border-purple-700/50 rounded-lg px-3 py-2">
          <div className="text-xs text-purple-300">会议主题</div>
          <div className="text-sm text-white mt-0.5">{meetingTopic}</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {meetingMessages.length === 0 && (
          <div className="text-center text-gray-600 text-xs pt-8">
            会议记录将在这里实时显示
          </div>
        )}
        {meetingMessages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.agentId === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className="text-xl flex-shrink-0">{msg.agentEmoji}</div>
            <div
              className={`flex-1 flex flex-col ${
                msg.agentId === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">{msg.agentName}</div>
              <div
                className={`rounded-xl px-3 py-2 text-sm text-white max-w-[90%] whitespace-pre-wrap ${
                  msg.agentId === 'user' ? 'bg-blue-700 ml-auto' : 'bg-gray-800'
                }`}
              >
                {msg.content}
                {msg.isStreaming && <span className="animate-pulse">▋</span>}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <textarea
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder={isMeetingActive ? '插话...' : '输入会议主题开启讨论...'}
          rows={2}
          className="flex-1 bg-gray-800 text-white rounded-xl p-2.5 text-sm resize-none border border-gray-700 focus:outline-none focus:border-purple-500 placeholder-gray-600"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              isMeetingActive ? handleUserSpeak() : handleNewMeeting()
            }
          }}
        />
        <div className="flex flex-col gap-1.5">
          {!isMeetingActive ? (
            <button
              onClick={handleNewMeeting}
              disabled={isRunning || !userInput.trim() || selectedAgents.length === 0}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs font-medium py-2 px-3 rounded-xl transition-colors whitespace-nowrap"
            >
              开会
            </button>
          ) : (
            <>
              <button
                onClick={handleUserSpeak}
                disabled={isRunning || !userInput.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-xs font-medium py-2 px-3 rounded-xl transition-colors"
              >
                发言
              </button>
              <button
                onClick={endMeeting}
                disabled={isRunning}
                className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded-xl transition-colors"
              >
                散会
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
