const fs = require('fs');
const path = require('path');

function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) { fs.writeFileSync(p, s, 'utf8'); }
function replace(p, from, to) {
  const s = read(p);
  if (!s.includes(from)) throw new Error(`${p}: pattern not found: ${from.slice(0, 120)}`);
  write(p, s.replace(from, to));
}

// 1) 前端类型：五级难度、题目课程归属、课程筛选、AI 出题课程 ID。
replace(
  'apps/mindmark-web/src/types/question.ts',
  "export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';",
  "export type Difficulty = 'VERY_EASY' | 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';",
);
replace(
  'apps/mindmark-web/src/types/question.ts',
  `  difficulty: Difficulty;\n  knowledgePoints: string[];`,
  `  difficulty: Difficulty;\n  courseId?: string | null;\n  courseName?: string | null;\n  knowledgePoints: string[];`,
);
replace(
  'apps/mindmark-web/src/types/question.ts',
  `  source?: QuestionSource | 'ALL';\n}`,
  `  source?: QuestionSource | 'ALL';\n  courseId?: string | 'ALL';\n}`,
);
replace(
  'apps/mindmark-web/src/types/question.ts',
  `  difficulty: Difficulty;\n  knowledgePoints: string[];\n  score: number;`,
  `  difficulty: Difficulty;\n  courseId?: string | null;\n  courseName?: string | null;\n  knowledgePoints: string[];\n  score: number;`,
);
replace(
  'apps/mindmark-web/src/types/question.ts',
  `export interface AiQuestionGenerateRequest {\n  subject: string;`,
  `export interface AiQuestionGenerateRequest {\n  courseId: string;\n  subject: string;`,
);

replace(
  'apps/mindmark-web/src/constants/question.ts',
  `export const DIFFICULTY_META: Record<Difficulty, StatusMeta> = {\n  EASY: { label: '简单', tone: 'success' },\n  MEDIUM: { label: '中等', tone: 'warning' },\n  HARD: { label: '困难', tone: 'danger' },\n};`,
  `export const DIFFICULTY_META: Record<Difficulty, StatusMeta> = {\n  VERY_EASY: { label: '很简单', tone: 'success' },\n  EASY: { label: '简单', tone: 'success' },\n  MEDIUM: { label: '中等', tone: 'warning' },\n  HARD: { label: '困难', tone: 'danger' },\n  VERY_HARD: { label: '很困难', tone: 'danger' },\n};`,
);

// 2) 前端课程接口。
replace(
  'apps/mindmark-web/src/services/academicService.ts',
  `export async function listVisibleClasses(): Promise<TeachingClass[]> {\n  if (!useMockApi) {\n    return apiGet<TeachingClass[]>('/v1/classes');\n  }\n  return Promise.resolve(active(mockClasses).map(cloneClass));\n}\n\nexport async function listAdminCourses(): Promise<Course[]> {`,
  `export async function listVisibleClasses(): Promise<TeachingClass[]> {\n  if (!useMockApi) {\n    return apiGet<TeachingClass[]>('/v1/classes');\n  }\n  return Promise.resolve(active(mockClasses).map(cloneClass));\n}\n\nexport async function listVisibleCourses(): Promise<Course[]> {\n  if (!useMockApi) {\n    return apiGet<Course[]>('/v1/courses');\n  }\n  return Promise.resolve(active(mockCourses).map(cloneCourse));\n}\n\nexport async function listAdminCourses(): Promise<Course[]> {`,
);

// 3) 题库服务按课程筛选。
replace(
  'apps/mindmark-web/src/services/questionService.ts',
  `  if (query.source && query.source !== 'ALL') {\n    params.source = query.source;\n  }\n\n  return params;`,
  `  if (query.source && query.source !== 'ALL') {\n    params.source = query.source;\n  }\n  if (query.courseId && query.courseId !== 'ALL') {\n    params.courseId = query.courseId;\n  }\n\n  return params;`,
);
replace(
  'apps/mindmark-web/src/services/questionService.ts',
  `    const sourceMatched =\n      !query.source || query.source === 'ALL' || question.source === query.source;\n\n    return (\n      typeMatched &&\n      difficultyMatched &&\n      statusMatched &&\n      sourceMatched &&\n      matchesKeyword(question, keyword)\n    );`,
  `    const sourceMatched =\n      !query.source || query.source === 'ALL' || question.source === query.source;\n    const courseMatched =\n      !query.courseId || query.courseId === 'ALL' || question.courseId === query.courseId;\n\n    return (\n      typeMatched &&\n      difficultyMatched &&\n      statusMatched &&\n      sourceMatched &&\n      courseMatched &&\n      matchesKeyword(question, keyword)\n    );`,
);

