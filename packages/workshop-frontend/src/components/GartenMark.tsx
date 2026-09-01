/** The Garten sprout, drawn inline so it tints with the surrounding text color. */
export default function GartenMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <rect width="64" height="64" rx="14" fill="var(--color-accent-fill)" />
      <path d="M32 54V30" stroke="var(--color-ink-inverse)" strokeWidth="5" strokeLinecap="round" />
      <path d="M32 34c0-9 6-16 16-16 0 9-6 16-16 16Z" fill="var(--color-ink-inverse)" />
      <path d="M32 42c0-8-5-14-14-14 0 8 5 14 14 14Z" fill="var(--color-accent-leaf)" />
    </svg>
  )
}
