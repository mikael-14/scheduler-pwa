import axiosInstance from '../config/axios';
import { scheduleDB } from '../utils/db';

export const schedulesApi = {
  async fetchSchedules(panel = 'admin') {
    try {
      const response = await axiosInstance.get(`/${panel}/schedules`);
      const data = response.data.data || response.data;
      
      // Update local DB
      await scheduleDB.clear();
      await scheduleDB.putAll(data);
      
      return data;
    } catch (err) {
      console.error('Failed to fetch schedules from API, falling back to local DB', err);
      // Fallback to local DB
      const localEvents = await scheduleDB.getAll();
      if (localEvents.length > 0) {
        return localEvents;
      }
      throw err;
    }
  },

  async createSchedule(event: any, panel = 'admin') {
    const response = await axiosInstance.post(`/${panel}/schedules`, event);
    const newEvent = response.data.data || response.data;
    await scheduleDB.put(newEvent);
    return newEvent;
  },

  async updateSchedule(id: number | string, event: any, panel = 'admin') {
    const response = await axiosInstance.patch(`/${panel}/schedules/${id}`, event);
    const updatedEvent = response.data.data || response.data;
    await scheduleDB.put(updatedEvent);
    return updatedEvent;
  },

  async deleteSchedule(id: number | string, panel = 'admin') {
    await axiosInstance.delete(`/${panel}/schedules/${id}`);
    await scheduleDB.delete(id);
  }
};
