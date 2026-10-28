import axiosInstance from '../config/axios';
import { isNetworkError } from '../utils/apiError';
import { readOfflineSchedule, readOfflineSchedules, syncOfflineData } from '../utils/offlineSync';

export type ScheduleStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'not_shown';

export interface ScheduleParticipant {
  id?: number;
  user_id: number;
  name?: string | null;
  avatar_url?: string | null;
  status?: ScheduleStatus;
  description?: string | null;
  /** approvers, pending participants: why they cannot be approved yet (null = they can) */
  approval_problem?: string | null;
  /** the schedule's owner (or an admin), once it started: this person did not come */
  can_mark_not_shown?: boolean;
}

/** A schedule as the API returns it (see ScheduleTransformer). */
export interface Schedule {
  id: number;
  start: string;
  end: string | null;
  all_day: boolean;
  description: string | null;
  /** staff only */
  internal_note?: string | null;
  status: ScheduleStatus;
  user_id: number;
  schedule_type_id: number;
  schedule_type: { id: number; name: string; color: string | null; all_day: boolean; range: boolean } | null;
  user: { id: number; name: string; avatar_url?: string | null } | null;
  schedule_users: ScheduleParticipant[];
  /** what the signed-in user may do with it */
  can: {
    /** cancel: its creator, before it starts (there is no delete outside the admin panel) */
    update: boolean; cancel: boolean; approve: boolean;
    /** admins, once it started: its owner did not come */
    not_shown?: boolean;
    /** join / leave someone else's schedule */
    join?: boolean; leave?: boolean;
    /** decide on pending participants (people who joined) */
    approve_participants?: boolean;
  };
  /** approvers, pending primary schedules: why it cannot be approved yet (null = it can) */
  approval_problem?: string | null;
  /** set when it comes from the copy saved on the device (no connection) */
  offline?: boolean;
}

/** A calendar range of schedules; `offline` when read from the device, `complete` when it covers the whole range. */
export interface ScheduleList {
  data: Schedule[];
  offline: boolean;
  complete: boolean;
}

/** What is sent to create or change a schedule. Times are "YYYY-MM-DD HH:mm" in server time. */
export interface ScheduleInput {
  schedule_type_id: number;
  start: string;
  end?: string | null;
  all_day?: boolean;
  description?: string | null;
  internal_note?: string | null;
  status?: ScheduleStatus;
  user_id?: number | null;
  schedule_users?: { user_id: number }[];
}

export interface ScheduleTypeOption {
  id: number;
  name: string;
  color: string | null;
  description: string | null;
  /** needs an end time */
  range: boolean;
  /** may be all day */
  all_day: boolean;
  /** date window of the type */
  start: string | null;
  end: string | null;
  /** daily hours, "HH:mm" */
  min_time: string | null;
  max_time: string | null;
}

/** The choices of the schedule form (GET /schedules/form-options). */
export interface ScheduleFormOptions {
  types: ScheduleTypeOption[];
  people: { id: number; name: string; avatar_url?: string | null }[];
  statuses: { value: ScheduleStatus; label: string }[];
  /** all_day: may book whole-day schedules (no hours), on types that allow them */
  can: { book_for_others: boolean; past_dates: boolean; internal_note: boolean; all_day: boolean };
  timezone: string;
}

/** A person as the pending list shows them (photo as a full URL; null = initials). */
export interface SchedulePerson {
  id: number;
  name: string;
  avatar_url?: string | null;
}

export interface PendingSchedule {
  id: number;
  start: string;
  end: string | null;
  all_day: boolean;
  description: string | null;
  status: string;
  user: SchedulePerson | null;
  schedule_type: { id: number; name: string; color: string | null } | null;
  /** names only (kept for older app versions) */
  participants: string[];
  /** the same people with their photos (missing from an older API) */
  participant_people?: SchedulePerson[];
  /** primary type: why it cannot be approved yet (null = it can) */
  approval_problem?: string | null;
}

/** Someone who joined an approved schedule and waits for their own decision. */
export interface PendingParticipation {
  schedule_id: number;
  user: SchedulePerson | null;
  start: string;
  end: string | null;
  all_day: boolean;
  owner: SchedulePerson | null;
  schedule_type: { id: number; name: string; color: string | null } | null;
  approval_problem?: string | null;
}

export interface PendingWork {
  schedules: PendingSchedule[];
  participations: PendingParticipation[];
}

export interface ScheduleFilters {
  start?: string;
  end?: string;
  /** only schedules I own or take part in */
  mine?: boolean;
  /** schedule type ids */
  types?: number[];
  statuses?: ScheduleStatus[];
  /** user ids: schedules they own or take part in */
  people?: number[];
}

