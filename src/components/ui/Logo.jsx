// GTM-360 Agents logo — inherits the circular arrow motif from the parent brand
// Navy wordmark + indigo circular mark + "Agents" sub-label

export function AgentsLogo({ size = 'md', variant = 'full' }) {
  const sizes = {
    sm: { mark: 28, textMain: 14, textSub: 9 },
    md: { mark: 36, textMain: 18, textSub: 11 },
    lg: { mark: 48, textMain: 24, textSub: 13 },
  }
  const s = sizes[size] || sizes.md

  if (variant === 'mark') {
    return (
      <svg width={s.mark} height={s.mark} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" stroke="#4F46E5" strokeWidth="1.5" opacity="0.2"/>
        {/* Circular arrows — matches parent brand motif */}
        <path d="M18 4 A14 14 0 0 1 32 18" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M32 18 A14 14 0 0 1 18 32" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M18 32 A14 14 0 0 1 4 18" stroke="#0A192F" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M4 18 A14 14 0 0 1 18 4" stroke="#0A192F" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        {/* Arrow heads */}
        <polygon points="18,1 22,7 14,7" fill="#4F46E5"/>
        <polygon points="35,18 29,14 29,22" fill="#6366f1"/>
        <polygon points="18,35 14,29 22,29" fill="#0A192F"/>
        <polygon points="1,18 7,22 7,14" fill="#0A192F"/>
        {/* Center dot */}
        <circle cx="18" cy="18" r="3" fill="#4F46E5"/>
      </svg>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <AgentsLogo size={size} variant="mark" />
      <div className="flex flex-col leading-none">
        <span style={{ fontSize: s.textMain, fontWeight: 700, color: '#0A192F', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
          GTM-360
        </span>
        <span style={{ fontSize: s.textSub, fontWeight: 500, color: '#4F46E5', fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>
          Agents
        </span>
      </div>
    </div>
  )
}
