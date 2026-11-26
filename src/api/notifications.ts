import axiosInstance from '../config/axios'
import { notificationDB } from '../utils/db'
import { isNetworkError } from '../utils/apiError'

export interface AppNotification {
  id: string
  title: string
  body: string
  status: 'success' | 'danger' | 'warning' | 'info' | string
  /** what it is about: pending_approval, schedule_status, schedule_updated, coverage, participant_added, participant_removed, booked_for_you, announcement, account, other */
  kind?: string
  path: string
  /** one link per day of a coverage summary ("terça-feira, 24 de novembro (amanhã)" → its booking form) */
  links?: { label: string; path: string }[]
  read_at: string | null
  created_at: string
}

export interface NotificationPage {
  unread: number
  data: AppNotification[]
  /** pass it back as `cursor` for the next page; null on the last one */
  next_cursor?: string | null
  offline?: boolean
}

export interface ListOptions {
  filter?: 'all' | 'unread'
  /** the previous page's `next_cursor` */
  cursor?: string | null
  /** how many per page (the server's default and maximum is 50) */
  perPage?: number
}

export const notificationsApi = {
  /**
   * The latest notifications, a page at a time. The first page of "all" is also saved on the
   * device, so the list can be read without a connection (`offline: true` then, and no next page).
   */
  async list(options: ListOptions = {}): Promise<NotificationPage> {
    const filter = options.filter ?? 'all'
    const savesCopy = filter === 'all' && !options.cursor
    try {
      const response = await axiosInstance.get('/notifications', {
        params: {
          filter: filter === 'unread' ? 'unread' : undefined,
          cursor: options.cursor || undefined,
          per_page: options.perPage,
        },
      })
      if (savesCopy) notificationDB.replaceAll(response.data.data).catch(() => undefined)
      return response.data
    } catch (error) {
      // offline: only the first page comes from the saved copy
      if (!isNetworkError(error) || options.cursor) throw error
      const saved: AppNotification[] = await notificationDB.getAll()
      if (!saved.length) throw error
      saved.sort((a, b) => b.created_at.localeCompare(a.created_at))
      const unread = saved.filter((item) => !item.read_at)
      return { data: filter === 'unread' ? unread : saved, unread: unread.length, next_cursor: null, offline: true }
    }
  },

  async markRead(id: string): Promise<void> {
    await axiosInstance.post(`/notifications/${id}/read`)
  },

  /** Marks the chosen ones read; returns the new unread count. */
  async markManyRead(ids: string[]): Promise<number> {
    const response = await axiosInstance.post('/notifications/read', { ids })
    return response.data.unread
  },

  /** Marks the chosen ones unread again; returns the new unread count. */
  async markManyUnread(ids: string[]): Promise<number> {
    const response = await axiosInstance.post('/notifications/unread', { ids })
    return response.data.unread
  },

  async markAllRead(): Promise<void> {
    await axiosInstance.post('/notifications/read-all')
  },

  async vapidPublicKey(): Promise<string> {
    const response = await axiosInstance.get('/pwa/vapid-public-key')
    return response.data.key
  },

  async subscribe(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
    await axiosInstance.post('/pwa/subscribe', subscription)
  },

  async unsubscribe(endpoint: string): Promise<void> {
    await axiosInstance.delete('/pwa/subscribe', { data: { endpoint } })
  },
}
