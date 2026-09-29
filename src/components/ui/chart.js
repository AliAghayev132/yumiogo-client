import { chartColors, colors } from './tokens'

/*
 * recharts presets matching the Figma chart cards: Inter 12 #54555A axis labels, no axis
 * lines/ticks, #F5F5F5 horizontal grid, white tooltip card with the menu shadow.
 *   <XAxis dataKey="day" {...chartAxisProps} />
 *   <CartesianGrid {...chartGridProps} />
 *   <Tooltip {...chartTooltipProps} />
 */
export const chartAxisTick = { fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontSize: 12, fill: colors.axis }

export const chartAxisProps = { tick: chartAxisTick, tickLine: false, axisLine: false, tickMargin: 8 }

export const chartGridProps = { stroke: chartColors.grid, vertical: false }

export const chartTooltipProps = {
  cursor: { fill: 'rgba(33, 33, 33, 0.04)' },
  contentStyle: {
    background: colors.surface,
    border: 'none',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgb(0 0 0 / 0.3), 0 4px 8px 3px rgb(0 0 0 / 0.15)',
    fontFamily: 'DM Sans, ui-sans-serif, system-ui, sans-serif',
    fontSize: 12,
    color: colors.ink,
    padding: '8px 12px',
  },
  labelStyle: { color: colors.inkMuted, marginBottom: 4 },
  itemStyle: { color: colors.ink, padding: 0 },
}

export { chartColors }
