export type AcademicStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: AcademicStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CourseRequest {
  code: string;
  name: string;
  description?: string | null;
  status?: AcademicStatus;
}

export interface TeachingClass {
  id: string;
  courseId?: string | null;
  courseName?: string | null;
  code: string;
  name: string;
  grade?: string | null;
  major?: string | null;
  status: AcademicStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TeachingClassRequest {
  courseId?: string | null;
  code: string;
  name: string;
  grade?: string | null;
  major?: string | null;
  status?: AcademicStatus;
}

export interface CourseChapter {
  id: string;
  courseId: string;
  courseName: string;
  chapterNo: number;
  title: string;
  description?: string | null;
  status: AcademicStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CourseChapterRequest {
  chapterNo: number;
  title: string;
  description?: string | null;
  status?: AcademicStatus;
}
