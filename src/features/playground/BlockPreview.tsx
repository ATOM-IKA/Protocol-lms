import type { LeafKind } from './blocks'

export function BlockPreview({ kind }: { kind: LeafKind }) {
  switch (kind) {
    case 'nav':
      return (
        <div className="flex h-9 items-center justify-between border border-line bg-surface-2 px-3">
          <span className="h-2.5 w-2.5 rounded-sm bg-aqua" />
          <div className="flex gap-2">
            <span className="h-1.5 w-8 bg-ink-dim" />
            <span className="h-1.5 w-8 bg-ink-dim" />
            <span className="h-1.5 w-8 bg-ink-dim" />
          </div>
        </div>
      )
    case 'hero':
      return (
        <div className="flex flex-col items-center gap-2 border border-line-aqua bg-surface-2 px-4 py-6">
          <span className="h-3 w-2/3 bg-ink" />
          <span className="h-2 w-1/2 bg-ink-muted" />
          <span className="mt-1 h-5 w-24 bg-lime" />
        </div>
      )
    case 'heading':
      return <div className="h-4 w-2/5 bg-ink" />
    case 'text':
      return (
        <div className="flex flex-col gap-1.5">
          <span className="h-1.5 w-full bg-ink-dim" />
          <span className="h-1.5 w-11/12 bg-ink-dim" />
          <span className="h-1.5 w-3/4 bg-ink-dim" />
        </div>
      )
    case 'button':
      return <div className="mx-auto h-8 w-32 bg-lime clip-btn" />
    case 'image':
      return (
        <div className="flex h-24 items-center justify-center border border-line bg-surface-2">
          <span className="h-8 w-8 rounded-sm border-2 border-ink-dim" />
        </div>
      )
    case 'card':
      return (
        <div className="border border-line bg-surface p-3">
          <span className="block h-10 w-full bg-surface-2" />
          <span className="mt-2 block h-2 w-2/3 bg-ink-muted" />
        </div>
      )
    case 'input':
      return <div className="flex h-9 items-center border border-line-strong bg-surface-2 px-3"><span className="h-1.5 w-24 bg-ink-dim" /></div>
    case 'footer':
      return (
        <div className="flex h-10 items-center justify-between border-t border-line bg-surface-2 px-3">
          <span className="h-1.5 w-16 bg-ink-dim" />
          <span className="h-1.5 w-10 bg-ink-dim" />
        </div>
      )
    case 'spacer':
      return <div className="h-6 border border-dashed border-line-strong/50" />
    default:
      return <div className="h-8 border border-line bg-surface-2" />
  }
}
