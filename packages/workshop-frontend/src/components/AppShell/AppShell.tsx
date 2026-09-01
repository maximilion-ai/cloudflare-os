import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { List, X } from '@phosphor-icons/react'
import TopBarNotice from '../../TopBarNotice'
import ReconnectingChip from '../ReconnectingChip'
import { useConnectionLost } from '../../RpcContext'
import Sidebar from './Sidebar'
import CommandPalette from './CommandPalette'
import { OPEN_COMMAND_PALETTE_EVENT } from './commandPaletteBus'

const STORAGE_KEY_COLLAPSED = 'gadgets:sidebar-collapsed'

// Read synchronously for the initial state so the rail doesn't flash open then collapse.
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_COLLAPSED) === '1'
  } catch {
    return false
  }
}

/**
 * The authenticated, non-fullscreen application chrome: a persistent left rail + a thin top notice
 * strip + the routed content. Replaces the old <Header /> on these routes. Chat and Gadget editor
 * pages are still rendered fullscreen by __root.tsx without this shell.
 *
 * Mobile: below `md` the rail collapses to an overlay drawer triggered by a hamburger button in a
 * minimal top bar. We don't try to gracefully shrink the rail at narrow widths; the overlay model
 * is simpler and matches how the rest of the app handles small screens.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const connectionLost = useConnectionLost()

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY_COLLAPSED, next ? '1' : '0') } catch {}
      return next
    })
  }, [])

  // Close mobile drawer when escape is pressed.
  useEffect(() => {
    if (!mobileOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : menuButtonRef.current
    drawerRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        return
      }
      if (e.key !== 'Tab' || !drawerRef.current) return
      const focusable = [...drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === drawerRef.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      window.setTimeout(() => previousFocus?.focus(), 0)
    }
  }, [mobileOpen])

  // Close the mobile drawer on navigation. Links in the drawer (primary nav, Gatekeepers, the user
  // menu, workspace rows) otherwise navigate while leaving the drawer covering the page — so on a
  // phone it looks like nothing happened. Watching the pathname catches every navigation source
  // without prop-drilling a close callback through the whole rail. No-op on desktop, where the
  // drawer is never open.
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Global ⌘K / Ctrl+K opens the command palette; the rail's search button opens it via a custom
  // event so it doesn't have to prop-drill into the palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    const onOpen = () => setPaletteOpen(true)
    document.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen)
    }
  }, [])

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-kumo-base">
      {/* Desktop sidebar — hidden on mobile in favor of the drawer. */}
      <div className="hidden md:flex">
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Primary navigation"
            tabIndex={-1}
            className="fixed inset-y-0 left-0 z-50 outline-none md:hidden"
          >
            <Sidebar collapsed={false} onToggleCollapsed={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Main column */}
      <div
        className="relative flex min-w-0 flex-1 flex-col"
        inert={mobileOpen ? true : undefined}
        aria-hidden={mobileOpen ? true : undefined}
      >
        {/* Mobile top band: hamburger + notice. On desktop there is no chrome strip; the page
            header owns the top of the column and the reconnecting chip floats over it. */}
        <div className="relative flex h-12 shrink-0 items-center justify-between border-b border-kumo-line px-2 md:hidden">
          <button
            type="button"
            ref={menuButtonRef}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="flex h-10 w-10 items-center justify-center rounded-md text-kumo-default hover:bg-kumo-tint"
          >
            {mobileOpen ? <X size={16} /> : <List size={16} />}
          </button>
          <TopBarNotice />
          <div className="ml-auto flex items-center gap-2">
            {connectionLost && <ReconnectingChip />}
            <span aria-hidden="true" className="h-10 w-10" />
          </div>
        </div>
        <div className="hidden md:block">
          <TopBarNotice />
        </div>
        {connectionLost && (
          <div className="pointer-events-none absolute right-4 top-3 z-30 hidden md:block">
            <div className="pointer-events-auto">
              <ReconnectingChip />
            </div>
          </div>
        )}

        {/* Routed content. Flat enterprise canvas — no texture. */}
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
