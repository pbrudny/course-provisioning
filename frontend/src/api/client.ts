export type CourseType = 'LECTURE' | 'LABORATORY';
export type CourseStatus = 'PENDING' | 'PROVISIONING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'RETRYING';
export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface ProvisioningStep {
  stepName: string;
  stepOrder: number;
  status: StepStatus;
  attempts: number;
  errorMsg?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface ProvisioningStatus {
  courseId: string;
  courseStatus: CourseStatus;
  steps: ProvisioningStep[];
}

export interface LabGroupResponse {
  id: string;
  name: string;
  number: number;
  githubRepoUrl?: string;
  room?: string;
  day?: string;
  time?: string;
}

export interface Course {
  id: string;
  name: string;
  semester: string;
  type: CourseType;
  status: CourseStatus;
  labGroups?: LabGroupResponse[];
  githubRepoUrl?: string;
  discordGuildId?: string;
  lectureCount?: number;
  labCount?: number;
  lectureRoom?: string;
  lectureDay?: string;
  lectureTime?: string;
  seedTemplateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeedTemplate {
  id: string;
  label: string;
  description?: string;
  readme: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabGroupInput {
  name: string;
  number: number;
  githubRepoName?: string;
  discordChannelName?: string;
  discordRoleName?: string;
  room?: string;
  day?: string;
  time?: string;
}

export interface CreateCoursePayload {
  name: string;
  semester: string;
  type: CourseType;
  discordGuildId: string;
  githubRepoName?: string;
  discordChannels?: string[];
  labGroups?: LabGroupInput[];
  lectureCount?: number;
  labCount?: number;
  lectureRoom?: string;
  lectureDay?: string;
  lectureTime?: string;
}

const API_KEY = import.meta.env.VITE_API_KEY as string;
const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      typeof body?.message === 'string'
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join(', ')
          : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  listCourses: () => request<Course[]>('/courses'),

  getCourse: (id: string) => request<Course>(`/courses/${id}`),

  getCourseStatus: (id: string) => request<ProvisioningStatus>(`/courses/${id}/status`),

  createCourse: (payload: CreateCoursePayload) =>
    request<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCourse: (id: string, body: { seedTemplateId?: string }) =>
    request<Course>(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  startProvisioning: (id: string) =>
    request<{ message: string }>(`/courses/${id}/provision`, { method: 'POST' }),

  retryCourse: (id: string) =>
    request<{ message: string }>(`/courses/${id}/retry`, { method: 'POST' }),

  deleteCourse: (id: string) =>
    request<void>(`/courses/${id}`, { method: 'DELETE' }),

  listTemplates: () => request<SeedTemplate[]>('/seed-templates'),

  getTemplate: (id: string) => request<SeedTemplate>(`/seed-templates/${id}`),

  createTemplate: (body: { label: string; description?: string; readme: string }) =>
    request<SeedTemplate>('/seed-templates', { method: 'POST', body: JSON.stringify(body) }),

  updateTemplate: (id: string, body: { label?: string; description?: string; readme?: string }) =>
    request<SeedTemplate>(`/seed-templates/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteTemplate: (id: string) =>
    request<void>(`/seed-templates/${id}`, { method: 'DELETE' }),
};
