const fs=require('fs');
const f='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingTaskService.java';
let s=fs.readFileSync(f,'utf8');
s=s.replace(/                SubjectiveGradingPolicy\.SubjectiveGradingResult result = subjectiveGradingPolicy\.grade\([\s\S]*?                \);\r?\n                item\.setAutoScore\(result\.score\(\)\);/, `                SubjectiveGradingPolicy.SubjectiveGradingResult result = allowProvider
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
                    );
                item.setAutoScore(result.score());`);
fs.writeFileSync(f,s,'utf8');