import { useMemo } from 'react'
import {
  AppWindow,
  ChartLineUp,
  FileText,
  Kanban,
  Presentation,
  type Icon,
} from '@phosphor-icons/react'

// A few example work tasks shown under the Home composer, so a new user immediately sees the kind
// of thing they can ask for. Picking one drops a starter prompt into the composer (it does not
// auto-send) so the user can tweak it before running.
type TaskSuggestion = {
  id: string
  label: string
  description: string
  prompt: string
  icon: Icon
}

// Formats are advertised by example rather than by a row of "Start with Docs" buttons, so the
// first move isn't "pick a file type". The formats themselves are in the composer's `+` menu.
const SUGGESTIONS: TaskSuggestion[] = [
  {
    id: 'doc',
    label: 'Write something down',
    description: 'A doc you and your agent keep editing together',
    icon: FileText,
    prompt:
      'Start a document for me. Ask what it is about, draft a first version with clear headings, and keep it short so I can edit it.',
  },
  {
    id: 'plan',
    label: 'Plan a project',
    description: 'A board with what is next, who does it and when',
    icon: Kanban,
    prompt:
      'Help me plan a project as a board: columns for later, next and doing, a handful of first cards, and a short note on how we work. Ask me what the project is first.',
  },
  {
    id: 'tool',
    label: 'Build a small tool',
    description: 'A calculator, tracker or dashboard, made just for you',
    icon: AppWindow,
    prompt:
      'Build a small interactive tool I can use right here: a calculator, tracker or dashboard. Ask me what it should do, then make it.',
  },
  {
    id: 'slides',
    label: 'Make a few slides',
    description: 'A short deck that says one thing well',
    icon: Presentation,
    prompt:
      'Create a short slide deck. Ask me who it is for and what the one takeaway is, then write no more than eight slides.',
  },
  {
    id: 'insights',
    label: 'Make sense of a spreadsheet',
    description: 'Turn a sheet or CSV into trends and a plain summary',
    icon: ChartLineUp,
    prompt:
      'Turn a dataset I will share (a spreadsheet, CSV or pasted table) into a plain summary: key trends, anything odd, and what I should do about it.',
  },
]

// One row, shared by every suggestion so the list reads as one kind of offer.
function SuggestionRow({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="press group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-kumo-tint"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kumo-fill text-kumo-subtle transition-colors group-hover:text-kumo-default">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] leading-[18px] font-medium tracking-[-0.25px] text-kumo-default">
            {label}
          </span>
          <span className="block truncate text-[12px] leading-4 tracking-[-0.2px] text-kumo-subtle">
            {description}
          </span>
        </span>
      </button>
    </li>
  )
}

// How many of the suggestions above to show at once. The list is longer than the page should be:
// four rows is inspiration, seven is a menu to read. Which three appear is chosen per visit, so the
// ones below the fold still get seen -- and so Home doesn't look like it only does one thing.
const VISIBLE_SUGGESTIONS = 3

function pickSuggestions(): TaskSuggestion[] {
  let shuffled = [...SUGGESTIONS]
  for (let i = shuffled.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, VISIBLE_SUGGESTIONS)
}

export default function HomeTaskSuggestions({
  onPick,
}: {
  onPick: (prompt: string) => void
}) {
  // Chosen once per mount: re-rolling on every render would shuffle the list under the pointer.
  const visible = useMemo(pickSuggestions, [])

  return (
    <section aria-label="Example tasks" className="flex flex-col gap-1">
      <h3 className="rail-label px-1 pb-1">Or start with</h3>
      <ul className="flex flex-col gap-0.5">
        {visible.map((suggestion) => (
          <SuggestionRow
            key={suggestion.id}
            icon={<suggestion.icon size={16} />}
            label={suggestion.label}
            description={suggestion.description}
            onClick={() => onPick(suggestion.prompt)}
          />
        ))}
      </ul>
    </section>
  )
}
