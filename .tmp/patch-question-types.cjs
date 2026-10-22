const fs=require('fs');
const p='apps/mindmark-web/src/types/question.ts';
let s=fs.readFileSync(p,'utf8').replace(/^\uFEFF/, '');
s=s.replace(`export interface QuestionQuery {
  keyword?: string;
  type?: QuestionType | 'ALL';
  difficulty?: Difficulty | 'ALL';
  status?: QuestionStatus | 'ALL';
  source?: QuestionSource | 'ALL';
  courseId?: string | 'ALL';
}`, `export interface QuestionQuery {
  keyword?: string;
  type?: QuestionType | 'ALL';
  difficulty?: Difficulty | 'ALL';
  status?: QuestionStatus | 'ALL';
  source?: QuestionSource | 'ALL';
  courseId?: string | 'ALL';
  page?: number;
  pageSize?: number;
}`);
fs.writeFileSync(p,s,'utf8');
