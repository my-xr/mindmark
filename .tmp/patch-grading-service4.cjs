const fs=require('fs');
const f='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingTaskService.java';
let s=fs.readFileSync(f,'utf8');
const old=`                SubjectiveGradingPolicy.SubjectiveGradingResult result = subjectiveGradingPolicy.grade(
                    item.getQuestion(),
                    answer == null ? null : answer.getAnswerJson(),
                    item.getMaxScore(),
                    task.getExam().getCreatedBy()
                );`;
const neu=`                SubjectiveGradingPolicy.SubjectiveGradingResult result = allowProvider
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
                    );`;
if(!s.includes(old)) throw new Error('subjective block not found');
s=s.replace(old,neu);
fs.writeFileSync(f,s,'utf8');