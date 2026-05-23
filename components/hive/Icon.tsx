'use client'
import { CSSProperties } from 'react'

interface IconProps {
  name: string
  size?: number
  style?: CSSProperties
  className?: string
}

export default function Icon({ name, size = 16, style, className }: IconProps) {
  const s: CSSProperties = { width: size, height: size, display: 'inline-block', flexShrink: 0, ...style }
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, style: s, className }
  switch (name) {
    case 'hex': return <svg {...common}><polygon points="12,2 21,7 21,17 12,22 3,17 3,7" /></svg>
    case 'hex-fill': return <svg {...common} fill="currentColor" stroke="none"><polygon points="12,2 21,7 21,17 12,22 3,17 3,7" /></svg>
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
    case 'bell': return <svg {...common}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>
    case 'chevron-right': return <svg {...common}><path d="m9 6 6 6-6 6" /></svg>
    case 'chevron-down': return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>
    case 'arrow-right': return <svg {...common}><path d="M5 12h14M13 5l7 7-7 7" /></svg>
    case 'send': return <svg {...common}><path d="M22 2 11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7Z" /></svg>
    case 'stop': return <svg {...common}><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
    case 'sparks': return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>
    case 'bolt': return <svg {...common} fill="currentColor" stroke="none"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>
    case 'meeting': return <svg {...common}><circle cx="9" cy="9" r="3" /><circle cx="17" cy="9" r="2.2" /><path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6M14 19c0-2.2 1.3-4.2 3-5" /></svg>
    case 'task': return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="m8 12 3 3 5-6" /></svg>
    case 'dots': return <svg {...common}><circle cx="6" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18" cy="12" r="1.2" fill="currentColor" /></svg>
    case 'close': return <svg {...common}><path d="M6 6l12 12M18 6 6 18" /></svg>
    case 'check': return <svg {...common}><path d="m4 12 5 5L20 6" /></svg>
    case 'clock': return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    case 'filter': return <svg {...common}><path d="M3 5h18M6 12h12M10 19h4" /></svg>
    case 'settings': return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
    case 'sun': return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    )
    case 'moon': return (
      <svg {...common}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    )
    case 'refresh': return (
      <svg {...common}>
        <path d="M2.5 4A4 4 0 1 1 2 6.5M2.5 1.5v2.5h2.5" />
      </svg>
    )
    default: return null
  }
}
