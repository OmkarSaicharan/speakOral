export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  rollNumber?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  topic: string;
  createdAt: string;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  questions: Question[];
  createdAt: string;
}

export interface QuizResult {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber?: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string;
  marks?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  likes: string[];
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  likes: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}
