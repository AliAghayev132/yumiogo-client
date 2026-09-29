// Where an FAQ is shown (mirrors server faqAudiences).
export const AUDIENCES = [
  { value: 'both', label: 'App & website' },
  { value: 'app', label: 'App only' },
  { value: 'web', label: 'Website only' },
]

export const audienceLabel = (value) =>
  AUDIENCES.find((a) => a.value === value)?.label || value

// Badge tone per audience.
export const audienceTone = { both: 'neutral', app: 'info', web: 'purple' }
