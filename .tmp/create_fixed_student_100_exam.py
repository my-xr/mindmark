
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from decimal import Decimal

BASE_URL = "http://localhost:18084"
TEACHER_USERNAME = "teacher@mindmark.local"
TEACHER_PASSWORD = "dev-password"
STUDENT_USERNAME = "20260722120655"
STUDENT_PASSWORD = "Mindmark123"


def api(method, path, body=None, token=None, timeout=60):
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE_URL + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP failed {method} {path} status={exc.code} response={raw}") from exc


def login(username, password):
    return api("POST", "/api/v1/auth/login", {"username": username, "password": password})["data"]


def question_payload(course_id, qtype, difficulty, score, index):
    kp_map = {
        "SINGLE_CHOICE": "????",
        "MULTIPLE_CHOICE": "????",
        "TRUE_FALSE": "????",
        "FILL_BLANK": "????",
        "SHORT_ANSWER": "????",
        "PROGRAMMING": "????",
    }
    kp = kp_map[qtype]
    common = {
        "courseId": course_id,
        "type": qtype,
        "difficulty": difficulty,
        "knowledgePoints": [kp],
        "score": score,
    }
    if qtype == "SINGLE_CHOICE":
        return common | {
            "title": f"100?????? {index}??????????????????????????",
            "answer": "A",
            "analysis": "????????????????????????????????????",
            "options": [
                {"key": "A", "content": "?????????"},
                {"key": "B", "content": "???????????"},
                {"key": "C", "content": "??????"},
                {"key": "D", "content": "??????"},
            ],
            "scoringPoints": [],
        }
    if qtype == "MULTIPLE_CHOICE":
        return common | {
            "title": f"100?????? {index}???????????????????????",
            "answer": ["A", "C"],
            "analysis": "???????????????????????????????",
            "options": [
                {"key": "A", "content": "?????????"},
                {"key": "B", "content": "??????????"},
                {"key": "C", "content": "????????"},
                {"key": "D", "content": "???????????"},
            ],
            "scoringPoints": [],
        }
    if qtype == "TRUE_FALSE":
        return common | {
            "title": f"100?????? {index}????????????????????????",
            "answer": "True",
            "analysis": "????????????????????????????????",
            "options": [{"key": "True", "content": "??"}, {"key": "False", "content": "??"}],
            "scoringPoints": [],
        }
    if qtype == "FILL_BLANK":
        return common | {
            "title": f"100?????? {index}???????????????????????____?",
            "answer": "??",
            "analysis": "????????????????????????????",
            "options": [],
            "scoringPoints": [],
        }
    if qtype == "SHORT_ANSWER":
        return common | {
            "title": f"100?????? {index}???????????????????",
            "answer": "?????????????????????????????????????????????????????",
            "analysis": "??????????????????????????",
            "options": [],
            "scoringPoints": [
                {"description": "??????????", "score": 2, "keywords": ["????", "??"]},
                {"description": "?????????", "score": 2, "keywords": ["??", "??", "???"]},
                {"description": "????????", "score": 1, "keywords": ["??", "??"]},
            ],
        }
    return common | {
        "title": f"100?????? {index}?????????????????????",
        "answer": "??????????????????? 60???????????????????????????????????",
        "analysis": "???????????????????????",
        "options": [],
        "scoringPoints": [
            {"description": "??????", "score": 3, "keywords": ["??", "??"]},
            {"description": "?????? 60 ???", "score": 3, "keywords": ["60", "????", ">="]},
            {"description": "????????????", "score": 3, "keywords": ["??", "???"]},
            {"description": "???? O(n)", "score": 1, "keywords": ["O(n)", "??"]},
        ],
    }


