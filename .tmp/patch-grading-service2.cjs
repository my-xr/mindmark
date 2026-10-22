const fs=require('fs');
const f='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingTaskService.java';
let s=fs.readFileSync(f,'utf8');
if(!s.includes('private final GradingAiJobService gradingAiJobService;')){
  s=s.replace('    private final ClassScopeService classScopeService;\n', '    private final ClassScopeService classScopeService;\n    private final GradingAiJobService gradingAiJobService;\n');
  s=s.replace('        GradingTaskMapper mapper,\n        ClassScopeService classScopeService\n    ) {', '        GradingTaskMapper mapper,\n        ClassScopeService classScopeService,\n        GradingAiJobService gradingAiJobService\n    ) {');
  s=s.replace('        this.mapper = mapper;\n        this.classScopeService = classScopeService;\n', '        this.mapper = mapper;\n        this.classScopeService = classScopeService;\n        this.gradingAiJobService = gradingAiJobService;\n');
}
s=s.replace(/applyAutoGrade\(task\);/g, 'applyAutoGrade(task, false);');
s=s.replace('            applyAutoGrade(task, false);\n            task = gradingTaskRepository.save(task);', '            applyAutoGrade(task, false);\n            task = gradingTaskRepository.save(task);\n            gradingAiJobService.enqueueSystemIfNeeded(task.getId());');
s=s.replace('        applyAutoGrade(task, false);\n        return mapper.toResponse(gradingTaskRepository.save(task), true);', '        applyAutoGrade(task, false);\n        GradingTaskEntity savedTask = gradingTaskRepository.save(task);\n        gradingAiJobService.enqueueIfNeeded(savedTask.getId());\n        return mapper.toResponse(savedTask, true);');
s=s.replace('            applyAutoGrade(task, false);\n            processed += 1;', '            applyAutoGrade(task, false);\n            gradingAiJobService.enqueueIfNeeded(task.getId());\n            processed += 1;');
s=s.replace(/SubjectiveGradingPolicy\.SubjectiveGradingResult result = subjectiveGradingPolicy\.grade\(\n                    item\.getQuestion\(\),\n                    answer == null \? null : answer\.getAnswerJson\(\),\n                    item\.getMaxScore\(\),\n                    task\.getExam\(\)\.getCreatedBy\(\)\n                \);/, `SubjectiveGradingPolicy.SubjectiveGradingResult result = allowProvider
                    ? subjectiveGradingPolicy.grade(
                        item.getQuestion(),
                        answer == null ? null : answer.getAnswerJson(),
                        item.getMaxScore(),
                        task.getExam().getCreatedBy()
                    )
                    : subjectiveGradingPolicy.gradeBaseline(
                        item.getQuestion(),
                        answer == null ? null : answer.getAnswerJson(),
                        item.getMaxScore()
                    );`);
fs.writeFileSync(f,s,'utf8');