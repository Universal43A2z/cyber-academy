export type Role = "mentor" | "mentee";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  year_level: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Module {
  id: string;
  week_no: number;
  title: string;
  description: string | null;
  content: string;
  video_url: string | null;
  created_by: string | null;
  published: boolean;
  created_at: string;
}

export interface ModuleProgress {
  user_id: string;
  module_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface Attendance {
  id: string;
  user_id: string;
  week_no: number;
  status: "present" | "late" | "absent";
  note: string | null;
  date: string;
}

export interface Quiz {
  id: string;
  week_no: number;
  title: string;
  description: string | null;
  time_limit_sec: number;
  published: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  position: number;
}

export type QuizQuestionSafe = Omit<QuizQuestion, "correct_index">;

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total: number;
  answers: {
    question_index: number;
    selected: number;
  }[];
  started_at: string;
  finished_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  email: string | null;
  action: string;
  details: Record<string, unknown>;
  ip: string | null;
  created_at: string;
}

export type FeedbackCategory = "general" | "bug" | "content" | "suggestion";
export type FeedbackStatus = "new" | "in_review" | "resolved";

export interface FeedbackReport {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  message: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  created_at: string;
}

export interface MenteePerformance {
  profile: Profile;
  attendance: { total: number; present: number; late: number; absent: number };
  quiz: { attempts: number; best: number | null; avg: number | null };
  modules_done: number;
  last_active: string | null;
}