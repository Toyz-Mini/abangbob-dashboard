/**
 * AppShell → Navigation → PageHeader.
 *
 * Component hierarchy and navigation order come from
 * 11_DESIGN/DESIGN_TO_CODE_CONTRACT.md and
 * 11_DESIGN/INFORMATION_ARCHITECTURE.md. Sidebar 240px, top bar 56px, canvas
 * 1440px, page padding 24px (11_DESIGN/DASHBOARD_LAYOUT_SPEC.md).
 *
 * On mobile the sidebar becomes bottom navigation rather than a shrunken
 * desktop sidebar.
 */

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Pill } from './primitives'

export const NAV_ITEMS = [
  { href: '/', label: 'Overview', short: 'Home' },
  { href: '/insights', label: 'Insights', short: 'Insights' },
  { href: '/products', label: 'Products', short: 'Products' },
  { href: '/funnel', label: 'Traffic & Funnel', short: 'Funnel' },
  { href: '/ads', label: 'Ads & GMV Max', short: 'Ads' },
  { href: '/experiments', label: 'Experiments', short: null },
  { href: '/imports', label: 'Data Imports', short: null },
  { href: '/settings', label: 'Settings', short: null },
] as const

/** Items shown in the mobile bottom bar — the five with a short label. */
const MOBILE_NAV = NAV_ITEMS.filter((item) => item.short !== null)

export function AppShell({
  children,
  currentPath,
  shopName,
  synthetic,
}: {
  children: ReactNode
  currentPath: string
  shopName: string
  synthetic: boolean
}) {
  return (
    <div className="min-h-screen bg-bg">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div className="mx-auto flex max-w-canvas">
        {/*
          The rail stretches to the full page height (flex default) while its
          contents stick to the viewport, so a long page does not leave the
          sidebar column visually truncated partway down.
        */}
        <aside className="hidden w-sidebar shrink-0 border-r border-line bg-surface lg:block">
          <div className="sticky top-0">
            <div className="flex h-topbar items-center border-b border-line px-5">
              <span className="text-sm font-semibold text-content">Shop Intelligence</span>
            </div>

            <div className="px-3 py-4">
              <p className="px-2 text-xs font-medium uppercase tracking-wide text-muted">Shop</p>
              <p className="mt-1 truncate px-2 text-sm font-medium text-content">{shopName}</p>
            </div>

            <nav aria-label="Primary" className="px-3 pb-4">
              <ul className="space-y-0.5">
                {NAV_ITEMS.map((item) => {
                  const active =
                    item.href === '/' ? currentPath === '/' : currentPath.startsWith(item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={`block rounded px-3 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-raised font-semibold text-content'
                            : 'text-muted hover:bg-raised hover:text-content'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-topbar items-center justify-between gap-4 border-b border-line bg-bg/95 px-6 backdrop-blur">
            <span className="truncate text-sm font-medium text-content lg:hidden">
              Shop Intelligence
            </span>
            <span className="hidden truncate text-sm text-muted lg:block">{shopName}</span>
            {synthetic ? <Pill tone="warning">Synthetic data</Pill> : null}
          </header>

          <main id="main" className="px-6 py-6 pb-24 lg:pb-6">
            {children}
          </main>
        </div>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-raised lg:hidden"
      >
        <ul className="mx-auto flex max-w-canvas">
          {MOBILE_NAV.map((item) => {
            const active =
              item.href === '/' ? currentPath === '/' : currentPath.startsWith(item.href)
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`block py-3 text-center text-xs ${
                    active ? 'font-semibold text-content' : 'text-muted'
                  }`}
                >
                  {item.short}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

export function PageHeader({
  screenId,
  title,
  description,
  meta,
}: {
  /** Screen id from 11_DESIGN/SCREEN_SPEC.md. Every screen maps to one. */
  screenId: string
  title: string
  description?: string
  meta?: ReactNode
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{screenId}</p>
      <h1 className="mt-1 text-xl font-semibold text-content">{title}</h1>
      {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p> : null}
      {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
    </div>
  )
}
