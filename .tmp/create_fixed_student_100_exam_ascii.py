import json, urllib.request, urllib.error
from datetime import datetime, timedelta, timezone
BASE='http://localhost:18084'
TEACHER_USERNAME='teacher@mindmark.local'; TEACHER_PASSWORD='dev-password'
STUDENT_USERNAME='20260722120655'; STUDENT_PASSWORD='Mindmark123'

def api(method,path,body=None,token=None,timeout=60):
    data=None; headers={'Accept':'application/json'}
    if body is not None:
        data=json.dumps(body, ensure_ascii=True).encode('utf-8')
        headers['Content-Type']='application/json; charset=utf-8'
    if token: headers['Authorization']='Bearer '+token
    req=urllib.request.Request(BASE+path,data=data,headers=headers,method=method)
    try:
        with urllib.request.urlopen(req,timeout=timeout) as r:
            return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {method} {path} {e.code}: {e.read().decode('utf-8','replace')}")

def login(u,p): return api('POST','/api/v1/auth/login',{'username':u,'password':p})['data']

def qpayload(course_id,qtype,diff,score,i):
    kp={'SINGLE_CHOICE':'\u5de5\u7a0b\u57fa\u7840','MULTIPLE_CHOICE':'\u7cfb\u7edf\u8bbe\u8ba1','TRUE_FALSE':'\u6982\u5ff5\u8fa8\u6790','FILL_BLANK':'\u5173\u952e\u672f\u8bed','SHORT_ANSWER':'\u5de5\u7a0b\u8868\u8fbe','PROGRAMMING':'\u7f16\u7a0b\u5b9e\u8df5'}[qtype]
    c={'courseId':course_id,'type':qtype,'difficulty':diff,'knowledgePoints':[kp],'score':score}
    if qtype=='SINGLE_CHOICE':
        c.update({'title':f"100\u5206\u7efc\u5408\u5355\u9009\u9898 {i}\uff1a\u8bf7\u9009\u62e9\u6700\u7b26\u5408\u7ec4\u4ef6\u5316\u8bbe\u8ba1\u539f\u5219\u7684\u4e00\u9879\u3002",'answer':'A','analysis':'\u7ec4\u4ef6\u5316\u8bbe\u8ba1\u5f3a\u8c03\u804c\u8d23\u6e05\u6670\u3001\u63a5\u53e3\u7a33\u5b9a\u548c\u590d\u7528\u6027\u3002','options':[{'key':'A','content':'\u804c\u8d23\u6e05\u6670\u3001\u63a5\u53e3\u7a33\u5b9a'},{'key':'B','content':'\u6240\u6709\u903b\u8f91\u96c6\u4e2d\u5230\u4e00\u4e2a\u7ec4\u4ef6'},{'key':'C','content':'\u5ffd\u7565\u72b6\u6001\u8fb9\u754c'},{'key':'D','content':'\u7981\u6b62\u7ec4\u4ef6\u590d\u7528'}],'scoringPoints':[]})
    elif qtype=='MULTIPLE_CHOICE':
        c.update({'title':f"100\u5206\u7efc\u5408\u591a\u9009\u9898 {i}\uff1a\u53ef\u9760\u7684\u5728\u7ebf\u8003\u8bd5\u7cfb\u7edf\u5e94\u5177\u5907\u54ea\u4e9b\u80fd\u529b\uff1f",'answer':['A','C'],'analysis':'\u8003\u8bd5\u7cfb\u7edf\u9700\u8981\u8eab\u4efd\u9274\u6743\u3001\u6743\u9650\u8fb9\u754c\u548c\u5ba1\u8ba1\u8ffd\u8e2a\u3002','options':[{'key':'A','content':'\u57fa\u4e8e\u89d2\u8272\u7684\u6743\u9650\u63a7\u5236'},{'key':'B','content':'\u6240\u6709\u5b66\u751f\u5171\u4eab\u540c\u4e00\u8d26\u53f7'},{'key':'C','content':'\u5173\u952e\u64cd\u4f5c\u5ba1\u8ba1\u8ffd\u8e2a'},{'key':'D','content':'\u7b54\u5377\u53ea\u4fdd\u5b58\u5728\u6d4f\u89c8\u5668\u5185\u5b58'}],'scoringPoints':[]})
    elif qtype=='TRUE_FALSE':
        c.update({'title':f"100\u5206\u7efc\u5408\u5224\u65ad\u9898 {i}\uff1a\u5b66\u751f\u4ea4\u5377\u540e\uff0c\u7cfb\u7edf\u5e94\u751f\u6210\u53ef\u8ffd\u8e2a\u7684\u7b54\u5377\u548c\u6279\u6539\u4efb\u52a1\u3002",'answer':'True','analysis':'\u4ea4\u5377\u540e\u5e94\u8fdb\u5165\u53ef\u8ffd\u8e2a\u7684\u6279\u6539\u4e0e\u6210\u7ee9\u53d1\u5e03\u94fe\u8def\u3002','options':[{'key':'True','content':'\u6b63\u786e'},{'key':'False','content':'\u9519\u8bef'}],'scoringPoints':[]})
    elif qtype=='FILL_BLANK':
        c.update({'title':f"100\u5206\u7efc\u5408\u586b\u7a7a\u9898 {i}\uff1a\u7528\u4e8e\u8bb0\u5f55\u5173\u952e\u64cd\u4f5c\u5e76\u652f\u6301\u8ffd\u6eaf\u7684\u80fd\u529b\u79f0\u4e3a____\u3002",'answer':'\u5ba1\u8ba1','analysis':'\u5ba1\u8ba1\u65e5\u5fd7\u7528\u4e8e\u5b89\u5168\u8ffd\u6eaf\u3002','options':[],'scoringPoints':[]})
    elif qtype=='SHORT_ANSWER':
        c.update({'title':f"100\u5206\u7efc\u5408\u7b80\u7b54\u9898 {i}\uff1a\u8bf7\u8bf4\u660e\u8003\u8bd5\u7cfb\u7edf\u4e2d\u6559\u5e08\u590d\u6838\u73af\u8282\u7684\u4f5c\u7528\u3002",'answer':'\u6559\u5e08\u590d\u6838\u7528\u4e8e\u6821\u9a8c\u7cfb\u7edf\u81ea\u52a8\u5224\u5206\u7ed3\u679c\uff0c\u5904\u7406\u4e3b\u89c2\u9898\u4e89\u8bae\u548c\u5f02\u5e38\u7b54\u5377\uff0c\u786e\u4fdd\u6210\u7ee9\u51c6\u786e\u3001\u516c\u5e73\u3001\u53ef\u8ffd\u6eaf\u3002','analysis':'\u7b54\u6848\u5e94\u8986\u76d6\u81ea\u52a8\u5224\u5206\u6821\u9a8c\u3001\u5f02\u5e38\u5904\u7406\u548c\u53ef\u8ffd\u6eaf\u6027\u3002','options':[],'scoringPoints':[{'description':'\u6821\u9a8c\u81ea\u52a8\u5224\u5206','score':2,'keywords':['\u81ea\u52a8\u5224\u5206','\u6821\u9a8c']},{'description':'\u5904\u7406\u5f02\u5e38\u6216\u4e89\u8bae','score':2,'keywords':['\u5f02\u5e38','\u4e89\u8bae']},{'description':'\u4fdd\u969c\u516c\u5e73\u4e0e\u8ffd\u6eaf','score':1,'keywords':['\u516c\u5e73','\u8ffd\u6eaf']}]})
    else:
        c.update({'title':f"100\u5206\u7efc\u5408\u7f16\u7a0b\u9898 {i}\uff1a\u5b9e\u73b0\u4e00\u4e2a\u51fd\u6570\uff0c\u7edf\u8ba1\u6570\u7ec4\u4e2d\u53ca\u683c\u5206\u6570\u7684\u6570\u91cf\u3002",'answer':'\u904d\u5386\u5206\u6570\u6570\u7ec4\uff0c\u5224\u65ad\u5206\u6570\u662f\u5426\u5927\u4e8e\u7b49\u4e8e 60\uff0c\u6ee1\u8db3\u6761\u4ef6\u5219\u8ba1\u6570\u52a0\u4e00\u3002','analysis':'\u8bc4\u5206\u5173\u6ce8\u8fb9\u754c\u5904\u7406\u3001\u904d\u5386\u903b\u8f91\u548c\u590d\u6742\u5ea6\u3002','options':[],'scoringPoints':[{'description':'\u6b63\u786e\u904d\u5386\u6570\u7ec4','score':3,'keywords':['\u904d\u5386','\u6570\u7ec4']},{'description':'\u4f7f\u7528\u5927\u4e8e\u7b49\u4e8e 60 \u7684\u5224\u65ad','score':3,'keywords':['60','>=']},{'description':'\u8fd4\u56de\u6b63\u786e\u8ba1\u6570','score':3,'keywords':['\u8ba1\u6570']},{'description':'\u590d\u6742\u5ea6\u4e3a O(n)','score':1,'keywords':['O(n)']}]})
    return c