// 4) Mock 题目补充课程字段和五级难度示例。
let mock = read('apps/mindmark-web/src/mock/questionMock.ts');
const questionCourseMap = {
  'Q-1001': { difficulty: 'VERY_EASY', courseId: 'course-frontend-001', courseName: '前端工程化' },
  'Q-1002': { difficulty: 'MEDIUM', courseId: 'course-frontend-001', courseName: '前端工程化' },
  'Q-1003': { difficulty: 'EASY', courseId: 'course-fullstack-001', courseName: '全栈开发实践' },
  'Q-1004': { difficulty: 'MEDIUM', courseId: 'course-demo-001', courseName: '软件工程基础' },
  'Q-1005': { difficulty: 'HARD', courseId: 'course-fullstack-001', courseName: '全栈开发实践' },
  'Q-1006': { difficulty: 'VERY_HARD', courseId: 'course-frontend-001', courseName: '前端工程化' },
};
for (const [id, meta] of Object.entries(questionCourseMap)) {
  const re = new RegExp(`(id: '${id}',[\\s\\S]*?difficulty: ')[A-Z_]+(',\\n)`);
  mock = mock.replace(re, `$1${meta.difficulty}$2    courseId: '${meta.courseId}',\n    courseName: '${meta.courseName}',\n`);
}
const draftCourseMap = {
  'AIQ-2001': { courseId: 'course-frontend-001', courseName: '前端工程化' },
  'AIQ-2002': { courseId: 'course-demo-001', courseName: '软件工程基础' },
  'AIQ-2003': { courseId: 'course-fullstack-001', courseName: '全栈开发实践' },
};
for (const [id, meta] of Object.entries(draftCourseMap)) {
  const re = new RegExp(`(id: '${id}',[\\s\\S]*?difficulty: '[A-Z_]+',\\n)`);
  mock = mock.replace(re, `$1    courseId: '${meta.courseId}',\n    courseName: '${meta.courseName}',\n`);
}
write('apps/mindmark-web/src/mock/questionMock.ts', mock);

replace(
  'apps/mindmark-web/src/services/aiQuestionService.ts',
  `    difficulty: request.difficulty,\n    knowledgePoints: [request.knowledgePoint],`,
  `    difficulty: request.difficulty,\n    courseId: request.courseId,\n    courseName: request.subject,\n    knowledgePoints: [request.knowledgePoint],`,
);

