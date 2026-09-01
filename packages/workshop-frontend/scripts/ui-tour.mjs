#!/usr/bin/env node
// Visual verification tour for the Garten UI. Signs up (or in), finishes onboarding, screenshots
// every shell route in light and dark, creates a space from the Library, and screenshots the
// editor. Rerun after any frontend change and read the PNGs.
//
//   pnpm dev                                  # in another terminal
//   pnpm exec playwright install chromium     # once; needs the playwright package
//   node scripts/ui-tour.mjs                  # writes ./ui-tour/<name>.png|txt
//
// Env: BASE (http://localhost:3000), OUT (ui-tour), TOUR_USER, TOUR_PASS, ROUTES (comma list),
// MODES (light,dark), NEW_ITEM (Library entry to click, default "New Doc").
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:3000'
const OUT = process.env.OUT ?? 'ui-tour'
const USER = process.env.TOUR_USER ?? 'tour'
const PASS = process.env.TOUR_PASS ?? 'tour-password-1'
const ROUTES = (process.env.ROUTES ?? '/,/workspaces,/outputs,/explore,/blueprints,/gatekeepers,/providers,/profile').split(',')
const MODES = (process.env.MODES ?? 'light,dark').split(',')
const NEW_ITEM = process.env.NEW_ITEM ?? 'New Doc'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)) })
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 300)}`))

async function shot(name) {
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  const text = await page.innerText('body').catch(() => '')
  writeFileSync(`${OUT}/${name}.txt`, text)
  console.log('shot', name, '|', text.replace(/\s+/g, ' ').slice(0, 120))
}
const hasToken = () => page.evaluate(() => !!localStorage.getItem('authToken'))
async function waitToken(ms) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (await hasToken()) return true
    await page.waitForTimeout(500)
  }
  return false
}
const bodyText = async () => (await page.innerText('body')).replace(/\s+/g, ' ').slice(0, 200)

async function signIn() {
  await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' })
  const inputs = page.locator('input')
  await inputs.nth(0).fill(USER)
  await inputs.nth(1).fill(PASS)
  await inputs.nth(2).fill(PASS)
  await page.locator('form button').last().click()
  if (await waitToken(30000)) return console.log('signed up as', USER)
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.locator('input').nth(0).fill(USER)
  await page.locator('input[type=password]').first().fill(PASS)
  await page.locator('form button').last().click()
  if (await waitToken(30000)) return console.log('signed in as', USER)
  throw new Error(`sign-in failed: ${await bodyText()}`)
}

async function finishOnboarding() {
  const next = () => page.getByRole('button', { name: /^(next|open my garden)/i }).last()
  await next().waitFor({ timeout: 15000 }).catch(() => {})
  for (let i = 0; i < 6 && (await next().count()); i++) {
    await shot(`onboarding-${i}`)
    await next().click()
    await page.waitForTimeout(1200)
  }
}

async function createSpace() {
  await page.goto(`${BASE}/outputs`, { waitUntil: 'networkidle' })
  const entry = page.getByText(NEW_ITEM, { exact: true }).first()
  await entry.waitFor({ timeout: 8000 }).catch(() => {})
  if (await entry.count()) {
    await entry.click()
  } else {
    await page.getByRole('button', { name: 'Search' }).first().click()
    await page.keyboard.type(NEW_ITEM)
    await page.waitForTimeout(500)
    await page.keyboard.press('Enter')
  }
  await page.waitForURL(/\/workspace\//, { timeout: 30000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2500)
  for (const mode of MODES) {
    await page.evaluate((m) => localStorage.setItem('gadgets:theme-mode', m), mode)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    await shot(`${mode}-space`)
  }
}

await signIn()
await page.waitForLoadState('networkidle')
await finishOnboarding()
await createSpace()
for (const mode of MODES) {
  await page.evaluate((m) => localStorage.setItem('gadgets:theme-mode', m), mode)
  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
    await shot(`${mode}-${route === '/' ? 'home' : route.slice(1).replace(/\//g, '_')}`)
  }
}
await page.evaluate(() => localStorage.setItem('gadgets:theme-mode', 'light'))
await page.setViewportSize({ width: 390, height: 844 })
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await shot('mobile-home')
await page.getByRole('button', { name: /open menu/i }).click()
await shot('mobile-drawer')

writeFileSync(`${OUT}/console-errors.txt`, errors.join('\n'))
console.log('console errors:', errors.length)
await browser.close()
if (errors.length) process.exit(1)