teacher=login(TEACHER_USERNAME,TEACHER_PASSWORD); student=login(STUDENT_USERNAME,STUDENT_PASSWORD)
t=teacher['token']; st=student['token']
cls=None
for c in api('GET','/api/v1/admin/classes',token=t)['data']:
    page=api('GET',f"/api/v1/classes/{c['id']}/students?page=1&pageSize=500",token=t)['data']
    if any(x['studentNo']==STUDENT_USERNAME for x in page['items']): cls=c; break
if not cls: raise SystemExit('student class not found')
course=next((c for c in api('GET','/api/v1/admin/courses',token=t)['data'] if c['id']==cls['courseId']),None)
if course:
    api('PATCH',f"/api/v1/admin/courses/{course['id']}",{'code':course['code'],'name':'MindMark \u89c6\u89c9\u9a8c\u6536\u8bfe\u7a0b','description':'\u56fa\u5b9a\u5b66\u751f\u8d26\u53f7 100 \u5206\u6df7\u5408\u9898\u578b\u8003\u8bd5\u9a8c\u6536\u8bfe\u7a0b','status':'ACTIVE'},token=t)
cls=api('PATCH',f"/api/v1/admin/classes/{cls['id']}",{'courseId':cls['courseId'],'code':cls['code'],'name':'MindMark \u89c6\u89c9\u9a8c\u6536\u73ed\u7ea7','grade':'2026','major':'\u8f6f\u4ef6\u5de5\u7a0b','status':'ACTIVE'},token=t)['data']
created=[]
rules=[('SINGLE_CHOICE',10,1,['EASY','MEDIUM']),('MULTIPLE_CHOICE',10,2,['MEDIUM','HARD']),('TRUE_FALSE',10,1,['VERY_EASY','EASY','MEDIUM']),('FILL_BLANK',10,1,['EASY','MEDIUM']),('SHORT_ANSWER',4,5,['MEDIUM','HARD']),('PROGRAMMING',3,10,['HARD','VERY_HARD'])]
for typ,count,score,diffs in rules:
    for i in range(1,count+1): created.append(api('POST','/api/v1/questions',qpayload(cls['courseId'],typ,diffs[(i-1)%len(diffs)],score,i),token=t)['data'])