// 5) 题库页面接入课程筛选。
let qv = read('apps/mindmark-web/src/views/teacher/QuestionBankView.vue');
qv = qv.replace(`import { reactive, ref, watch } from 'vue';`, `import { onMounted, reactive, ref, watch } from 'vue';`);
qv = qv.replace(`import { listQuestions } from '@/services/questionService';`, `import { listVisibleCourses } from '@/services/academicService';\nimport { listQuestions } from '@/services/questionService';`);
qv = qv.replace(`} from '@/types/question';`, `} from '@/types/question';\nimport type { Course } from '@/types/academic';`);
qv = qv.replace(
  `Pick<QuestionQuery, 'keyword' | 'type' | 'difficulty' | 'status' | 'source'>`,
  `Pick<QuestionQuery, 'keyword' | 'type' | 'difficulty' | 'status' | 'source' | 'courseId'>`,
);
qv = qv.replace(`  keyword: '',\n  type: 'ALL',`, `  keyword: '',\n  courseId: 'ALL',\n  type: 'ALL',`);
qv = qv.replace(`const questions = ref<Question[]>([]);`, `const courses = ref<Course[]>([]);\nconst questions = ref<Question[]>([]);`);
qv = qv.replace(
  `const resetFilters = () => {\n  query.keyword = '';\n  query.type = 'ALL';`,
  `const loadCourses = async () => {\n  try {\n    courses.value = await listVisibleCourses();\n  } catch {\n    courses.value = [];\n  }\n};\n\nconst resetFilters = () => {\n  query.keyword = '';\n  query.courseId = 'ALL';\n  query.type = 'ALL';`,
);
qv = qv.replace(
  `watch(\n  query,`,
  `onMounted(() => {\n  void loadCourses();\n});\n\nwatch(\n  query,`,
);
qv = qv.replace(
  `        <label class="form-field">\n          <span>题型</span>`,
  `        <label class="form-field">\n          <span>课程</span>\n          <select v-model="query.courseId" class="select-input">\n            <option value="ALL">全部课程</option>\n            <option v-for="course in courses" :key="course.id" :value="course.id">\n              {{ course.name }}\n            </option>\n          </select>\n        </label>\n        <label class="form-field">\n          <span>题型</span>`,
);
qv = qv.replace(
  `<small>{{ question.knowledgePoints.join(' / ') }}</small>`,
  `<small>{{ question.courseName ? question.courseName + ' · ' : '' }}{{ question.knowledgePoints.join(' / ') }}</small>`,
);
write('apps/mindmark-web/src/views/teacher/QuestionBankView.vue', qv);

// 6) AI 出题页面课程下拉。
let av = read('apps/mindmark-web/src/views/teacher/AiQuestionsView.vue');
av = av.replace(`import { onMounted, reactive, ref } from 'vue';`, `import { computed, onMounted, reactive, ref, watch } from 'vue';`);
av = av.replace(`} from '@/services/aiQuestionService';`, `} from '@/services/aiQuestionService';\nimport { listVisibleCourses } from '@/services/academicService';`);
av = av.replace(`} from '@/types/question';`, `} from '@/types/question';\nimport type { Course } from '@/types/academic';`);
av = av.replace(
  `const form = reactive<AiQuestionGenerateRequest>({\n  subject: '前端工程化',`,
  `const form = reactive<AiQuestionGenerateRequest>({\n  courseId: '',\n  subject: '',`,
);
av = av.replace(`const drafts = ref<AiQuestionDraft[]>([]);`, `const courses = ref<Course[]>([]);\nconst selectedCourse = computed(\n  () => courses.value.find((course) => course.id === form.courseId) ?? null,\n);\nconst drafts = ref<AiQuestionDraft[]>([]);`);
av = av.replace(
  `const loadDrafts = async () => {\n  isLoading.value = true;\n  drafts.value = await listAiQuestionDrafts();\n  isLoading.value = false;\n};\n\nconst generate = async () => {\n  isGenerating.value = true;\n  drafts.value = await generateAiQuestions({ ...form, count: Number(form.count) });\n  isGenerating.value = false;\n};`,
  `const syncSubjectFromCourse = () => {\n  form.subject = selectedCourse.value?.name ?? '';\n};\n\nconst loadCourses = async () => {\n  courses.value = await listVisibleCourses();\n  form.courseId =\n    courses.value.find((course) => course.id === 'course-frontend-001')?.id ??\n    courses.value[0]?.id ??\n    '';\n  syncSubjectFromCourse();\n};\n\nconst loadDrafts = async () => {\n  isLoading.value = true;\n  drafts.value = await listAiQuestionDrafts();\n  isLoading.value = false;\n};\n\nconst generate = async () => {\n  if (!form.courseId) {\n    return;\n  }\n\n  syncSubjectFromCourse();\n  isGenerating.value = true;\n  drafts.value = await generateAiQuestions({ ...form, count: Number(form.count) });\n  isGenerating.value = false;\n};`,
);
av = av.replace(
  `onMounted(() => {\n  void loadDrafts();\n});`,
  `watch(\n  () => form.courseId,\n  () => {\n    syncSubjectFromCourse();\n  },\n);\n\nonMounted(() => {\n  void loadCourses();\n  void loadDrafts();\n});`,
);
av = av.replace(
  `<button class="primary-button" type="button" :disabled="isGenerating" @click="generate">`,
  `<button class="primary-button" type="button" :disabled="isGenerating || !form.courseId" @click="generate">`,
);
av = av.replace(
  `        <label class="form-field">\n          <span>学科/课程</span>\n          <input v-model.trim="form.subject" class="text-input" type="text" />\n        </label>`,
  `        <label class="form-field">\n          <span>课程</span>\n          <select v-model="form.courseId" class="select-input">\n            <option value="" disabled>请选择课程</option>\n            <option v-for="course in courses" :key="course.id" :value="course.id">\n              {{ course.name }}\n            </option>\n          </select>\n        </label>`,
);
write('apps/mindmark-web/src/views/teacher/AiQuestionsView.vue', av);

