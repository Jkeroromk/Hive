'use client'
import { SignIn, SignUp } from '@clerk/nextjs'
import { useState } from 'react'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', fontFamily: 'var(--font)',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 60% 40% at 50% 30%, var(--amber-tint) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, margin: '0 auto', padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <polygon points="22,4 38,13 38,31 22,40 6,31 6,13" fill="var(--amber-tint)" stroke="var(--amber)" strokeWidth="1"/>
              <polygon points="22,10 32,16 32,28 22,34 12,28 12,16" fill="var(--amber)" opacity=".18"/>
              <polygon points="22,16 28,19.5 28,26.5 22,30 16,26.5 16,19.5" fill="var(--amber)" opacity=".5"/>
            </svg>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)' }}>Hive</div>
          <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 4 }}>your AI team, always working</div>
        </div>

        {/* Mode switcher */}
        <div style={{
          display: 'flex', gap: 2, padding: 3,
          background: 'var(--surface)', border: '.5px solid var(--line)',
          borderRadius: 10, marginBottom: 20,
        }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, appearance: 'none', border: 0, borderRadius: 7,
              background: mode === m ? 'var(--bg)' : 'transparent',
              color: mode === m ? 'var(--text)' : 'var(--text-mute)',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              padding: '8px 0', cursor: 'pointer',
              boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              transition: 'all .15s',
            }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Clerk components */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {mode === 'login'
            ? <SignIn routing="hash" />
            : <SignUp routing="hash" />
          }
        </div>
      </div>
    </div>
  )
}
