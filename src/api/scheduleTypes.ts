import axiosInstance from '../config/axios';

/** A schedule type as the management screens use it (see ScheduleTypeTransformer). */
export interface ScheduleType {
  id: number;
  name: string;
  color: string | null;
  description: string | null;
  /** active: offered when booking */
  status: boolean;
  /** set in the database only: shown, never edited here */
  primary: boolean;
  /** needs an end time */
  range: boolean;
  /** may be booked for the whole day (no hours) */
  all_day: boolean;
  /** date window, ISO */
  start: string | null;
  end: string | null;
  /** daily hours, "HH:mm" */
  min_time: string | null;
  max_time: string | null;
  /** active schedules of the type (a type with any can't be deleted) */
  schedules_count: number;
  /** shifts: schedules of the type are booked on one of its slots */
  uses_slots: boolean;
  /** only with a single type (get, create, update), not with the list */
  slots?: ScheduleTypeSlot[];
  can: { update: boolean; delete: boolean };
}

/** A slot of a type as it is defined: a day and two times in server time ("HH:mm", "00:00" = midnight). */
export interface ScheduleTypeSlot {
  id: number;
  day: string;
  from: string;
  to: string;
  start: string;
  end: string;
  /** null = no limit */
  capacity: number | null;
  comment: string | null;
  people: number;
  /** a schedule is on it: its times are fixed and it can't be removed */
  taken: boolean;
}

/** A slot as sent: without an id it is new; a slot left out of the list is removed. */
export interface ScheduleTypeSlotInput {
  id?: number;
  day: string;
  from: string;
  to: string;
  capacity: number | null;
  comment: string | null;
}

/** What is sent to create or change a type. Dates are "YYYY-MM-DD HH:mm" in server time. */
export interface ScheduleTypeInput {
  name: string;
  color: string | null;
  description: string | null;
  status: boolean;
  range: boolean;
  all_day: boolean;
  start: string | null;
  end: string | null;
  min_time: string | null;
  max_time: string | null;
  uses_slots: boolean;
  /** the whole list (left out: the slots stay as they are) */
  slots?: ScheduleTypeSlotInput[];
}

const base = (panel: string) => `/${panel}/schedule-types`;

export const scheduleTypesApi = {
  /** Every type, by name (there are few: one page). */
  async list(panel = 'admin'): Promise<ScheduleType[]> {
    const response = await axiosInstance.get(base(panel), { params: { per_page: 500 } });
    return response.data.data;
  },

  async get(id: number | string, panel = 'admin'): Promise<ScheduleType> {
    const response = await axiosInstance.get(`${base(panel)}/${id}`);
    // the detail answers with the transformer itself, wrapped in "data"
    return response.data.data;
  },

  async create(input: ScheduleTypeInput, panel = 'admin'): Promise<ScheduleType> {
    const response = await axiosInstance.post(base(panel), input);
    return response.data.data;
  },

  async update(id: number, input: ScheduleTypeInput, panel = 'admin'): Promise<ScheduleType> {
    const response = await axiosInstance.put(`${base(panel)}/${id}`, input);
    return response.data.data;
  },

  /** Refused (422, code has_schedules) while the type has schedules. */
  async remove(id: number, panel = 'admin'): Promise<void> {
    await axiosInstance.delete(`${base(panel)}/${id}`);
  },
};