/** A calendar range (FullCalendar's exclusive end) as inclusive "YYYY-MM-DD" days. */
function rangeDays(filters: ScheduleFilters): { from: string; to: string } {
  const from = (filters.start ?? '0000-01-01').slice(0, 10);
  if (!filters.end) return { from, to: '9999-12-31' };
  const end = new Date(`${filters.end.slice(0, 10)}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() - 1);
  return { from, to: end.toISOString().slice(0, 10) };
}

export const schedulesApi = {
  /**
   * Schedules of a calendar range. Without a connection, the copy saved on the device (this
   * week and next, see utils/offlineSync) is used, and `complete` says whether it covers the
   * whole range.
   */
  async fetchSchedules(panel = 'admin', filters: ScheduleFilters = {}): Promise<ScheduleList> {
    const params: Record<string, string> = { per_page: '500' };

    // Spatie QueryBuilder expects `filter[key_name]` format
    if (filters.start) params['filter[start_from]'] = filters.start;
    if (filters.end) params['filter[start_to]'] = filters.end;
    if (filters.mine) params['filter[mine]'] = '1';
    if (filters.types?.length) params['filter[schedule_type_id]'] = filters.types.join(',');
    if (filters.statuses?.length) params['filter[status]'] = filters.statuses.join(',');
    if (filters.people?.length) params['filter[person]'] = filters.people.join(',');

    try {
      const response = await axiosInstance.get(`/${panel}/schedules`, { params });
      return { data: response.data.data || response.data, offline: false, complete: true };
    } catch (err) {
      if (!isNetworkError(err)) throw err;

      const { from, to } = rangeDays(filters);
      const saved = await readOfflineSchedules(from, to, filters);
      if (!saved.window) throw err; // nothing was ever saved on this device
      return { data: saved.schedules, offline: true, complete: saved.complete };
    }
  },

  /** One schedule; without a connection, the saved copy if it is in the offline window. */
  async fetchSchedule(id: number | string, panel = 'admin'): Promise<Schedule> {
    try {
      const response = await axiosInstance.get(`/${panel}/schedules/${id}`);
      return response.data.data;
    } catch (err) {
      const saved = isNetworkError(err) ? await readOfflineSchedule(id) : undefined;
      if (!saved) throw err;
      return { ...saved, offline: true };
    }
  },

  async formOptions(panel = 'admin'): Promise<ScheduleFormOptions> {
    const response = await axiosInstance.get(`/${panel}/schedules/form-options`);
    return response.data.data;
  },

  async createSchedule(input: ScheduleInput, panel = 'admin'): Promise<Schedule> {
    const response = await axiosInstance.post(`/${panel}/schedules`, input);
    syncOfflineData(); // the saved weeks follow every change
    return response.data.data || response.data;
  },

  async updateSchedule(id: number | string, input: Partial<ScheduleInput>, panel = 'admin'): Promise<Schedule> {
    const response = await axiosInstance.patch(`/${panel}/schedules/${id}`, input);
    syncOfflineData();
    return response.data.data || response.data;
  },

  /** Its creator cancels it (pending or approved) before it starts; schedules are never deleted here. */
  async cancelSchedule(id: number | string, panel = 'admin'): Promise<Schedule> {
    return this.updateSchedule(id, { status: 'cancelled' }, panel);
  },

  /** The approver's work list: schedules and participations waiting for a decision, soonest first. */
  async fetchPending(panel = 'admin'): Promise<PendingWork> {
    const response = await axiosInstance.get(`/${panel}/schedules/pending`);
    return { schedules: response.data.data ?? [], participations: response.data.participations ?? [] };
  },

  /** Join someone else's schedule; the participation waits for approval. */
  async join(id: number | string, panel = 'admin'): Promise<Schedule> {
    const response = await axiosInstance.post(`/${panel}/schedules/${id}/participation`);
    syncOfflineData();
    return response.data.data;
  },

  async leave(id: number | string, panel = 'admin'): Promise<Schedule> {
    const response = await axiosInstance.delete(`/${panel}/schedules/${id}/participation`);
    syncOfflineData();
    return response.data.data;
  },

  /** Decide on one participant (someone who joined); the message is sent to them. */
  async decideParticipant(id: number | string, userId: number, approve: boolean, message?: string, panel = 'admin') {
    await axiosInstance.post(
      `/${panel}/schedules/${id}/participants/${userId}/${approve ? 'approve' : 'reject'}`,
      message ? { message } : {}
    );
    syncOfflineData();
  },

  /** The optional message is appended to the schedule's internal note (visible to staff only). */
  async approve(id: number | string, message?: string, panel = 'admin') {
    await axiosInstance.post(`/${panel}/schedules/${id}/approve`, message ? { message } : {});
    syncOfflineData();
  },

  async reject(id: number | string, message?: string, panel = 'admin') {
    await axiosInstance.post(`/${panel}/schedules/${id}/reject`, message ? { message } : {});
    syncOfflineData();
  },

  /** Admins, once it started: its owner did not come. The optional message goes to the internal note. */
  async markNotShown(id: number | string, message?: string, panel = 'admin'): Promise<Schedule> {
    const response = await axiosInstance.post(`/${panel}/schedules/${id}/not-shown`, message ? { message } : {});
    syncOfflineData();
    return response.data.data;
  },

  /** The schedule's owner, once it started: one of its participants did not come. */
  async markParticipantNotShown(id: number | string, userId: number, panel = 'admin'): Promise<Schedule> {
    const response = await axiosInstance.post(`/${panel}/schedules/${id}/participants/${userId}/not-shown`);
    syncOfflineData();
    return response.data.data;
  },
};
