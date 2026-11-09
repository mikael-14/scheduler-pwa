// a schedule's status as its background on the calendar, in the admin panel's colours (ScheduleStatus enum)
const STATUS_EVENT_CLASSES: Record<string, string> = {
  pending: '!bg-warning-50 !text-warning-700 !border !border-warning-200 dark:!bg-warning-500/10 dark:!text-warning-400 dark:!border-warning-500/20',
  approved: '!bg-success-50 !text-success-700 !border !border-success-200 dark:!bg-success-500/10 dark:!text-success-400 dark:!border-success-500/20',
  rejected: '!bg-danger-50 !text-danger-700 !border !border-danger-200 dark:!bg-danger-500/10 dark:!text-danger-400 dark:!border-danger-500/20',
  cancelled: '!bg-danger-50 !text-danger-700 !border !border-danger-200 dark:!bg-danger-500/10 dark:!text-danger-400 dark:!border-danger-500/20',
  completed: '!bg-primary-50 !text-primary-700 !border !border-primary-200 dark:!bg-primary-500/10 dark:!text-primary-400 dark:!border-primary-500/20',
  not_shown: '!bg-info-50 !text-info-700 !border !border-info-200 dark:!bg-info-500/10 dark:!text-info-400 dark:!border-info-500/20',
}

export const getEventStatusClass = (status: string | undefined): string => {
  if (!status) return '!bg-slate-600 !text-white'
  const key = status.toLowerCase().replace('-', '_')
  return STATUS_EVENT_CLASSES[key] || '!bg-slate-600 !text-white'
}