// 7) 后端五级难度与课程字段/筛选。
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/domain/Difficulty.java', `package com.mindmark.server.modules.question.domain;\n\npublic enum Difficulty {\n    VERY_EASY,\n    EASY,\n    MEDIUM,\n    HARD,\n    VERY_HARD\n}\n`);
let entity = read('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/domain/QuestionEntity.java');
entity = entity.replace(
  `    @ElementCollection(fetch = FetchType.LAZY)`,
  `    @Column(name = "course_id", length = 64)\n    private String courseId;\n\n    @Column(name = "course_name", length = 128)\n    private String courseName;\n\n    @ElementCollection(fetch = FetchType.LAZY)`,
);
entity = entity.replace(
  `    public List<String> getKnowledgePoints() {`,
  `    public String getCourseId() {\n        return courseId;\n    }\n\n    public void setCourseId(String courseId) {\n        this.courseId = courseId;\n    }\n\n    public String getCourseName() {\n        return courseName;\n    }\n\n    public void setCourseName(String courseName) {\n        this.courseName = courseName;\n    }\n\n    public List<String> getKnowledgePoints() {`,
);
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/domain/QuestionEntity.java', entity);
replace(
  'apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/dto/QuestionResponse.java',
  `    Difficulty difficulty,\n    List<String> knowledgePoints,`,
  `    Difficulty difficulty,\n    String courseId,\n    String courseName,\n    List<String> knowledgePoints,`,
);
replace(
  'apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionResponseMapper.java',
  `            entity.getDifficulty(),\n            List.copyOf(entity.getKnowledgePoints()),`,
  `            entity.getDifficulty(),\n            entity.getCourseId(),\n            entity.getCourseName(),\n            List.copyOf(entity.getKnowledgePoints()),`,
);
replace(
  'apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/dto/QuestionQuery.java',
  `    QuestionSource source,\n    String knowledgePoint,`,
  `    QuestionSource source,\n    String courseId,\n    String knowledgePoint,`,
);
let qs = read('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionService.java');
qs = qs.replace(
  `            if (query.source() != null) {\n                predicates.add(criteriaBuilder.equal(root.get("source"), query.source()));\n            }`,
  `            if (query.source() != null) {\n                predicates.add(criteriaBuilder.equal(root.get("source"), query.source()));\n            }\n            if (hasText(query.courseId())) {\n                predicates.add(criteriaBuilder.equal(root.get("courseId"), query.courseId().trim()));\n            }`,
);
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/service/QuestionService.java', qs);
let qc = read('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/web/QuestionController.java');
qc = qc.replace(
  `        @RequestParam(required = false) String source,\n        @RequestParam(required = false) String knowledgePoint,`,
  `        @RequestParam(required = false) String source,\n        @RequestParam(required = false) String courseId,\n        @RequestParam(required = false) String knowledgePoint,`,
);
qc = qc.replace(
  `            parseEnum(source, QuestionSource.class),\n            knowledgePoint,`,
  `            parseEnum(source, QuestionSource.class),\n            normalizeId(courseId),\n            knowledgePoint,`,
);
qc = qc.replace(
  `    private <T extends Enum<T>> T parseEnum`,
  `    private String normalizeId(String value) {\n        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) {\n            return null;\n        }\n        return value.trim();\n    }\n\n    private <T extends Enum<T>> T parseEnum`,
);
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/question/web/QuestionController.java', qc);

