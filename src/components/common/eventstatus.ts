const STATUS_EVENT_CLASSES: Record<string, string> = {
  pending: '!bg-amber-50 !text-amber-700 !border !border-amber-200 dark:!bg-amber-500/10 dark:!text-amber-400 dark:!border-amber-500/20',
  approved: '!bg-emerald-50 !text-emerald-700 !border !border-emerald-200 dark:!bg-emerald-500/10 dark:!text-emerald-400 dark:!border-emerald-500/20',
  rejected: '!bg-rose-50 !text-rose-700 !border !border-rose-200 dark:!bg-rose-500/10 dark:!text-rose-400 dark:!border-rose-500/20',
  cancelled: '!bg-rose-50 !text-rose-700 !border !border-rose-200 dark:!bg-rose-500/10 dark:!text-rose-400 dark:!border-rose-500/20',
  completed: '!bg-primary-50 !text-primary-700 !border !border-primary-200 dark:!bg-primary-500/10 dark:!text-primary-400 dark:!border-primary-500/20',
  notshown: '!bg-sky-50 !text-sky-700 !border !border-sky-200 dark:!bg-sky-500/10 dark:!text-sky-400 dark:!border-sky-500/20',
  not_shown: '!bg-sky-50 !text-sky-700 !border !border-sky-200 dark:!bg-sky-500/10 dark:!text-sky-400 dark:!border-sky-500/20',
}

export const getEventStatusClass = (status: string | undefined): string => {
  if (!status) return '!bg-slate-600 !text-white'
  const key = status.toLowerCase().replace('-', '_')
  return STATUS_EVENT_CLASSES[key] || '!bg-slate-600 !text-white'
}
