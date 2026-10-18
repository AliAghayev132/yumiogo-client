import { Fragment, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowLeft,
  Download,
  FileJson,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  CircleAlert,
  ChevronDown,
  ChevronUp,
  Wand2,
  X,
  ListChecks,
  BookOpen,
} from 'lucide-react'
import {
  Badge,
  Banner,
  Button,
  Card,
  ChipButton,
  EmptyState,
  IconButton,
  Select,
  SwitchRow,
  Table,
  TableCard,
  Tabs,
  Textarea,
  useBanner,
  useConfirm,
  errorMessage,
  formatNumber,
} from '@components'
import { useGetRestaurantImportTemplateQuery, useImportRestaurantsMutation } from '@store/api'
import { saveTextFile } from '@utils'
import { IMPORT_MODES, IMPORT_ACTIONS, TEMPLATE_FILENAME, parseImportJson } from './importJson'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const plural = (n, one, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`

// "2 errors · 1 warning"
const issuesLabel = (row) =>
  [row.errors?.length && plural(row.errors.length, 'error'), row.warnings?.length && plural(row.warnings.length, 'warning')]
    .filter(Boolean)
    .join(' · ')

/** Result table of a dry run or a real run, filtered by the action tabs; issues expand per row. */
const ResultsCard = ({ result }) => {
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(() => new Set())
  const { summary = {}, rows = [], dryRun } = result
  const label = (action) => IMPORT_ACTIONS[action]?.[dryRun ? 'planned' : 'done'] || action
  const shown = filter === 'all' ? rows : rows.filter((r) => r.action === filter)
  const toggle = (index) =>
    setOpen((set) => {
      const next = new Set(set)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })

  const tabs = [
    { value: 'all', label: 'All', count: summary.total ?? rows.length },
    { value: 'create', label: label('create'), count: summary.created ?? 0 },
    { value: 'update', label: label('update'), count: summary.updated ?? 0 },
    { value: 'skip', label: label('skip'), count: summary.skipped ?? 0 },
    { value: 'error', label: dryRun ? 'Errors' : 'Failed', count: summary.failed ?? 0 },
  ]

  return (
    <TableCard
      title={dryRun ? 'Validation results' : 'Import results'}
      subtitle={
        dryRun
          ? 'Nothing was saved. Fix the rows with errors, or import the valid ones.'
          : 'The restaurants below were saved. Open one to add photos, hours and the menu.'
      }
      toolbar={
        <Tabs
          variant="pill"
          items={tabs}
          value={filter}
          onChange={setFilter}
          aria-label="Filter rows"
          className="max-w-full overflow-x-auto"
        />
      }
    >
      <Table minWidth={720}>
        <Table.Header>
          <Table.Row>
            <Table.Head width={72}>Row</Table.Head>
            <Table.Head>Restaurant</Table.Head>
            <Table.Head width={130}>Action</Table.Head>
            <Table.Head>Issues</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {shown.length ? (
            shown.map((row) => {
              const issues = issuesLabel(row)
              const expanded = open.has(row.index)
              const linkable = row.id && row.action !== 'error' && (!dryRun || row.action === 'update')
              return (
                <Fragment key={row.index}>
                  <Table.Row>
                    <Table.Cell muted nowrap>
                      #{Number(row.index) + 1}
                    </Table.Cell>
                    <Table.Cell className="max-w-[320px]">
                      {linkable ? (
                        <Link to={`/dashboard/restaurants/${row.id}`} className="block truncate hover:text-brand-hover">
                          {row.name || 'Untitled'}
                        </Link>
                      ) : (
                        <span className="block truncate">{row.name || <span className="text-ink-disabled">No name</span>}</span>
                      )}
                    </Table.Cell>
                    <Table.Cell nowrap>
                      <Badge tone={IMPORT_ACTIONS[row.action]?.tone} size="sm">
                        {label(row.action)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell muted>
                      {issues ? (
                        <ChipButton
                          tone={row.errors?.length ? 'danger' : 'warning'}
                          onClick={() => toggle(row.index)}
                          aria-expanded={expanded}
                          icon={expanded ? ChevronUp : ChevronDown}
                        >
                          {issues}
                        </ChipButton>
                      ) : (
                        <span className="text-ink-disabled">—</span>
                      )}
                    </Table.Cell>
                  </Table.Row>
                  {expanded && (
                    <tr className="bg-canvas">
                      <td colSpan={4} className="px-6 pb-4 pt-1">
                        <ul className="flex flex-col gap-1.5 text-sm">
                          {(row.errors || []).map((msg, i) => (
                            <li key={`e${i}`} className="flex gap-2 text-error">
                              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {msg}
                            </li>
                          ))}
                          {(row.warnings || []).map((msg, i) => (
                            <li key={`w${i}`} className="flex gap-2 text-warning">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {msg}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })
          ) : (
            <Table.Empty colSpan={4} icon={ListChecks} title="No rows in this group" />
          )}
        </Table.Body>
      </Table>
    </TableCard>
  )
}

/** Collapsible "Field reference" from the template's `fields` descriptions. */
const FieldReference = ({ fields, limits }) => {
  const [open, setOpen] = useState(false)
  const entries = Object.entries(fields || {})
  if (!entries.length) return null
  return (
    <div className="rounded-lg border border-line bg-canvas">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-ink"
      >
        <BookOpen className="h-4 w-4 text-ink-muted" />
        <span className="flex-1">Field reference ({entries.length} fields)</span>
        {open ? <ChevronUp className="h-4 w-4 text-ink-muted" /> : <ChevronDown className="h-4 w-4 text-ink-muted" />}
      </button>
      {open && (
        <div className="border-t border-line px-4 py-3">
          {limits && (
            <p className="mb-3 text-xs text-ink-muted">
              Limits per import: {formatNumber(limits.restaurants)} restaurants
              {limits.menuCategories ? ` · ${formatNumber(limits.menuCategories)} menu categories` : ''}
              {limits.menuItems ? ` · ${formatNumber(limits.menuItems)} dishes` : ''} per restaurant.
            </p>
          )}
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-[10rem_1fr]">
            {entries.map(([field, description]) => (
              <Fragment key={field}>
                <dt className="font-mono font-semibold text-ink">{field}</dt>
                <dd className="text-ink-secondary">{description}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

/**
 * Import restaurants (/dashboard/restaurants/import): paste JSON or drop a .json file
 * ({ "restaurants": [...] } or a bare array), download the template, pick the mode (create only /
 * create or update) and Strict (off: unknown catalog names / city become warnings and are
 * dropped), the template's field reference, Validate (dry run → results table with per-row errors and warnings), then
 * "Import N restaurants" after a confirmation. The real run refreshes the restaurant lists.
 */
export const ImportRestaurantsPage = () => {
  const navigate = useNavigate()
  const banner = useBanner()
  const confirm = useConfirm()
  const fileRef = useRef(null)
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [mode, setMode] = useState('create')
  const [strict, setStrict] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState(null) // { dryRun, key, summary, rows }
  const template = useGetRestaurantImportTemplateQuery()
  const templateData = template.data?.data
  const maxRows = Number(templateData?.limits?.restaurants) || 0
  const [importRestaurants, { isLoading: working, originalArgs }] = useImportRestaurantsMutation()
  const importing = working && originalArgs?.dryRun === false
  const validating = working && originalArgs?.dryRun === true

  const parsed = useMemo(() => parseImportJson(text), [text])
  const tooMany = maxRows && parsed.restaurants?.length > maxRows
  const parseError = text.trim()
    ? parsed.error || (tooMany ? { message: `At most ${formatNumber(maxRows)} restaurants per import — split the file.` } : null)
    : null
  const count = tooMany ? 0 : parsed.restaurants?.length || 0
  // A dry run only counts for the exact text + options it checked.
  const inputKey = `${mode}|${strict}\n${text}`
  const validated = result?.dryRun && result.key === inputKey ? result : null
  const importable = validated ? (validated.summary?.created || 0) + (validated.summary?.updated || 0) : 0
  const done = result && !result.dryRun ? result : null

  const loadText = (value, name = '') => {
    setText(value)
    setFileName(name)
    setResult((r) => (r && !r.dryRun ? r : null))
  }

  const readFile = async (file) => {
    if (!file) return
    if (!/\.json$/i.test(file.name) && !/json/i.test(file.type)) {
      banner.error(`“${file.name}” is not a .json file`)
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      banner.error('The file is larger than 5 MB. Split it into smaller files.')
      return
    }
    try {
      loadText(await file.text(), file.name)
    } catch {
      banner.error(`Could not read “${file.name}”`)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    readFile(e.dataTransfer.files?.[0])
  }

  // The whole template (mode, dryRun, strict, restaurants, fields, limits) — postable as-is.
  const downloadTemplate = async () => {
    try {
      const data = templateData || (await template.refetch().unwrap())?.data
      if (!data) throw new Error('No template')
      saveTextFile(`${JSON.stringify(data, null, 2)}\n`, TEMPLATE_FILENAME, 'application/json;charset=utf-8')
    } catch (err) {
      banner.error(errorMessage(err, 'Could not download the template'))
    }
  }

  const format = () => {
    if (parsed.restaurants) setText(`${JSON.stringify({ restaurants: parsed.restaurants }, null, 2)}\n`)
  }

  const run = async (dryRun) => {
    if (parseError || !count) {
      banner.error((parseError || parsed.error)?.message || 'Nothing to import', { title: 'Fix the JSON first' })
      return null
    }
    try {
      const res = await importRestaurants({ restaurants: parsed.restaurants, mode, strict, dryRun }).unwrap()
      const data = res?.data || {}
      const next = { dryRun, key: inputKey, summary: data.summary || {}, rows: data.rows || [] }
      setResult(next)
      return next
    } catch (err) {
      const details = err?.data?.errors?.length ? ` — ${err.data.errors.slice(0, 3).join('; ')}` : ''
      banner.error(`${errorMessage(err, dryRun ? 'Validation failed' : 'Import failed')}${details}`)
      return null
    }
  }

  const validate = async () => {
    const next = await run(true)
    if (!next) return
    const { failed = 0, created = 0, updated = 0 } = next.summary
    if (failed) banner.warning(`${plural(failed, 'row')} with errors. They are skipped on import.`, { title: 'Validated' })
    else if (created + updated) banner.success(`All ${plural(created + updated, 'row')} can be imported.`, { title: 'Validated' })
    else banner.info('Nothing to import — every row is skipped.')
  }

  const startImport = async () => {
    const { failed = 0, skipped = 0, created = 0, updated = 0 } = validated.summary
    const ok = await confirm({
      tone: 'primary',
      icon: FileUp,
      title: `Import ${plural(importable, 'restaurant')}?`,
      message: [
        created && `${plural(created, 'restaurant')} will be created`,
        updated && `${plural(updated, 'restaurant')} will be updated`,
      ]
        .filter(Boolean)
        .join(' and ')
        .concat('. New restaurants follow the “Restaurant approval” setting.'),
      notice:
        failed || skipped
          ? `${[failed && plural(failed, 'row') + ' with errors', skipped && plural(skipped, 'skipped row')].filter(Boolean).join(' and ')} will not be imported.`
          : undefined,
      confirmText: `Import ${formatNumber(importable)}`,
    })
    if (!ok) return
    const next = await run(false)
    if (!next) return
    const s = next.summary
    banner.success(
      [s.created && `${plural(s.created, 'restaurant')} created`, s.updated && `${formatNumber(s.updated)} updated`, s.failed && `${formatNumber(s.failed)} failed`]
        .filter(Boolean)
        .join(' · ') || 'Nothing was imported',
      { title: 'Import finished' }
    )
  }

  const reset = () => {
    setText('')
    setFileName('')
    setResult(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/dashboard/restaurants" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All restaurants
      </Link>

      {done ? (
        <Card padding="chart" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-brand" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold leading-[18px] text-ink">Import finished</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                {formatNumber(done.summary.created || 0)} created · {formatNumber(done.summary.updated || 0)} updated ·{' '}
                {formatNumber(done.summary.skipped || 0)} skipped · {formatNumber(done.summary.failed || 0)} failed
                {fileName ? ` · ${fileName}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={reset} leftIcon={FileUp}>
                Import another file
              </Button>
              <Button size="sm" onClick={() => navigate('/dashboard/restaurants')}>
                View restaurants
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card padding="chart">
          <Card.Header
            divider
            className="-mx-[18px] px-[18px]"
            actions={
              <Button
                size="sm"
                variant="outline"
                leftIcon={Download}
                onClick={downloadTemplate}
                loading={template.isFetching && !templateData}
              >
                Download template
              </Button>
            }
          >
            <Card.Title>Import restaurants</Card.Title>
            <Card.Description>
              Paste JSON or drop a .json file — <code className="font-mono">{'{ "restaurants": [ … ] }'}</code> or a bare
              array. Start from the template to see every supported field.
            </Card.Description>
          </Card.Header>

          <div className="flex flex-col gap-4">
            <div
              className="relative"
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
              }}
              onDrop={onDrop}
            >
              <Textarea
                label="Restaurants JSON"
                value={text}
                onChange={(e) => loadText(e.target.value, fileName)}
                rows={16}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder={'{\n  "restaurants": [\n    { "name": "Sushi Palace", "city": "Baku", … }\n  ]\n}'}
                wrap="off"
                className="font-mono text-xs! leading-5!"
                error={
                  parseError &&
                  `${parseError.message}${parseError.line ? ` (line ${parseError.line}, column ${parseError.column})` : ''}`
                }
                helperText={
                  count
                    ? `${plural(count, 'restaurant')} found${fileName ? ` in ${fileName}` : ''}.`
                    : 'Tip: drag a .json file onto this box.'
                }
              />
              {dragging && (
                <div className="pointer-events-none absolute inset-0 top-7 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand bg-brand-soft/90 text-sm font-semibold text-brand-hover">
                  <FileJson className="h-8 w-8" />
                  Drop the .json file to load it
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" leftIcon={FileUp} onClick={() => fileRef.current?.click()}>
                Choose .json file
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  readFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              <Button size="sm" variant="ghost" leftIcon={Wand2} onClick={format} disabled={!count}>
                Format JSON
              </Button>
              {fileName && (
                <span className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas py-0.5 pl-2.5 pr-0.5 text-xs text-ink-secondary">
                  <FileJson className="h-3.5 w-3.5" /> {fileName}
                  <IconButton icon={X} size="xs" tone="muted" label="Clear the file" onClick={reset} />
                </span>
              )}
            </div>

            <FieldReference fields={templateData?.fields} limits={templateData?.limits} />

            <div className="grid grid-cols-1 items-start gap-4 border-t border-line pt-4 md:grid-cols-2">
              <Select
                label="Mode"
                value={mode}
                options={IMPORT_MODES.map((m) => ({ value: m.value, label: m.label, description: m.description }))}
                onValueChange={setMode}
                clearable={false}
                helperText={IMPORT_MODES.find((m) => m.value === mode)?.description}
              />
              <div className="rounded-lg border border-line bg-canvas md:mt-[26px]">
                <SwitchRow
                  label="Strict"
                  description={
                    strict
                      ? 'Unknown cuisines, features, tags, dietary options or cities fail the row.'
                      : 'Unknown catalog names and cities are dropped with a warning; the row is still imported.'
                  }
                  checked={strict}
                  onChange={setStrict}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="outline" onClick={validate} loading={validating} disabled={!count || importing}>
                  Validate
                </Button>
                <span title={validated ? undefined : 'Validate first — the import uses the checked rows.'}>
                  <Button onClick={startImport} loading={importing} disabled={!validated || !importable || validating}>
                    {validated ? `Import ${plural(importable, 'restaurant')}` : 'Import restaurants'}
                  </Button>
                </span>
              </div>

              {importing && (
                <Banner tone="info" title="Importing…">
                  Saving {plural(importable, 'restaurant')}. Keep this page open until it finishes.
                </Banner>
              )}
              {result?.dryRun && !validated && (
                <p className="text-right text-xs text-ink-muted">
                  The JSON or the options changed since the last check — validate again.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {result ? (
        <ResultsCard key={`${result.dryRun}|${result.key}`} result={result} />
      ) : (
        <Card>
          <EmptyState
            compact
            icon={ListChecks}
            title="Validate to see the results"
            description="Each row is checked against the catalog (cuisines, cities, …) before anything is saved."
          />
        </Card>
      )}
    </div>
  )
}