// 8) 后端课程可见接口。
let as = read('apps/mindmark-server/src/main/java/com/mindmark/server/modules/academic/service/AcademicService.java');
as = as.replace(`import com.mindmark.server.modules.auth.service.ClassScopeService;`, `import com.mindmark.server.modules.auth.domain.RoleCode;\nimport com.mindmark.server.modules.auth.service.ClassScopeService;`);
as = as.replace(`import java.util.List;`, `import java.util.LinkedHashMap;\nimport java.util.List;\nimport java.util.Objects;`);
as = as.replace(
  `    @Transactional(readOnly = true)\n    public List<CourseResponse> listAdminCourses() {`,
  `    @Transactional(readOnly = true)\n    public List<CourseResponse> listVisibleCourses() {\n        if (classScopeService.currentUser().getRoles().contains(RoleCode.ADMIN)) {\n            return courseRepository.findByStatusOrderByUpdatedAtDesc(AcademicStatus.ACTIVE).stream()\n                .map(this::toCourseResponse)\n                .toList();\n        }\n        LinkedHashMap<String, CourseEntity> courses = new LinkedHashMap<>();\n        classScopeService.visibleClasses().stream()\n            .map(TeachingClassEntity::getCourse)\n            .filter(Objects::nonNull)\n            .filter(course -> course.getStatus() == AcademicStatus.ACTIVE)\n            .forEach(course -> courses.putIfAbsent(course.getId(), course));\n        return courses.values().stream().map(this::toCourseResponse).toList();\n    }\n\n    @Transactional(readOnly = true)\n    public List<CourseResponse> listAdminCourses() {`,
);
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/academic/service/AcademicService.java', as);
replace(
  'apps/mindmark-server/src/main/java/com/mindmark/server/modules/academic/web/AcademicController.java',
  `    @GetMapping("/api/v1/classes")\n    public ApiResponse<List<TeachingClassResponse>> listVisibleClasses() {\n        return ApiResponse.success(academicService.listVisibleClasses());\n    }\n\n    @GetMapping("/api/v1/admin/courses")`,
  `    @GetMapping("/api/v1/classes")\n    public ApiResponse<List<TeachingClassResponse>> listVisibleClasses() {\n        return ApiResponse.success(academicService.listVisibleClasses());\n    }\n\n    @GetMapping("/api/v1/courses")\n    public ApiResponse<List<CourseResponse>> listVisibleCourses() {\n        return ApiResponse.success(academicService.listVisibleCourses());\n    }\n\n    @GetMapping("/api/v1/admin/courses")`,
);

// 9) Flyway 迁移。
write('apps/mindmark-server/src/main/resources/db/migration/V14__question_course_and_five_level_difficulty.sql', `ALTER TABLE question\n    ADD COLUMN IF NOT EXISTS course_id VARCHAR(64),\n    ADD COLUMN IF NOT EXISTS course_name VARCHAR(128);\n\nUPDATE question\nSET course_id = 'course-frontend-001',\n    course_name = '前端工程实践'\nWHERE course_id IS NULL\n  AND (title ILIKE '%JavaScript%' OR title ILIKE '%Vue%' OR title ILIKE '%debounce%' OR title ILIKE '%CSS%');\n\nUPDATE question\nSET course_id = 'course-fullstack-001',\n    course_name = '全栈开发实践'\nWHERE course_id IS NULL\n  AND (title ILIKE '%HTTP%' OR title ILIKE '%RESTful%');\n\nUPDATE question\nSET course_id = 'course-demo-001',\n    course_name = '软件工程'\nWHERE course_id IS NULL;\n\nDO $$\nBEGIN\n    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_question_difficulty') THEN\n        ALTER TABLE question DROP CONSTRAINT ck_question_difficulty;\n    END IF;\nEND $$;\n\nALTER TABLE question\n    ADD CONSTRAINT ck_question_difficulty\n    CHECK (difficulty IN ('VERY_EASY', 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD'));\n\nCREATE INDEX IF NOT EXISTS idx_question_course ON question(course_id, updated_at DESC);\n\nDO $$\nBEGIN\n    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_question_course') THEN\n        ALTER TABLE question\n            ADD CONSTRAINT fk_question_course\n            FOREIGN KEY (course_id) REFERENCES course(id) NOT VALID;\n    END IF;\nEND $$;\n`);

