'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Agent, Status } from '@/types'
import { AGENTS, sv } from '@/lib/hive-data'
import { useHiveStore } from '@/lib/hive-store'
import { LangProvider, makeT, makeTArr, useT } from '@/lib/i18n'
import TopNav from '@/components/hive/TopNav'
import Dashboard from '@/components/hive/Dashboard'
import Sidebar from '@/components/hive/Sidebar'
import MeetingRoomView from '@/components/hive/MeetingRoomView'
import ProfileModal from '@/components/hive/ProfileModal'
import Icon from '@/components/hive/Icon'

function ScreenRail({
  screen,
  setScreen,
  sidebar,
  setSidebar,
  sheet,
  setSheet,
}: {
  screen: string
  setScreen: (s: string) => void
  sidebar: string | null
  setSidebar: (s: string | null) => void
  sheet: boolean
  setSheet: (v: boolean) => void
}) {
  const { t } = useT()
  const items = [
    {
      id: 'dashboard',
      label: t('rail.dashboard'),
      icon: 'hex-fill',
      active: screen === 'dashboard' && !sidebar && !sheet,
      onClick: () => {
        setScreen('dashboard')
        setSidebar(null)
        setSheet(false)
      },
    },
    {
      id: 'task',
      label: t('rail.task'),
      icon: 'task',
      active: screen === 'dashboard' && sidebar === 'assign',
      onClick: () => {
        setScreen('dashboard')
        setSidebar('assign')
        setSheet(false)
      },
    },
    {
      id: 'meeting',
      label: t('rail.meeting'),
      icon: 'meeting',
      active: screen === 'meeting',
      onClick: () => {
        setScreen('meeting')
        setSheet(false)
      },
    },
    {
      id: 'sheet',
      label: t('rail.sheet'),
      icon: 'sparks',
      active: sheet,
      onClick: () => setSheet(true),
    },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        display: 'flex',
        gap: 2,
        padding: 5,
        borderRadius: 99,
        background: 'var(--surface)',
        border: '.5px solid var(--line)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,.18)',
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          title={item.label}
          style={{
            appearance: 'none',
            border: 0,
            borderRadius: 99,
            background: item.active ? 'var(--amber)' : 'transparent',
            color: item.active ? 'var(--bg)' : 'var(--text-dim)',
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 600,
            padding: '8px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
            boxShadow: item.active ? '0 0 16px var(--amber-glow)' : 'none',
            transition: 'all .2s',
          }}
        >
          <Icon name={item.icon} size={13} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

function HiveApp() {
  const [theme, setThemeState] = useState('dark')
  const [lang, setLangState] = useState('en')

  const t = makeT(lang)
  const tArr = makeTArr(lang)

  const setTheme = (v: string) => {
    setThemeState(v)
    document.body.setAttribute('data-theme', v)
  }
  const setLang = (v: string) => {
    setLangState(v)
    document.body.classList.remove('lang-en', 'lang-zh')
    document.body.classList.add('lang-' + v)
  }

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    document.body.classList.add('lang-en')
  }, [])

  const [screen, setScreen] = useState('dashboard')
  const [sidebar, setSidebar] = useState<string | null>(null)
  const [profile, setProfile] = useState<Agent | null>(null)
  const [sheet, setSheet] = useState(false)
  const [visibleAgents, setVisibleAgents] = useState<Agent[]>(AGENTS)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(AGENTS[1])

  // Meeting state
  const [meetingTopic, setMeetingTopic] = useState('')
  const [meetingParticipantIds, setMeetingParticipantIds] = useState<string[]>([])
  const meetingIdRef = useRef<string>(crypto.randomUUID())

  const startMeeting = useHiveStore((s) => s.startMeeting)

  const handleAgentStatusChange = useCallback(
    (agentId: string, status: Status) => {
      setVisibleAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, status } : a))
      )
    },
    []
  )

  const handleAssign = useCallback((agent: Agent) => {
    setSelectedAgent(agent)
    setSidebar('assign')
  }, [])

  const handleInvite = useCallback((agent: Agent) => {
    setSelectedAgent(agent)
    setSidebar('meet')
  }, [])

  const handleStartMeeting = useCallback(
    (topic: string, participantIds: string[]) => {
      const id = crypto.randomUUID()
      meetingIdRef.current = id
      setMeetingTopic(topic)
      setMeetingParticipantIds(participantIds)
      startMeeting(id, topic, participantIds)
      // Mark participants as in-meeting
      setVisibleAgents((prev) =>
        prev.map((a) =>
          participantIds.includes(a.id) ? { ...a, status: 'in-meeting' } : a
        )
      )
      setSidebar(null)
      setScreen('meeting')
    },
    [startMeeting]
  )

  const handleMeetingClose = useCallback(() => {
    // Restore in-meeting agents to idle
    setVisibleAgents((prev) =>
      prev.map((a) =>
        a.status === 'in-meeting' ? { ...a, status: 'idle' } : a
      )
    )
    setScreen('dashboard')
  }, [])

  const handleRemove = useCallback(
    (agent: Agent) => {
      setVisibleAgents((prev) => prev.filter((a) => a.id !== agent.id))
      if (selectedAgent?.id === agent.id) setSelectedAgent(null)
    },
    [selectedAgent]
  )

  const resetAgents = () => setVisibleAgents(AGENTS)

  const workingCount = visibleAgents.filter(
    (a) => a.status === 'working' || a.status === 'thinking'
  ).length

  return (
    <LangProvider lang={lang} setLang={setLang} t={t} tArr={tArr}>
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TopNav
          workingCount={workingCount}
          onNav={(id) => {
            if (id === 'meetings') setScreen('meeting')
            else if (id === 'dashboard') setScreen('dashboard')
          }}
          current={screen === 'meeting' ? 'meetings' : 'dashboard'}
          theme={theme}
          onTheme={setTheme}
          lang={lang}
          onLang={setLang}
        />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          <Dashboard
            agents={visibleAgents}
            onSelectAgent={setProfile}
            onAssign={handleAssign}
            onInvite={handleInvite}
            onRemove={handleRemove}
          />
          {sidebar && (
            <Sidebar
              mode={sidebar as 'assign' | 'meet'}
              agent={selectedAgent}
              agents={visibleAgents}
              onSelectAgent={setSelectedAgent}
              onClose={() => setSidebar(null)}
              onStartMeeting={handleStartMeeting}
              onAgentStatusChange={handleAgentStatusChange}
            />
          )}
        </div>

        <ScreenRail
          screen={screen}
          setScreen={setScreen}
          sidebar={sidebar}
          setSidebar={setSidebar}
          sheet={sheet}
          setSheet={setSheet}
        />

        {/* Restore removed agents button */}
        {visibleAgents.length < AGENTS.length && screen === 'dashboard' && (
          <button
            onClick={resetAgents}
            style={{
              position: 'fixed',
              top: 84,
              right: 32,
              zIndex: 25,
              appearance: 'none',
              border: '.5px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--text-dim)',
              fontFamily: 'inherit',
              fontSize: 11.5,
              padding: '7px 12px',
              borderRadius: 99,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,.12)',
              animation: 'slideup .3s ease-out',
            }}
          >
            <Icon name="refresh" size={11} />
            {lang === 'zh'
              ? `恢复 (${AGENTS.length - visibleAgents.length} 已移除)`
              : `Restore (${AGENTS.length - visibleAgents.length} removed)`}
          </button>
        )}

        {screen === 'meeting' && meetingParticipantIds.length > 0 && (
          <MeetingRoomView
            key={meetingIdRef.current}
            agents={visibleAgents}
            topic={meetingTopic}
            participantIds={meetingParticipantIds}
            meetingId={meetingIdRef.current}
            onClose={handleMeetingClose}
          />
        )}

        <ProfileModal
          agent={profile}
          onClose={() => setProfile(null)}
          onAssign={(a) => {
            setProfile(null)
            handleAssign(a)
          }}
          onInvite={(a) => {
            setProfile(null)
            handleInvite(a)
          }}
        />
      </div>
    </LangProvider>
  )
}

export default HiveApp