run=datetime.now().strftime('%Y%m%d%H%M%S')
paper=api('POST','/api/v1/papers',{'title':f"100\u5206\u6df7\u5408\u9898\u578b\u4e0a\u673a\u8003\u8bd5\u8bd5\u5377 {run}",'courseId':cls['courseId'],'description':'\u8986\u76d6\u5355\u9009\u3001\u591a\u9009\u3001\u5224\u65ad\u3001\u586b\u7a7a\u3001\u7b80\u7b54\u3001\u7f16\u7a0b\u516d\u7c7b\u9898\u578b\uff0c\u603b\u5206 100 \u5206\u3002','durationMinutes':90},token=t)['data']
for q in created: paper=api('POST',f"/api/v1/papers/{paper['id']}/questions",{'questionId':q['id'],'score':q['score']},token=t)['data']
paper=api('PATCH',f"/api/v1/papers/{paper['id']}/status",{'status':'READY'},token=t)['data']
now=datetime.now(timezone.utc)
exam=api('POST','/api/v1/exams',{'title':f"100\u5206\u6df7\u5408\u9898\u578b\u4e0a\u673a\u8003\u8bd5 {run}",'paperId':paper['id'],'classIds':[cls['id']],'startAt':(now-timedelta(minutes=2)).isoformat(),'endAt':(now+timedelta(hours=3)).isoformat(),'durationMinutes':90},token=t)['data']
se=next((e for e in api('GET','/api/v1/student/exams',token=st)['data'] if e['id']==exam['id']),None)
summary={'runId':run,'studentUsername':STUDENT_USERNAME,'studentPassword':STUDENT_PASSWORD,'classId':cls['id'],'className':cls['name'],'courseId':cls['courseId'],'examId':exam['id'],'examTitle':exam['title'],'examStatus':exam['status'],'paperId':paper['id'],'paperTitle':paper['title'],'paperTotalScore':paper['totalScore'],'paperQuestionCount':len(paper['questions']),'studentExamStatus':se['status'] if se else None,'answerSheetId':se.get('answerSheetId') if se else None,'composition':[{'type':'SINGLE_CHOICE','label':'\u5355\u9009\u9898','count':10,'score':10},{'type':'MULTIPLE_CHOICE','label':'\u591a\u9009\u9898','count':10,'score':20},{'type':'TRUE_FALSE','label':'\u5224\u65ad\u9898','count':10,'score':10},{'type':'FILL_BLANK','label':'\u586b\u7a7a\u9898','count':10,'score':10},{'type':'SHORT_ANSWER','label':'\u7b80\u7b54\u9898','count':4,'score':20},{'type':'PROGRAMMING','label':'\u7f16\u7a0b\u9898','count':3,'score':30}]}
open('.tmp/fixed-student-100-exam-result.json','w',encoding='utf-8').write(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps(summary,ensure_ascii=True,indent=2))
