import json
import urllib.request
from datetime import datetime, timedelta, timezone

base = 'http://localhost:18084'

def api(method, path, body=None, token=None):
    data = None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(base + path, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode('utf-8'))
    if payload.get('code') != '0':
        raise RuntimeError(f'{method} {path} failed: {payload}')
    return payload.get('data')

teacher = api('POST', '/api/v1/auth/login', {'username': 'teacher@mindmark.local', 'password': 'dev-password'})
token = teacher['token']
run_id = datetime.now().strftime('%m%d%H%M%S')
student_no = f'2026{run_id}'
initial = student_no[-6:]
password = 'Mindmark123'
course = api('POST', '/api/v1/admin/courses', {
    'code': f'STU-VISUAL-{run_id}',
    'name': f'学生答题页视觉验收课程 {run_id}',
    'description': '用于学生答题页真实视觉验收',
    'status': 'ACTIVE',
}, token)
clazz = api('POST', '/api/v1/admin/classes', {
    'courseId': course['id'],
    'code': f'STU-VISUAL-CLS-{run_id}',
    'name': f'学生答题页视觉验收班级 {run_id}',
    'grade': '2026',
    'major': '软件工程',
    'status': 'ACTIVE',
}, token)
api('POST', f"/api/v1/classes/{clazz['id']}/students/import", {
    'className': clazz['name'],
    'students': [{
        'studentNo': student_no,
        'name': f'视觉验收学生{run_id}',
        'email': f'{student_no}@student.mindmark.local',
        'className': clazz['name'],
        'grade': '2026',
        'major': '软件工程',
    }],
}, token)
paper = api('GET', '/api/v1/papers/paper-001', token=token)
if paper.get('status') not in ('READY', 'PUBLISHED'):
    api('PATCH', '/api/v1/papers/paper-001/status', {'status': 'READY'}, token)
now = datetime.now(timezone(timedelta(hours=8)))
exam = api('POST', '/api/v1/exams', {
    'title': f'学生答题页视觉验收考试 {run_id}',
    'paperId': 'paper-001',
    'classIds': [clazz['id']],
    'startAt': (now - timedelta(minutes=2)).isoformat(timespec='seconds'),
    'endAt': (now + timedelta(minutes=90)).isoformat(timespec='seconds'),
    'durationMinutes': 90,
}, token)
student_login = api('POST', '/api/v1/auth/login', {'username': student_no, 'password': initial})
api('POST', '/api/v1/auth/change-password', {'oldPassword': initial, 'newPassword': password}, student_login['token'])
print(json.dumps({
    'studentNo': student_no,
    'password': password,
    'examId': exam['id'],
    'examTitle': exam['title'],
    'status': exam['status'],
}, ensure_ascii=False, indent=2))
