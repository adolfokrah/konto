export const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-pink-500',
]

export function extractBareEmail(addr: string): string {
  const m = addr.match(/<([^>]+)>$/)
  return (m ? m[1] : addr).toLowerCase().trim()
}

export type ColorMapEntry = { from: string; to: { email: string }[] }

export function buildColorMap(messages: ColorMapEntry[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const msg of messages) {
    const addrs = [msg.from, ...msg.to.map((t) => t.email)]
    for (const addr of addrs) {
      const bare = extractBareEmail(addr)
      if (!map.has(bare)) map.set(bare, AVATAR_COLORS[map.size % AVATAR_COLORS.length])
    }
  }
  return map
}
