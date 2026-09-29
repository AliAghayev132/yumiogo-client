import { Card, SwitchRow, Dot } from '@components'
import { OpeningHoursEditor } from './OpeningHoursEditor'

/**
 * Hours tab of the restaurant editor: "Temporarily closed" override + the weekly hours.
 * "Open now" is worked out by the server from the saved hours in the app timezone.
 */
export const HoursTab = ({ form, setForm, restaurant, timezone, disabled }) => (
  <div className="flex flex-col gap-6">
    <Card padding="chart">
      <SwitchRow
        label="Temporarily closed"
        description="Shows the restaurant as closed in the app whatever its hours (renovation, holidays…)."
        checked={form.temporarilyClosed}
        onChange={(temporarilyClosed) => setForm((f) => ({ ...f, temporarilyClosed }))}
        disabled={disabled}
      />
    </Card>

    <Card padding="chart">
      <Card.Header divider className="-mx-[18px] px-[18px]">
        <div className="flex flex-wrap items-center gap-3">
          <Card.Title>Weekly hours</Card.Title>
          {restaurant && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${restaurant.openNow ? 'text-success' : 'text-error'}`}
              title="Worked out by the server from the saved hours"
            >
              <Dot tone={restaurant.openNow ? 'brand' : 'danger'} />
              {restaurant.temporarilyClosed ? 'Temporarily closed' : restaurant.openNow ? 'Open now' : 'Closed now'}
            </span>
          )}
        </div>
        <p className="mt-0.5 font-chart text-xs text-ink-muted">
          “Open now” is worked out from these hours{timezone ? ` in ${timezone} time` : ''}. With no hours set, the
          restaurant shows as open unless it is temporarily closed.
        </p>
      </Card.Header>
      <OpeningHoursEditor value={form.hours} onChange={(hours) => setForm((f) => ({ ...f, hours }))} disabled={disabled} />
    </Card>
  </div>
)
