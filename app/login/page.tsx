'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Registration failed'); setLoading(false); return }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  const handleGoogle = () => signIn('google', { callbackUrl: '/' })

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

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 400,
        margin: '0 auto', padding: '0 24px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <polygon points="22,4 38,13 38,31 22,40 6,31 6,13" fill="var(--amber-tint)" stroke="var(--amber)" strokeWidth="1"/>
              <polygon points="22,10 32,16 32,28 22,34 12,28 12,16" fill="var(--amber)" opacity=".18"/>
              <polygon points="22,16 28,19.5 28,26.5 22,30 16,26.5 16,19.5" fill="var(--amber)" opacity=".5"/>
            </svg>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)' }}>
            Hive
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 4 }}>
            your AI team, always working
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)', border: '.5px solid var(--line)',
          borderRadius: 18, padding: '32px 28px',
          boxShadow: '0 8px 40px rgba(0,0,0,.18)',
        }}>
          {/* Mode switcher */}
          <div style={{
            display: 'flex', gap: 2, padding: 3,
            background: 'var(--surface-2)', borderRadius: 9,
            border: '.5px solid var(--line)', marginBottom: 24,
          }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    background: 'var(--bg)', border: '.5px solid var(--line)',
                    color: 'var(--text)', fontFamily: 'inherit', fontSize: 14,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'var(--bg)', border: `.5px solid ${error ? 'var(--red)' : 'var(--line)'}`,
                  color: 'var(--text)', fontFamily: 'inherit', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'} required
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  background: 'var(--bg)', border: `.5px solid ${error ? 'var(--red)' : 'var(--line)'}`,
                  color: 'var(--text)', fontFamily: 'inherit', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '9px 12px', borderRadius: 8,
                background: 'rgba(239,68,68,.1)', border: '.5px solid rgba(239,68,68,.3)',
                color: 'var(--red)', fontSize: 12.5,
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              appearance: 'none', border: 0, borderRadius: 10,
              background: loading ? 'var(--surface-2)' : 'var(--amber)',
              color: loading ? 'var(--text-mute)' : 'var(--bg)',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
              padding: '12px 0', cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%', marginTop: 4,
              boxShadow: loading ? 'none' : '0 0 20px var(--amber-glow)',
              transition: 'all .2s',
            }}>
              {loading ? (mode === 'register' ? 'Creating…' : 'Signing in…') : (mode === 'register' ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {process.env.NEXT_PUBLIC_GOOGLE_AUTH === 'true' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: '.5px', background: 'var(--line)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>or</span>
                <div style={{ flex: 1, height: '.5px', background: 'var(--line)' }} />
              </div>
              <button onClick={handleGoogle} style={{
                width: '100%', appearance: 'none',
                border: '.5px solid var(--line)', background: 'var(--surface-2)',
                color: 'var(--text)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
                padding: '11px 0', borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
