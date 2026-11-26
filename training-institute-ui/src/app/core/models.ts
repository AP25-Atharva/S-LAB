// TypeScript mirrors of the Spring Boot request/response DTOs.

export type BatchMode = 'CLASSROOM' | 'ONLINE' | 'HYBRID';
export type BatchStatus = 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
export type EnrolmentStatus = 'ENROLLED' | 'WAITLISTED' | 'COMPLETED' | 'WITHDRAWN';
export type StudentStatus = 'ACTIVE' | 'INACTIVE';

export const BATCH_MODES: BatchMode[] = ['CLASSROOM', 'ONLINE', 'HYBRID'];
export const BATCH_STATUSES: BatchStatus[] = ['PLANNED', 'RUNNING', 'COMPLETED', 'CANCELLED'];
export const ENROLMENT_STATUSES: EnrolmentStatus[] = ['ENROLLED', 'WAITLISTED', 'COMPLETED', 'WITHDRAWN'];
export const STUDENT_STATUSES: StudentStatus[] = ['ACTIVE', 'INACTIVE'];

/* ---------- Course ---------- */
export interface Course {
  courseId: number;
  courseCode: string;
  title: string;
  category: string;
  durationHours: number;
  fee: number;
  description: string | null;
  active: boolean;
}
export type CourseRequest = Omit<Course, 'courseId'>;

/* ---------- Trainer ---------- */
export interface Trainer {
  trainerId: number;
  trainerCode: string;
  fullName: string;
  email: string;
  phone: string;
  expertise: string | null;
  active: boolean;
  activeBatchCount: number;
}
export type TrainerRequest = Omit<Trainer, 'trainerId' | 'activeBatchCount'>;

/* ---------- Student ---------- */
export interface Student {
  studentId: number;
  studentCode: string;
  fullName: string;
  email: string;
  phone: string;
  qualification: string | null;
  registrationDate: string; // yyyy-MM-dd
  status: StudentStatus;
}
export type StudentRequest = Omit<Student, 'studentId'>;

/* ---------- Batch ---------- */
export interface SeatCounts {
  enrolled: number;
  waitlisted: number;
  completed: number;
  withdrawn: number;
  capacity: number;
  occupied: number;
  available: number;
  full: boolean;
  occupancyPercent: number;
}

export interface Batch {
  batchId: number;
  batchCode: string;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  trainerId: number;
  trainerCode: string;
  trainerName: string;
  startDate: string;
  endDate: string;
  mode: BatchMode;
  capacity: number;
  status: BatchStatus;
  seats: SeatCounts;
}

export interface BatchRequest {
  batchCode: string;
  courseId: number;
  trainerId: number;
  startDate: string;
  endDate: string;
  mode: BatchMode;
  capacity: number;
  status: BatchStatus;
}

export interface BatchSummary {
  batch: Batch;
  averageAttendance: number | null;
  roster: Enrolment[];
}

/* ---------- Enrolment ---------- */
export interface Enrolment {
  enrolmentId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  studentEmail: string;
  batchId: number;
  batchCode: string;
  courseTitle: string;
  enrolmentDate: string;
  status: EnrolmentStatus;
  attendancePercentage: number | null;
  remarks: string | null;
}

export interface EnrolmentRequest {
  studentId: number;
  batchId: number;
  status: EnrolmentStatus;
  attendancePercentage: number | null;
  remarks: string | null;
}

/* ---------- Dashboard ---------- */
export interface Dashboard {
  totalCourses: number;
  activeCourses: number;
  activeTrainers: number;
  activeStudents: number;
  plannedBatches: number;
  runningBatches: number;
  completedBatches: number;
  cancelledBatches: number;
  enrolledCount: number;
  waitlistedCount: number;
  completedCount: number;
  withdrawnCount: number;
  runningBatchList: Batch[];
  upcomingBatches: Batch[];
  delayedBatches: Batch[];
}

// ---- Login & users ----
export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  userId: number;
  username: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface UserCreateRequest {
  username: string;
  fullName: string;
  password: string;
  role: UserRole;
  active: boolean;
}

export interface UserUpdateRequest {
  fullName: string;
  role: UserRole;
  active: boolean;
}
