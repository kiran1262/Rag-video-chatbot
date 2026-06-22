import {
  YouTubeMark,
  InstagramMark,
  PlayIcon,
  EyeIcon,
  HeartIcon,
  CommentIcon,
  UsersIcon,
  BoltIcon,
} from './icons'

interface VideoData {
  platform: string
  title: string
  views: number
  likes: number
  comments: number
  creator: string
  followers: number
  engagement_rate: number
  transcript_chunks: number
}

interface VideoCardProps {
  video: VideoData
  platform: 'youtube' | 'instagram'
  title: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n ?? 0)

function initials(name: string): string {
  const parts = (name || '').replace(/^@/, '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function VideoCard({ video, platform, title }: VideoCardProps) {
  const isYouTube = platform === 'youtube'

  const cfg = isYouTube
    ? {
        accentText: 'text-yt',
        iconAccent: 'text-yt',
        ring: 'ring-yt/60',
        avatarBg: 'bg-yt/15 text-yt',
        hoverGlow: 'hover:shadow-glow-yt',
        meterFill: 'bg-yt',
        dot: 'bg-yt',
        chipClass: 'bg-yt/15 text-yt border border-yt/30',
        Mark: YouTubeMark,
      }
    : {
        accentText: 'text-ig-pink',
        iconAccent: 'text-ig-pink',
        ring: 'ring-pink-500/60',
        avatarBg: 'ig-gradient text-cream',
        hoverGlow: 'hover:shadow-glow-ig',
        meterFill: 'ig-gradient',
        dot: 'bg-pink-500',
        chipClass: 'border-ig-gradient text-cream',
        Mark: InstagramMark,
      }

  const Mark = cfg.Mark
  const meterWidth = `${Math.min((video.engagement_rate || 0) * 8, 100)}%`

  const metrics: { label: string; value: number; Icon: typeof EyeIcon }[] = [
    { label: 'Views', value: video.views, Icon: EyeIcon },
    { label: 'Likes', value: video.likes, Icon: HeartIcon },
    { label: 'Comments', value: video.comments, Icon: CommentIcon },
    { label: 'Followers', value: video.followers, Icon: UsersIcon },
  ]

  const creatorHandle = video.creator?.replace(/^@/, '') || 'unknown'

  return (
    <article
      className={`group animate-fadeUp overflow-hidden rounded-2xl border border-line bg-surface shadow-panel transition duration-300 hover:-translate-y-1 ${cfg.hoverGlow}`}
    >
      {/* Media banner */}
      <header className="relative h-36 overflow-hidden">
        {isYouTube ? (
          <div className="absolute inset-0 bg-grid bg-ink">
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
            <YouTubeMark className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-yt/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yt shadow-glow-yt transition duration-300 group-hover:scale-105">
                <PlayIcon className="ml-0.5 h-6 w-6 text-cream" />
              </span>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 ig-gradient">
            <div className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-white/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/40 ring-1 ring-white/30 backdrop-blur-sm transition duration-300 group-hover:scale-105">
                <InstagramMark className="h-7 w-7" />
              </span>
            </div>
          </div>
        )}

        {/* Platform chip */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${cfg.chipClass}`}
          >
            <Mark className="h-3.5 w-3.5" />
            {title}
          </span>
        </div>

      </header>

      <div className="space-y-4 p-4">
        {/* Title */}
        <h3
          className="text-sm font-semibold leading-snug text-cream"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {video.title}
        </h3>

        {/* Creator row */}
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 ${cfg.ring} ${cfg.avatarBg}`}
          >
            {initials(video.creator)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-cream">@{creatorHandle}</p>
            <p className="flex items-center gap-1 text-xs text-fog">
              <UsersIcon className="h-3 w-3" />
              {video.followers > 0 ? `${fmt(video.followers)} followers` : 'audience n/a'}
            </p>
          </div>
        </div>

        {/* Metric grid */}
        <div className="grid grid-cols-2 gap-2">
          {metrics.map(({ label, value, Icon }) => {
            const empty = !value || value <= 0
            return (
              <div key={label} className="rounded-xl bg-surface2/60 p-3">
                <div className="flex items-center gap-1.5 text-fog">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[11px] uppercase tracking-wide">{label}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className={`font-display text-lg font-semibold ${empty ? 'text-fog' : 'text-cream'}`}
                  >
                    {empty ? 'N/A' : fmt(value)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Engagement meter */}
        <div className="rounded-xl bg-surface2/40 p-3">
          <div className="mb-2 flex items-end justify-between">
            <span className="text-[11px] uppercase tracking-wide text-fog">Engagement rate</span>
            <span className={`font-display text-2xl font-bold leading-none ${cfg.accentText}`}>
              {(video.engagement_rate || 0).toFixed(1)}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface2">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${cfg.meterFill}`}
              style={{ width: meterWidth }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-fog">
        <BoltIcon className={`h-3.5 w-3.5 ${cfg.iconAccent}`} />
        <span>
          {fmt(video.transcript_chunks)} transcript{' '}
          {video.transcript_chunks === 1 ? 'chunk' : 'chunks'} indexed
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-bob`} aria-hidden="true" />
          <span className="text-fog">live</span>
        </span>
      </footer>
    </article>
  )
}
