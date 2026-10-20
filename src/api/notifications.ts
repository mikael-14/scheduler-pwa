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
  read_at: string | null
  created_at: string
}

export const notificationsApi = {
  /**
   * The latest notifications. Each successful load is also saved on the device, so the list can
   * be read without a connection (`offline: true` then).
   */
  async list(): Promise<{ unread: number; data: AppNotification[]; offline?: boolean }> {
    try {
      const response = await axiosInstance.get('/notifications')
      notificationDB.replaceAll(response.data.data).catch(() => undefined)
      return response.data
    } catch (error) {
      if (!isNetworkError(error)) throw error
      const saved: AppNotification[] = await notificationDB.getAll()
      if (!saved.length) throw error
      saved.sort((a, b) => b.created_at.localeCompare(a.created_at))
      return { data: saved, unread: saved.filter((item) => !item.read_at).length, offline: true }
    }
  },

  async markRead(id: string): Promise<void> {
    await axiosInstance.post(`/notifications/${id}/read`)
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
