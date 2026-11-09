import type { Component } from 'vue'
import {
  CheckBadgeIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeSlashIcon,
  MinusCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/20/solid'

/**
 * The colour and icon of each schedule status, as the admin panel's ScheduleStatus enum
 * (getColor / getIcon): pending warning + clock, approved success + check-circle, rejected
 * danger + x-circle, cancelled danger + minus-circle, completed primary + check-badge,
 * not shown info + eye-slash. The colour names are Filament's (see tailwind.config).
 * Classes are written out in full so Tailwind keeps them.
 */
export const STATUS_STYLE: Record<string, { icon: Component; badge: string }> = {
  pending: { icon: ClockIcon, badge: 'bg-warning-100 text-warning-800 dark:bg-warning-500/15 dark:text-warning-300' },
  approved: { icon: CheckCircleIcon, badge: 'bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-300' },
  rejected: { icon: XCircleIcon, badge: 'bg-danger-100 text-danger-800 dark:bg-danger-500/15 dark:text-danger-300' },
  cancelled: { icon: MinusCircleIcon, badge: 'bg-danger-100 text-danger-800 dark:bg-danger-500/15 dark:text-danger-300' },
  completed: { icon: CheckBadgeIcon, badge: 'bg-primary-100 text-primary-800 dark:bg-primary-500/15 dark:text-primary-300' },
  not_shown: { icon: EyeSlashIcon, badge: 'bg-info-100 text-info-800 dark:bg-info-500/15 dark:text-info-300' },
}

/** The decision buttons, in the colour and icon of the status they lead to. */
export const ACTION_BUTTON = {
  approve: 'bg-success-600 text-white shadow-sm hover:bg-success-500',
  reject: 'bg-danger-600 text-white shadow-sm hover:bg-danger-500',
  // same colour as rejecting (both "danger" in the enum): an outline tells them apart
  cancel: 'border border-danger-300 text-danger-700 hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400 dark:hover:bg-danger-950',
} as const
