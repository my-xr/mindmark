import { apiGet, apiPatch, apiPost, useMockApi } from '@/services/api/httpClient';
import type {
  AcademicStatus,
  Course,
  CourseRequest,
  CourseChapter,
  CourseChapterRequest,
  TeachingClass,
  TeachingClassRequest,
} from '@/types/academic';

const now = () => new Date().toISOString();

let mockCourses: Course[] = [
  {
    id: 'course-demo-001',
    code: 'SE-DEMO',
    name: '软件工程基础',
    description: '考试闭环演示课程',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'course-frontend-001',
    code: 'FE-2026',
    name: '前端工程化',
    description: '前端工程化与质量保障',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'course-fullstack-001',
    code: 'FS-2026',
    name: '全栈开发实践',
    description: '全栈工程与接口联调',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
  },
];

let mockCourseChapters: CourseChapter[] = mockCourses.flatMap((course) =>
  Array.from({ length: 12 }, (_, index) => ({
    id: `chapter-${course.id}-${index + 1}`,
    courseId: course.id,
    courseName: course.name,
    chapterNo: index + 1,
    title: `? ${index + 1} ?`,
    description: null,
    status: 'ACTIVE' as AcademicStatus,
    createdAt: now(),
    updatedAt: now(),
  })),
);

let mockClasses: TeachingClass[] = [
  {
    id: 'class-demo-001',
    courseId: 'course-demo-001',
    courseName: '软件工程基础',
    code: 'SE-2026-01',
    name: '软件工程 1 班',
    grade: '2026',
    major: '软件工程',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'class-frontend-1',
    courseId: 'course-frontend-001',
    courseName: '前端工程化',
    code: 'FE-2026-01',
    name: '前端工程化 1 班',
    grade: '2026',
    major: '计算机科学与技术',
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
  },
];

const cloneCourse = (course: Course): Course => ({ ...course });
const cloneClass = (teachingClass: TeachingClass): TeachingClass => ({ ...teachingClass });
const cloneChapter = (chapter: CourseChapter): CourseChapter => ({ ...chapter });
const active = <T extends { status: AcademicStatus }>(items: T[]) =>
  items.filter((item) => item.status === 'ACTIVE');

const resolveCourseName = (courseId?: string | null) =>
  courseId ? (mockCourses.find((course) => course.id === courseId)?.name ?? null) : null;

export async function listCourseChapters(courseId: string): Promise<CourseChapter[]> {
  if (!useMockApi) {
    return apiGet<CourseChapter[]>(`/v1/courses/${courseId}/chapters`);
  }
  return Promise.resolve(
    active(mockCourseChapters)
      .filter((chapter) => chapter.courseId === courseId)
      .sort((left, right) => left.chapterNo - right.chapterNo)
      .map(cloneChapter),
  );
}

export async function createCourseChapter(
  courseId: string,
  request: CourseChapterRequest,
): Promise<CourseChapter> {
  if (!useMockApi) {
    return apiPost<CourseChapter, CourseChapterRequest>(
      `/v1/admin/courses/${courseId}/chapters`,
      request,
    );
  }
  const course = mockCourses.find((item) => item.id === courseId);
  if (!course) {
    throw new Error('Course not found');
  }
  const created: CourseChapter = {
    id: `chapter-mock-${Date.now()}`,
    courseId,
    courseName: course.name,
    chapterNo: request.chapterNo,
    title: request.title.trim(),
    description: request.description ?? null,
    status: request.status ?? 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
  };
  mockCourseChapters = [created, ...mockCourseChapters];
  return Promise.resolve(cloneChapter(created));
}

export async function listVisibleClasses(): Promise<TeachingClass[]> {
  if (!useMockApi) {
    return apiGet<TeachingClass[]>('/v1/classes');
  }
  return Promise.resolve(active(mockClasses).map(cloneClass));
}

export async function listVisibleCourses(): Promise<Course[]> {
  if (!useMockApi) {
    return apiGet<Course[]>('/v1/courses');
  }
  return Promise.resolve(active(mockCourses).map(cloneCourse));
}

export async function listAdminCourses(): Promise<Course[]> {
  if (!useMockApi) {
    return apiGet<Course[]>('/v1/admin/courses');
  }
  return Promise.resolve(mockCourses.map(cloneCourse));
}

export async function createCourse(request: CourseRequest): Promise<Course> {
  if (!useMockApi) {
    return apiPost<Course, CourseRequest>('/v1/admin/courses', request);
  }
  const created: Course = {
    id: `course-mock-${Date.now()}`,
    code: request.code.trim().toUpperCase(),
    name: request.name.trim(),
    description: request.description ?? null,
    status: request.status ?? 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
  };
  mockCourses = [created, ...mockCourses];
  return Promise.resolve(cloneCourse(created));
}

export async function updateCourse(courseId: string, request: CourseRequest): Promise<Course> {
  if (!useMockApi) {
    return apiPatch<Course, CourseRequest>(`/v1/admin/courses/${courseId}`, request);
  }
  mockCourses = mockCourses.map((course) =>
    course.id === courseId
      ? {
          ...course,
          code: request.code.trim().toUpperCase(),
          name: request.name.trim(),
          description: request.description ?? null,
          status: request.status ?? course.status,
          updatedAt: now(),
        }
      : course,
  );
  const updated = mockCourses.find((course) => course.id === courseId);
  if (!updated) {
    throw new Error('Course not found');
  }
  mockClasses = mockClasses.map((teachingClass) =>
    teachingClass.courseId === courseId
      ? { ...teachingClass, courseName: updated.name, updatedAt: now() }
      : teachingClass,
  );
  return Promise.resolve(cloneCourse(updated));
}

export async function listAdminClasses(): Promise<TeachingClass[]> {
  if (!useMockApi) {
    return apiGet<TeachingClass[]>('/v1/admin/classes');
  }
  return Promise.resolve(mockClasses.map(cloneClass));
}

export async function createTeachingClass(request: TeachingClassRequest): Promise<TeachingClass> {
  if (!useMockApi) {
    return apiPost<TeachingClass, TeachingClassRequest>('/v1/admin/classes', request);
  }
  const created: TeachingClass = {
    id: `class-mock-${Date.now()}`,
    courseId: request.courseId ?? null,
    courseName: resolveCourseName(request.courseId),
    code: request.code.trim().toUpperCase(),
    name: request.name.trim(),
    grade: request.grade ?? null,
    major: request.major ?? null,
    status: request.status ?? 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
  };
  mockClasses = [created, ...mockClasses];
  return Promise.resolve(cloneClass(created));
}

export async function updateTeachingClass(
  classId: string,
  request: TeachingClassRequest,
): Promise<TeachingClass> {
  if (!useMockApi) {
    return apiPatch<TeachingClass, TeachingClassRequest>(`/v1/admin/classes/${classId}`, request);
  }
  mockClasses = mockClasses.map((teachingClass) =>
    teachingClass.id === classId
      ? {
          ...teachingClass,
          courseId: request.courseId ?? null,
          courseName: resolveCourseName(request.courseId),
          code: request.code.trim().toUpperCase(),
          name: request.name.trim(),
          grade: request.grade ?? null,
          major: request.major ?? null,
          status: request.status ?? teachingClass.status,
          updatedAt: now(),
        }
      : teachingClass,
  );
  const updated = mockClasses.find((teachingClass) => teachingClass.id === classId);
  if (!updated) {
    throw new Error('Class not found');
  }
  return Promise.resolve(cloneClass(updated));
}
