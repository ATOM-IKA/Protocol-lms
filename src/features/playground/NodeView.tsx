import { TONE_HEX, type Node, type Size } from './blocks'

const H: Record<Size, { pad: string; text: string; bar: number }> = {
  sm: { pad: 'py-2 px-3', text: 'text-sm', bar: 6 },
  md: { pad: 'py-3 px-4', text: 'text-base', bar: 8 },
  lg: { pad: 'py-5 px-6', text: 'text-xl', bar: 12 },
}

export function NodeView({ node }: { node: Node }) {
  const tone = TONE_HEX[node.tone ?? 'default']
  const s = H[node.size ?? 'md']

  switch (node.kind) {
    case 'row':
      return (
        <div className="flex gap-2">
          {(node.children ?? []).length === 0 ? (
            <div className="flex-1 border border-dashed border-line-strong/60 py-4 text-center font-mono text-[10px] text-ink-dim">
              пустой ряд
            </div>
          ) : (
            (node.children ?? []).map((c) => (
              <div key={c.id} className="min-w-0 flex-1">
                <NodeView node={c} />
              </div>
            ))
          )}
        </div>
      )
    case 'nav':
      return (
        <div className="flex h-9 items-center justify-between border border-line bg-surface-2 px-3">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: tone }} />
          <div className="flex gap-2">
            <span className="h-1.5 w-8 bg-ink-dim" /><span className="h-1.5 w-8 bg-ink-dim" /><span className="h-1.5 w-8 bg-ink-dim" />
          </div>
        </div>
      )
    case 'hero':
      return (
        <div className={`flex flex-col items-center gap-2 border border-line-aqua bg-surface-2 ${s.pad}`}>
          <span className={`font-display font-bold ${s.text}`} style={{ color: tone }}>{node.text}</span>
          <span className="h-2 w-1/2 bg-ink-muted" />
          <span className="mt-1 h-5 w-24" style={{ background: TONE_HEX.lime }} />
        </div>
      )
    case 'heading':
      return <div className={`font-display font-bold ${s.text}`} style={{ color: tone }}>{node.text}</div>
    case 'text':
      return <p className={`${s.text === 'text-xl' ? 'text-base' : 'text-sm'} leading-relaxed text-ink-muted`}>{node.text}</p>
    case 'button':
      return (
        <span className="inline-flex items-center justify-center px-5 font-display font-bold clip-btn" style={{ background: tone, color: '#0b0d12', height: s.bar * 3 }}>
          {node.text}
        </span>
      )
    case 'image':
      return (
        <div className="flex items-center justify-center border border-line bg-surface-2" style={{ height: s.bar * 10 }}>
          <span className="rounded-sm border-2 border-ink-dim" style={{ width: s.bar * 3, height: s.bar * 3 }} />
        </div>
      )
    case 'card':
      return (
        <div className="border border-line bg-surface p-3">
          <span className="block h-10 w-full bg-surface-2" />
          <span className="mt-2 block text-xs" style={{ color: tone }}>{node.text}</span>
        </div>
      )
    case 'input':
      return <div className="flex h-9 items-center border border-line-strong bg-surface-2 px-3"><span className="h-1.5 w-24 bg-ink-dim" /></div>
    case 'footer':
      return (
        <div className="flex h-10 items-center justify-between border-t border-line bg-surface-2 px-3">
          <span className="h-1.5 w-16 bg-ink-dim" /><span className="h-1.5 w-10 bg-ink-dim" />
        </div>
      )
    case 'spacer':
      return <div className="h-6 border border-dashed border-line-strong/40" />
    case 'badge':
      return (
        <span className="inline-flex items-center px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider" style={{ border: `1px solid ${tone}`, color: tone }}>
          {node.text}
        </span>
      )
    case 'list':
      return (
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5" style={{ background: tone }} />
              <span className="h-1.5 flex-1 bg-ink-dim" />
            </div>
          ))}
        </div>
      )
    case 'avatar':
      return <span className="block rounded-full" style={{ width: s.bar * 4, height: s.bar * 4, background: tone }} />
    case 'stat':
      return (
        <div className="border border-line bg-surface-2 px-3 py-2 text-center">
          <div className={`font-display font-bold ${s.text}`} style={{ color: tone }}>{node.text}</div>
          <div className="mt-0.5 h-1.5 w-12 bg-ink-dim mx-auto" />
        </div>
      )
  }
}
