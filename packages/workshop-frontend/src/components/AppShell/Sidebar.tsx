import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  Books,
  House,
  MagnifyingGlass,
  Shapes,
  SidebarSimple,
  SquaresFour,
} from '@phosphor-icons/react'
import { useSiteName } from '../../ServerConfigContext'
import SiteLogo from '../SiteLogo'
import GartenMark from '../GartenMark'
import { useGatekeeperApps } from '../../useGatekeeperApps'
import { openCommandPalette } from './commandPaletteBus'
import SidebarItem from './SidebarItem'
import {
  SidebarWorkspacesProvider,
  SidebarWorkspacesTools,
  SidebarWorkspacesLists,
} from './SidebarWorkspaces'
import SidebarUtilityStrip from './SidebarUtilityStrip'

/**
 * The persistent left rail. Three pinned regions sandwich a single scrolling region of lists, so
 * the user can always reach Search, primary nav, and the bottom utility strip no matter how many
 * spaces they have.
 *
 * Layout (top → bottom):
 *   • brand row (48px, the same band the page toolbars use)   pinned
 *   • primary nav (Home, Spaces, Library, Templates)          pinned
 *   • Favorites / Recent spaces                               SCROLLS
 *   • utility strip (connections, theme, you)                 pinned
 */
export default function Sidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
}) {
  const siteName = useSiteName()
  // Connection-served apps the user can reach now (one per connection that provides a UI and is
  // connected / enabled for everyone). The set is fully dynamic.
  const gatekeeperApps = useGatekeeperApps()

  return (
    <aside
      aria-label="Primary"
      className={[
        'rail flex h-full flex-col border-r border-kumo-line',
        collapsed ? 'w-[52px]' : 'w-[min(320px,100vw)] md:w-[240px]',
        'shrink-0 transition-[width] duration-200 ease-out',
      ].join(' ')}
    >
      {/* Brand row */}
      <div
        className={[
          'flex h-12 shrink-0 items-center',
          collapsed ? 'justify-center px-1.5' : 'justify-between gap-2 pl-3.5 pr-2',
        ].join(' ')}
      >
        <Link to="/" aria-label={siteName} className="flex min-w-0 items-center gap-2 rounded-md">
          <SiteLogo size={20} className="shrink-0">
            <GartenMark size={20} className="shrink-0" />
          </SiteLogo>
          {!collapsed && (
            <span className="truncate font-display text-[17px] leading-5 font-semibold text-kumo-default">
              {siteName}
            </span>
          )}
        </Link>
        {!collapsed && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => openCommandPalette()}
              aria-label="Search"
              title="Search (⌘K)"
              className="press flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-kumo-inactive hover:bg-kumo-tint hover:text-kumo-default"
            >
              <MagnifyingGlass size={15} />
            </button>
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-kumo-inactive hover:bg-kumo-tint hover:text-kumo-default"
            >
              <SidebarSimple size={15} />
            </button>
          </div>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Expand sidebar"
          title="Expand sidebar"
          className="mx-auto mt-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-kumo-inactive hover:bg-kumo-tint hover:text-kumo-default"
        >
          <SidebarSimple size={15} className="rotate-180" />
        </button>
      )}

      <SidebarWorkspacesProvider>
        <div className="flex shrink-0 flex-col gap-3 pt-1">
          <nav className="flex flex-col gap-px px-2">
            <SidebarItem to="/" label="Home" icon={<House size={15} />} collapsed={collapsed} />
            <SidebarItem
              to="/workspaces"
              label="Spaces"
              icon={<SquaresFour size={15} />}
              collapsed={collapsed}
            />
            <SidebarItem
              to="/outputs"
              label="Library"
              icon={<Books size={15} />}
              collapsed={collapsed}
            />
            <SidebarItem
              to="/explore"
              label="Templates"
              icon={<Shapes size={15} />}
              collapsed={collapsed}
            />
            {gatekeeperApps.map((app) => {
              const maskUrl = app.icon
                ? `url("${app.icon.url.replace(/[\\"]/g, '\\$&')}")`
                : undefined
              return (
                <SidebarItem
                  key={app.id}
                  to="/gatekeepers/$appId"
                  params={{ appId: app.id }}
                  label={app.title}
                  icon={
                    maskUrl ? (
                      <span
                        aria-hidden
                        className="h-3.5 w-3.5 bg-current"
                        style={{
                          maskImage: maskUrl,
                          WebkitMaskImage: maskUrl,
                          maskRepeat: 'no-repeat',
                          WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskPosition: 'center',
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                        }}
                      />
                    ) : (
                      <BookOpen size={15} />
                    )
                  }
                  collapsed={collapsed}
                />
              )
            })}
          </nav>

          <SidebarWorkspacesTools collapsed={collapsed} />
        </div>

        <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto">
          <SidebarWorkspacesLists collapsed={collapsed} />
        </div>
      </SidebarWorkspacesProvider>

      <SidebarUtilityStrip collapsed={collapsed} />
    </aside>
  )
}
