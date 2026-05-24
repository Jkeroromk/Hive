'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Agent, Status } from '@/types'
import { AGENTS, sv } from '@/lib/hive-data'
import { useHiveStore } from '@/lib/hive-store'
import { LangProvider, makeT, makeTArr } from '@/lib/i18n'
import TopNav from '@/components/hive/TopNav'
import Dashboard from '@/components/hive/Dashboard'
import Sidebar from '@/components/hive/Sidebar'
import MeetingRoomView from '@/components/hive/MeetingRoomView'
import ProfileModal from '@/components/hive/ProfileModal'
import ProjectsPanel from '@/components/hive/ProjectsPanel'
import SettingsModal from '@/components/hive/SettingsModal'
import Icon from '@/components/hive/Icon'

// ─── Mobile bottom nav ───────────────────────────────────────────────────────
function MobileNav({
  current,
  onNav,
}: {
  current: string
  onNav: (id: string) => void
}) {
  const items = [
    { id: 'dashboard', icon: 'hex-fill',  label: 'Home' },
    { id: 'tasks',     icon: 'task',      label: 'Tasks' },
    { id: 'meetings',  icon: 'meeting',   label: 'Meetings' },
    { id: 'projects',  icon: 'sparks',    label: 'Projects' },
  ]
  return (
    <nav style={{
      display: 'none',  // shown only on mobile via CSS
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'var(--backdrop)', backdropFilter: 'blur(20px)',
      borderTop: '.5px solid var(--line)', padding: '6px 0 env(safe-area-inset-bottom)',
    }}
      className="mobile-nav"
    >
      {items.map(item => {
        const active = current === item.id
        return (
          <button key={item.id} onClick={() => onNav(item.id)} style={{
            flex: 1, appearance: 'none', border: 0, background: 'transparent',
            color: active ? 'var(--amber)' : 'var(--text-mute)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '8px 4px', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Icon name={item.icon} size={20} />
            <span style={{ fontSize: 9.5, fontWeight: 600 }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function HiveApp() {
  const theme      = useHiveStore((s) => s.theme)
  const setThemeStore = useHiveStore((s) => s.setTheme)
  const lang       = useHiveStore((s) => s.lang)
  const setLangStore  = useHiveStore((s) => s.setLang)
  const workspace  = useHiveStore((s) => s.workspace)
  const [setupOpen, setSetupOpen] = useState(false)

  const t    = makeT(lang)
  const tArr = makeTArr(lang)

  const setTheme = (v: string) => {
    setThemeStore(v)
    document.body.setAttribute('data-theme', v)
  }
  const setLang = (v: string) => {
    setLangStore(v)
    document.body.classList.remove('lang-en', 'lang-zh')
    document.body.classList.add('lang-' + v)
  }

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    document.body.classList.remove('lang-en', 'lang-zh')
    document.body.classList.add('lang-' + lang)
    if (!workspace) setSetupOpen(true)
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
          height: '100dvh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TopNav
          workingCount={workingCount}
          onNav={(id) => {
            if (id === 'meetings') {
              setSheet(false)
              if (meetingParticipantIds.length > 0) {
                setScreen('meeting')
              } else {
                setScreen('dashboard')
                setSidebar('meet')
              }
            } else if (id === 'dashboard') {
              setScreen('dashboard'); setSidebar(null); setSheet(false)
            } else if (id === 'tasks') {
              setScreen('dashboard'); setSidebar('assign'); setSheet(false)
            } else if (id === 'projects') {
              setSheet(true)
            }
          }}
          current={
            sheet ? 'projects'
            : screen === 'meeting' ? 'meetings'
            : sidebar === 'meet' ? 'meetings'
            : sidebar === 'assign' ? 'tasks'
            : 'dashboard'
          }
          onSetup={() => setSetupOpen(true)}
          hasWorkspace={!!workspace}
        />

        <div className="hive-body" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
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

        {sheet && (
          <ProjectsPanel onClose={() => setSheet(false)} />
        )}

        {setupOpen && (
          <SettingsModal
            onClose={() => setSetupOpen(false)}
            theme={theme}
            onTheme={setTheme}
            lang={lang}
            onLang={setLang}
            initialTab={workspace ? 'workspace' : 'workspace'}
          />
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

        <MobileNav
          current={
            sheet ? 'projects'
            : screen === 'meeting' ? 'meetings'
            : sidebar === 'meet' ? 'meetings'
            : sidebar === 'assign' ? 'tasks'
            : 'dashboard'
          }
          onNav={(id) => {
            if (id === 'meetings') {
              setSheet(false)
              if (meetingParticipantIds.length > 0) {
                setScreen('meeting')
              } else {
                setScreen('dashboard')
                setSidebar('meet')
              }
            } else if (id === 'dashboard') {
              setScreen('dashboard'); setSidebar(null); setSheet(false)
            } else if (id === 'tasks') {
              setScreen('dashboard'); setSidebar('assign'); setSheet(false)
            } else if (id === 'projects') {
              setSheet(true); setSidebar(null)
            }
          }}
        />
      </div>
    </LangProvider>
  )
}

export default HiveApp