def main():
    run_id = datetime.now().strftime("%Y%m%d%H%M%S")
    teacher = login(TEACHER_USERNAME, TEACHER_PASSWORD)
    student = login(STUDENT_USERNAME, STUDENT_PASSWORD)
    teacher_token = teacher["token"]
    student_token = student["token"]

    target_class = None
    target_student = None
    for clazz in api("GET", "/api/v1/admin/classes", token=teacher_token)["data"]:
        page = api("GET", f"/api/v1/classes/{clazz['id']}/students?page=1&pageSize=500", token=teacher_token)["data"]
        for item in page["items"]:
            if item["studentNo"] == STUDENT_USERNAME:
                target_class = clazz
                target_student = item
                break
        if target_class:
            break
    if not target_class:
        raise RuntimeError(f"Student {STUDENT_USERNAME} was not found in manageable classes")

    courses = api("GET", "/api/v1/admin/courses", token=teacher_token)["data"]
    course = next((c for c in courses if c["id"] == target_class["courseId"]), None)
    if course:
        api("PATCH", f"/api/v1/admin/courses/{course['id']}", {
            "code": course["code"],
            "name": "MindMark ??????",
            "description": "?????? 100 ???????????",
            "status": "ACTIVE",
        }, token=teacher_token)
    target_class = api("PATCH", f"/api/v1/admin/classes/{target_class['id']}", {
        "courseId": target_class["courseId"],
        "code": target_class["code"],
        "name": "MindMark ??????",
        "grade": "2026",
        "major": "????",
        "status": "ACTIVE",
    }, token=teacher_token)["data"]

    rules = [
        ("SINGLE_CHOICE", 10, 1, ["EASY", "MEDIUM"]),
        ("MULTIPLE_CHOICE", 10, 2, ["MEDIUM", "HARD"]),
        ("TRUE_FALSE", 10, 1, ["VERY_EASY", "EASY", "MEDIUM"]),
        ("FILL_BLANK", 10, 1, ["EASY", "MEDIUM"]),
        ("SHORT_ANSWER", 4, 5, ["MEDIUM", "HARD"]),
        ("PROGRAMMING", 3, 10, ["HARD", "VERY_HARD"]),
    ]
    created = []
    for qtype, count, score, diffs in rules:
        for idx in range(1, count + 1):
            created.append(api("POST", "/api/v1/questions", question_payload(target_class["courseId"], qtype, diffs[(idx - 1) % len(diffs)], score, idx), token=teacher_token)["data"])
    total_score = sum(float(q["score"]) for q in created)
    if total_score != 100:
        raise RuntimeError(f"Created questions score is not 100: {total_score}")

    paper = api("POST", "/api/v1/papers", {
        "title": f"100??????????? {run_id}",
        "courseId": target_class["courseId"],
        "description": "?????????????????????????? 100 ??",
        "durationMinutes": 90,
    }, token=teacher_token)["data"]
    for question in created:
        paper = api("POST", f"/api/v1/papers/{paper['id']}/questions", {"questionId": question["id"], "score": question["score"]}, token=teacher_token)["data"]
    paper = api("PATCH", f"/api/v1/papers/{paper['id']}/status", {"status": "READY"}, token=teacher_token)["data"]
    if float(paper["totalScore"]) != 100:
        raise RuntimeError(f"Paper total score is not 100: {paper['totalScore']}")

    now = datetime.now(timezone.utc)
    exam = api("POST", "/api/v1/exams", {
        "title": f"100????????? {run_id}",
        "paperId": paper["id"],
        "classIds": [target_class["id"]],
        "startAt": (now - timedelta(minutes=2)).isoformat(),
        "endAt": (now + timedelta(hours=3)).isoformat(),
        "durationMinutes": 90,
    }, token=teacher_token)["data"]

    student_exams = api("GET", "/api/v1/student/exams", token=student_token)["data"]
    student_exam = next((e for e in student_exams if e["id"] == exam["id"]), None)
    if not student_exam:
        raise RuntimeError("Created exam does not appear in student exam list")

    summary = {
        "runId": run_id,
        "studentUsername": STUDENT_USERNAME,
        "studentPassword": STUDENT_PASSWORD,
        "classId": target_class["id"],
        "className": target_class["name"],
        "courseId": target_class["courseId"],
        "examId": exam["id"],
        "examTitle": exam["title"],
        "examStatus": exam["status"],
        "paperId": paper["id"],
        "paperTitle": paper["title"],
        "paperTotalScore": paper["totalScore"],
        "paperQuestionCount": len(paper["questions"]),
        "studentExamStatus": student_exam["status"],
        "answerSheetId": student_exam.get("answerSheetId"),
        "composition": [
            {"type": "SINGLE_CHOICE", "label": "???", "count": 10, "score": 10},
            {"type": "MULTIPLE_CHOICE", "label": "???", "count": 10, "score": 20},
            {"type": "TRUE_FALSE", "label": "???", "count": 10, "score": 10},
            {"type": "FILL_BLANK", "label": "???", "count": 10, "score": 10},
            {"type": "SHORT_ANSWER", "label": "???", "count": 4, "score": 20},
            {"type": "PROGRAMMING", "label": "???", "count": 3, "score": 30},
        ],
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
