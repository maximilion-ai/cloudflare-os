import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, UsersThree } from '@phosphor-icons/react'
import type { GadgetMetadataWithTimestamps } from '@gadgets/workshop-shared/api'
import { useAuthenticatedApi } from '../AuthContext'
import { logRpcFailure } from '../rpcErrors'

const SHOWN = 4

function relativeTime(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function monogram(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  return words.map((w) => w[0]!.toUpperCase()).join('') || 'S'
}

/**
 * "Pick up where you left off": the few spaces touched most recently, as cards under the composer.
 * Renders nothing until there is at least one space, so a fresh garden keeps the front door clean.
 */
export default function HomeRecentSpaces() {
  const { authenticatedApi } = useAuthenticatedApi()
  const [spaces, setSpaces] = useState<GadgetMetadataWithTimestamps[]>([])

  useEffect(() => {
    let cancelled = false
    authenticatedApi
      .listGadgets()
      .then((list) => {
        if (cancelled) return
        setSpaces([...list].sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime()))
      })
      .catch((err) => logRpcFailure('Failed to load recent spaces:', err))
    return () => {
      cancelled = true
    }
  }, [authenticatedApi])

  if (spaces.length === 0) return null
  const shown = spaces.slice(0, SHOWN)

  return (
    <section aria-label="Recent spaces" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between px-1">
        <h3 className="rail-label">Pick up where you left off</h3>
        <Link
          to="/workspaces"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-kumo-subtle hover:text-kumo-default"
        >
          All spaces
          <ArrowRight size={11} weight="bold" />
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {shown.map((space) => {
          const title = space.title || 'Untitled space'
          return (
            <li key={space.id} className="min-w-0">
              <Link
                to="/workspace/$id"
                params={{ id: space.id }}
                className="press group flex h-full flex-col gap-3 rounded-xl border border-kumo-line bg-kumo-elevated p-3 hover:border-kumo-interact hover:bg-kumo-tint"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-kumo-fill font-display text-[13px] font-semibold text-kumo-strong">
                  {monogram(title)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] leading-[18px] font-medium text-kumo-default">
                    {title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-[12px] leading-4 text-kumo-subtle">
                    {space.owner && <UsersThree size={12} aria-label="Shared with you" />}
                    {relativeTime(space.lastActive)}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
