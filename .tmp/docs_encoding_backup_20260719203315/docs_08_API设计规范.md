# 08 API 璁捐瑙勮寖

## 1. 璁捐鐩爣

- 鏀寔鍓嶇 Mock 鍒扮湡瀹炴帴鍙ｅ钩婊戣縼绉汇€?
- 淇濇寔鎺ュ彛鍛藉悕銆佸垎椤点€侀敊璇爜鍜屽搷搴旂粨鏋勪竴鑷淬€?
- 涓哄悗缁?Spring Boot 鍗曚綋鏈嶅姟銆佹帴鍙ｆ枃妗ｅ拰鏉冮檺鎺у埗棰勭暀鏍囧噯銆?

## 2. API 鍩烘湰绾﹀畾

| 椤?| 绾﹀畾 |
| --- | --- |
| 鍗忚 | HTTP / HTTPS |
| 鏁版嵁鏍煎紡 | JSON |
| 璁よ瘉 | Bearer Token锛屽悗缁悗绔樁娈电粏鍖?|
| 鏃堕棿鏍煎紡 | ISO 8601 瀛楃涓?|
| ID 绫诲瀷 | string |
| 鍒嗛〉 | page銆乸ageSize銆乼otal |

## 3. 缁熶竴鍝嶅簲缁撴瀯

鎴愬姛鍝嶅簲锛?

```json
{
  "code": "OK",
  "message": "success",
  "data": {}
}
```

鍒嗛〉鍝嶅簲锛?

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

閿欒鍝嶅簲锛?

```json
{
  "code": "VALIDATION_ERROR",
  "message": "鍙傛暟鏍￠獙澶辫触",
  "details": [
    { "field": "title", "reason": "鑰冭瘯鍚嶇О涓嶈兘涓虹┖" }
  ],
  "traceId": "trace-xxx"
}
```

## 4. 閿欒鐮佸垎绫?

| 閿欒鐮?| 璇存槑 |
| --- | --- |
| OK | 鎴愬姛 |
| VALIDATION_ERROR | 鍙傛暟鏍￠獙澶辫触 |
| UNAUTHORIZED | 鏈櫥褰曟垨浠ょ墝鏃犳晥 |
| FORBIDDEN | 鏃犳潈闄?|
| NOT_FOUND | 璧勬簮涓嶅瓨鍦?|
| CONFLICT | 鐘舵€佸啿绐佹垨閲嶅鎿嶄綔 |
| EXAM_LOCKED | 鑰冭瘯鎴栬瘯鍗峰凡閿佸畾 |
| GRADING_NOT_READY | 鎵规敼鏈畬鎴?|
| AI_PROVIDER_ERROR | AI 鏈嶅姟璋冪敤澶辫触 |
| INTERNAL_ERROR | 绯荤粺鍐呴儴閿欒 |

## 5. 璧勬簮鍛藉悕寤鸿

```text
/api/v1/questions
/api/v1/question-banks
/api/v1/ai/question-generations
/api/v1/papers
/api/v1/exams
/api/v1/exams/{examId}/participants
/api/v1/exams/{examId}/answer-sheets
/api/v1/grading-tasks
/api/v1/score-reports
/api/v1/appeals
/api/v1/review-reports
/api/v1/notifications
/api/v1/admin/users
/api/v1/admin/roles
```

## 6. 鏍稿績鎺ュ彛鑽夋

| 棰嗗煙 | 鏂规硶 | 璺緞 | 璇存槑 |
| --- | --- | --- | --- |
| 棰樺簱 | GET | `/api/v1/questions` | 棰樼洰鍒楄〃 |
| 棰樺簱 | POST | `/api/v1/questions` | 鏂板缓棰樼洰 |
| AI 鍑洪 | POST | `/api/v1/ai/question-generations` | 鍒涘缓 AI 鍑洪浠诲姟 |
| AI 鍑洪 | POST | `/api/v1/ai/generated-questions/{id}/accept` | 鎺ュ彈 AI 棰樼洰 |
| 璇曞嵎 | GET | `/api/v1/papers` | 璇曞嵎鍒楄〃 |
| 璇曞嵎 | POST | `/api/v1/papers` | 鍒涘缓璇曞嵎 |
| 鑰冭瘯 | GET | `/api/v1/exams` | 鑰冭瘯鍒楄〃 |
| 鑰冭瘯 | POST | `/api/v1/exams` | 鍒涘缓鑰冭瘯 |
| 鑰冭瘯 | POST | `/api/v1/exams/{id}/publish` | 鍙戝竷鑰冭瘯 |
| 瀛︾敓绛旈 | GET | `/api/v1/student/exams` | 瀛︾敓鑰冭瘯鍒楄〃 |
| 瀛︾敓绛旈 | PUT | `/api/v1/answer-sheets/{id}/draft` | 淇濆瓨鑽夌 |
| 瀛︾敓绛旈 | POST | `/api/v1/answer-sheets/{id}/submit` | 鎻愪氦绛斿嵎 |
| 鎵规敼 | GET | `/api/v1/grading-tasks` | 鎵规敼浠诲姟鍒楄〃 |
| 鎵规敼 | POST | `/api/v1/grading-tasks/{id}/review` | 浜哄伐澶嶆牳 |
| 鎴愮哗 | POST | `/api/v1/exams/{examId}/publish-scores` | 鍙戝竷鎴愮哗 |
| 鎴愮哗 | GET | `/api/v1/student/score-reports/{id}` | 瀛︾敓鏌ョ湅鎴愮哗 |

## 7. Mock 涓庣湡瀹炴帴鍙ｅ垏鎹㈣鍒?

- 鍓嶇椤甸潰鍙皟鐢?service锛屼笉鐩存帴渚濊禆 Mock 鏂囦欢銆?
- service 鍙湪闃舵 0 鍐呴儴璇诲彇 Mock 鏁版嵁銆?
- 褰撳悗绔帴鍙ｅ彲鐢ㄦ椂锛屽彧鏇挎崲 service 瀹炵幇锛屼笉澶ц妯℃敼椤甸潰銆?
- Mock 鍝嶅簲蹇呴』绗﹀悎缁熶竴鍝嶅簲缁撴瀯銆?

## 8. 鍚庣画缁存姢瑙勫垯

鏂板鎺ュ彛鎴栦慨鏀瑰瓧娈靛墠锛屽繀椤诲悓姝ユ洿鏂版湰鏂囨。銆侀鍩熸ā鍨嬨€佸墠绔被鍨嬨€丮ock 鏁版嵁鍜屾祴璇曢獙鏀舵竻鍗曘€?

## 8. Iteration 6 鑰冭瘯闂幆 P0/P1 鎺ュ彛濂戠害琛ュ厖

褰撳墠鍓嶇 Mock service 宸叉寜鏈潵鎺ュ彛鍒嗗眰锛屽悗绔樁娈靛簲浼樺厛瀹炵幇 P0 闂幆鎺ュ彛锛屽啀瀹炵幇 P1 AI 涓庡鐩樻帴鍙ｃ€傝缁嗚縼绉绘槧灏勮 `19_鍚庣鎺ュ彛濂戠害鍑嗗.md`銆?

### 8.1 P0 闂幆鎺ュ彛

| 棰嗗煙 | 鏂规硶 | 璺緞 | 瀵瑰簲鍓嶇 Service | 璇存槑 |
| --- | --- | --- | --- | --- |
| 棰樺簱 | GET | `/api/v1/questions` | `questionService.listQuestions` | 棰樺簱鍒楄〃涓庣瓫閫夈€?|
| 璇曞嵎 | GET | `/api/v1/papers` | `paperService.listPapers` | 璇曞嵎鍒楄〃涓庤鎯呫€?|
| 璇曞嵎 | POST | `/api/v1/papers/{paperId}/questions` | `paperService.addQuestionToPaper` | 娣诲姞棰樼洰鍒拌瘯鍗枫€?|
| 璇曞嵎 | DELETE | `/api/v1/papers/{paperId}/questions/{questionId}` | `paperService.removeQuestionFromPaper` | 浠庤瘯鍗风Щ闄ら鐩€?|
| 鑰冭瘯 | POST | `/api/v1/exams` | `examService.createExam` | 鍒涘缓鑰冭瘯銆?|
| 瀛︾敓绛旈 | GET | `/api/v1/student/exams` | `examService.listStudentExams` | 瀛︾敓鑰冭瘯鍒楄〃銆?|
| 瀛︾敓绛旈 | PUT | `/api/v1/answer-sheets/{id}/draft` | `examService.saveAnswerDraft` | 淇濆瓨绛旈鑽夌銆?|
| 瀛︾敓绛旈 | POST | `/api/v1/answer-sheets/{id}/submit` | `examService.submitAnswerSheet` | 鎻愪氦绛斿嵎銆?|
| 鎵规敼 | GET | `/api/v1/grading-tasks` | `gradingService.listGradingTasks` | 鎵规敼浠诲姟鍒楄〃銆?|
| 鎵规敼 | POST | `/api/v1/grading-tasks/{id}/review` | `gradingService.reviewGradingTask` | 鏁欏笀澶嶆牳銆?|
| 鎴愮哗 | POST | `/api/v1/exams/{examId}/publish-scores` | `gradingService.publishExamScores` | 鍙戝竷鎴愮哗銆?|
| 鎴愮哗 | GET | `/api/v1/student/score-reports` | `gradingService.listStudentScoreReports` | 瀛︾敓鎴愮哗鍙嶉銆?|

### 8.2 P1 AI 涓庡鐩樻帴鍙?

| 棰嗗煙 | 鏂规硶 | 璺緞 | 瀵瑰簲鍓嶇 Service | 璇存槑 |
| --- | --- | --- | --- | --- |
| AI 鍑洪 | POST | `/api/v1/ai/question-generations` | `aiQuestionService.generateAiQuestionDrafts` | 鍒涘缓 AI 鍑洪浠诲姟銆?|
| 澶嶇洏 | GET | `/api/v1/review-reports` | `reviewService.listExamReviewReports` | 鑰冭瘯澶嶇洏鎶ュ憡鍒楄〃銆?|
| 澶嶇洏 | POST | `/api/v1/review-reports/{examId}/lecture-draft/regenerate` | `reviewService.regenerateLectureDraft` | 閲嶆柊鐢熸垚 AI 璁茶瘎绋裤€?|
| 澶嶇洏 | POST | `/api/v1/review-reports/{examId}/lecture-draft/approve` | `reviewService.approveLectureDraft` | 鏁欏笀纭璁茶瘎绋裤€?|

### 8.3 鍚庣瀹炵幇绾︽潫

- P0 鎺ュ彛蹇呴』瀹屾垚鏉冮檺鏍￠獙銆佸弬鏁版牎楠屻€佺姸鎬佸啿绐佹牎楠屽拰瀹¤璁板綍銆?
- 浜ゅ嵎銆佹壒鏀瑰鏍搞€佹垚缁╁彂甯冨睘浜庡叧閿姸鎬佹祦杞帴鍙ｏ紝蹇呴』淇濊瘉骞傜瓑鎴栨槑纭啿绐侀敊璇€?
- 瀛︾敓绔帴鍙ｅ繀椤绘寜褰撳墠鐧诲綍瀛︾敓杩囨护鏁版嵁锛岀姝㈤€氳繃鍙傛暟璁块棶鍏朵粬瀛︾敓鎴愮哗鎴栫瓟鍗枫€?
- AI 鍑洪銆丄I 鎵规敼銆丄I 璁茶瘎绋挎帴鍙ｅ繀椤诲啓鍏?AI 璋冪敤瀹¤锛屼笉寰楀湪浠ｇ爜鎴栨棩蹇椾腑娉勯湶鐪熷疄 API Key銆?


## 9. OpenAPI 濂戠害钀藉湴锛圛teration 7锛?
鍚庣涓婚」鐩垱寤哄悗锛岄潤鎬?OpenAPI 濂戠害缁熶竴缁存姢鍦細

```text
apps/mindmark-server/openapi/mindmark-api.yaml
```

濂戠害缁存姢瑙勫垯锛?
1. `08_API璁捐瑙勮寖.md` 璐熻矗瀹氫箟鍏ㄥ眬鎺ュ彛椋庢牸銆佺粺涓€鍝嶅簲銆侀敊璇爜銆侀壌鏉冨拰鍒嗛〉瑙勮寖銆?2. `19_鍚庣鎺ュ彛濂戠害鍑嗗.md` 璐熻矗缁存姢鍓嶇 Mock service 鍒扮湡瀹炲悗绔帴鍙ｇ殑杩佺Щ鏄犲皠銆?3. `apps/mindmark-server/openapi/mindmark-api.yaml` 璐熻矗鎻愪緵鍙宸ュ叿娑堣垂鐨勮矾寰勩€佸弬鏁般€佽姹備綋鍜屽搷搴?schema銆?4. 鍚庣画鍚庣瀹炵幇鎺ュ彛鏃讹紝Controller 鍏ュ弬 / 鍑哄弬涓?OpenAPI schema 蹇呴』淇濇寔涓€鑷淬€?5. 鍓嶇鍒囨崲鐪熷疄鎺ュ彛鍓嶏紝蹇呴』鍏堟牳瀵?service 绫诲瀷涓?OpenAPI schema 鐨勫瓧娈靛樊寮傘€?

## 10. Iteration 8 P0 鎺ュ彛瀹炵幇鐘舵€?
棣栨壒鐪熷疄鍚庣 P0 鎺ュ彛宸插湪 `apps/mindmark-server` 涓疄鐜帮紝鍝嶅簲浠嶉伒寰粺涓€缁撴瀯锛?
```json
{
  "code": "0",
  "message": "Success",
  "data": {},
  "timestamp": "2026-07-17T16:00:00+08:00"
}
```

宸插疄鐜版帴鍙ｏ細

| 鎺ュ彛 | 璇存槑 | 鍝嶅簲 data |
| --- | --- | --- |
| `GET /api/v1/questions` | 鏌ヨ棰樺簱棰樼洰锛屾敮鎸佸垎椤点€佸叧閿瘝銆侀鍨嬨€侀毦搴︺€佺姸鎬併€佹潵婧愩€佺煡璇嗙偣绛涢€?| `PageResponse<Question>` |
| `GET /api/v1/papers` | 鏌ヨ璇曞嵎锛屾敮鎸佸垎椤靛拰鍏抽敭璇嶇瓫閫?| `PageResponse<Paper>` |
| `POST /api/v1/papers/{paperId}/questions` | 鍚戣瘯鍗锋坊鍔犻鐩?| `Paper` |
| `DELETE /api/v1/papers/{paperId}/questions/{questionId}` | 浠庤瘯鍗风Щ闄ら鐩?| `Paper` |

鍒嗛〉鍙傛暟锛?
| 鍙傛暟 | 榛樿 | 璇存槑 |
| --- | --- | --- |
| page | 1 | 浠?1 寮€濮嬨€?|
| pageSize | 20 | 鏈€澶?100銆?|

閿欒澶勭悊锛?
| 鍦烘櫙 | HTTP | code |
| --- | --- | --- |
| 棰樼洰鎴栬瘯鍗蜂笉瀛樺湪 | 404 | `MM-404-001` |
| 閲嶅娣诲姞棰樼洰銆佽瘯鍗峰凡鍙戝竷鎴栧綊妗?| 409 | `MM-409-001` |
| 鍙傛暟涓嶅悎娉?| 400 | `MM-400-001` |

Iteration 8 宸插疄鐜拌矾寰勪互 `apps/mindmark-server/openapi/mindmark-api.yaml` 涓哄噯锛涙柊澧炴垨璋冩暣鎺ュ彛鏃跺繀椤诲悓姝?Controller DTO銆丱penAPI schema銆佸墠绔?service 绫诲瀷鍜屾湰鏂囨。銆?

## 11. Iteration 9 P0 鎺ュ彛瀹炵幇鐘舵€?
Iteration 9 宸插疄鐜颁互涓嬪悗绔帴鍙ｏ紝鍏蜂綋濂戠害浠?`apps/mindmark-server/openapi/mindmark-api.yaml` 涓哄噯锛?
| 鎺ュ彛 | 鐘舵€?| 璇存槑 |
| --- | --- | --- |
| `POST /api/v1/exams` | 宸插疄鐜?| 鏁欏笀鍒涘缓鑰冭瘯锛屽熀浜庤瘯鍗风敓鎴愯€冭瘯銆佸弬涓庡鐢熷揩鐓у拰鍒濆绛斿嵎銆?|
| `GET /api/v1/student/exams` | 宸插疄鐜?| 瀛︾敓鑰冭瘯鍒楄〃锛汻ound 1 鍚庝笉鍐嶆帴鏀?`studentId`锛屽悗绔粠 Sa-Token 鐧诲綍鎬佽В鏋愬綋鍓嶅鐢熴€?|
| `PUT /api/v1/answer-sheets/{answerSheetId}/draft` | 宸插疄鐜?| 骞傜瓑淇濆瓨绛斿嵎鑽夌锛屾牎楠岀瓟鍗风姸鎬佷笌棰樼洰鑼冨洿锛岄€掑绛斿嵎鐗堟湰銆?|
| `POST /api/v1/answer-sheets/{answerSheetId}/submit` | 宸插疄鐜?| 瀛︾敓浜ゅ嵎锛岀瓟鍗风姸鎬佷粠 `DRAFT` 娴佽浆涓?`SUBMITTED`銆?|

瀹炵幇璇存槑锛?- API 鏋氫妇鍊肩粺涓€閲囩敤澶у啓瀛楃涓诧紝浠ュ尮閰嶅悗绔?Java 鏋氫妇鍜屽墠绔被鍨嬬害瀹氥€?- 绛旀鍐呭浠?JSON 缁撴瀯鎺ユ敹骞朵互 `answer_json` 鏂囨湰鎸佷箙鍖栵紝鍏煎鍗曢€夈€佸閫夈€佸～绌恒€佺畝绛斻€佺紪绋嬬瓑棰樺瀷銆?

## Iteration 10 澧為噺锛氭壒鏀逛笌鎴愮哗 P0 API

| 鏂规硶 | 璺緞 | 璇存槑 | P0 琛屼负 |
| --- | --- | --- | --- |
| `GET` | `/api/v1/grading-tasks` | 鏁欏笀鎵规敼浠诲姟鍒楄〃 | 鏀寔鍙€?`examId` 杩囨护锛岃繑鍥炴壒鏀逛换鍔℃暟缁?|
| `GET` | `/api/v1/grading-tasks/{gradingTaskId}` | 鏁欏笀鎵规敼浠诲姟璇︽儏 | 杩斿洖浠诲姟涓庨鐩壒鏀规槑缁?|
| `POST` | `/api/v1/grading-tasks/{gradingTaskId}/auto-grade` | 瀹㈣棰樿嚜鍔ㄦ壒鏀?| 鍗曢€夈€佸閫夈€佸垽鏂€佸～绌烘寜瑙勫垯鍒ゅ垎锛岀姸鎬佽繘鍏?`AI_CHECKED` |
| `POST` | `/api/v1/grading-tasks/{gradingTaskId}/review` | 鏁欏笀澶嶆牳纭 | 鍏ュ弬 `finalScore`銆乣comment`锛岀姸鎬佽繘鍏?`REVIEWED`锛岀瓟鍗疯繘鍏?`GRADED` |
| `GET` | `/api/v1/exams/{examId}/scores` | 鑰冭瘯鎴愮哗姹囨€?| 杩斿洖宸插鏍镐换鍔＄殑鍧囧垎銆佹渶楂樺垎銆佹渶浣庡垎涓庢帓鍚嶅垪琛?|
| `POST` | `/api/v1/exams/{examId}/publish-scores` | 鍙戝竷鎴愮哗 | 鐢熸垚/鏇存柊瀛︾敓鎴愮哗鎶ュ憡蹇収锛岃€冭瘯鐘舵€佽繘鍏?`SCORES_PUBLISHED` |
| `GET` | `/api/v1/student/score-reports` | 瀛︾敓鎴愮哗鎶ュ憡鍒楄〃 | Round 1 鍚庝笉鍐嶆帴鏀?`studentId`锛屽悗绔粠 Sa-Token 鐧诲綍鎬佽В鏋愬綋鍓嶅鐢?|

### 鑷姩鎵规敼瑙勫垯

- 瀹㈣棰樿寖鍥达細`SINGLE_CHOICE`銆乣MULTIPLE_CHOICE`銆乣TRUE_FALSE`銆乣FILL_BLANK`銆?- 澶氶€夐閲囩敤闆嗗悎瀹屽叏涓€鑷村垽鍒嗭紱濉┖棰橀噰鐢?trim 鍚庡拷鐣ュぇ灏忓啓鍒ゅ垎銆?- 涓昏棰樿寖鍥达細`SHORT_ANSWER`銆乣PROGRAMMING`锛孭0 涓嶈嚜鍔ㄧ粰鍒嗭紝绛夊緟鏁欏笀鏈€缁堢‘璁ゃ€?- 鎵规敼浠诲姟銆佹垚缁╂姤鍛婄殑鐘舵€佹灇涓惧湪 OpenAPI 涓粺涓€浣跨敤 Java 鍚庣澶у啓鏋氫妇銆?

## 11. Iteration 11锛氱湡瀹炴帴鍙ｅ垏鎹㈣ˉ鍏呰鑼?
### 11.1 鏂板/纭鎺ュ彛

| 棰嗗煙 | 鏂规硶 | 璺緞 | 鐢ㄩ€?| 鐘舵€?|
| --- | --- | --- | --- | --- |
| 鑰冭瘯 | GET | `/api/v1/exams` | 鏁欏笀绔€冭瘯鍒楄〃 | 宸插疄鐜板苟杩涘叆 OpenAPI |
| 鑰冭瘯 | GET | `/api/v1/exams/{examId}` | 鏁欏笀绔€冭瘯璇︽儏 | 宸插疄鐜板苟杩涘叆 OpenAPI |

浠ヤ笂鎺ュ彛鍧囩户缁伒寰粺涓€鍝嶅簲缁撴瀯锛?
```json
{
  "code": "SUCCESS",
  "message": "success",
  "data": {},
  "traceId": null,
  "timestamp": "2026-07-17T00:00:00Z"
}
```

### 11.2 鍓嶇鐪熷疄鎺ュ彛璋冪敤绾﹀畾

- 鍓嶇鐪熷疄鎺ュ彛 baseURL 榛樿浣跨敤 `/api`锛屽疄闄呰姹傝矾寰勫啓涓?`/v1/**`銆?- 鏈湴寮€鍙戠敱 Vite proxy 杞彂 `/api` 鍒板悗绔湇鍔★紝榛樿鐩爣涓?`http://localhost:8080`銆?- `VITE_USE_MOCK=false` 鏄叧闂?Mock 鐨勫敮涓€绾﹀畾锛涘叾浠栧€煎潎瑙嗕负缁х画浣跨敤 Mock銆?- service 灞傚繀椤诲鐞嗗悗绔?`ApiResponse<T>` 涓?`PageResponse<T>`锛岄〉闈笉寰楃洿鎺ヤ緷璧栧悗绔搷搴斿澹炽€?- 杩愯鎬佽仈璋冭剼鏈粺涓€鏀惧湪 `scripts/api-smoke/`锛屾柊澧炴帴鍙ｅ簲鍚屾琛ュ厖 smoke 璇锋眰銆?
### 11.3 瀹夊叏涓庨厤缃害鏉?
- 鏁版嵁搴撱€丷edis銆丮inIO銆丄I Provider Key 绛夎繍琛屾椂鏁忔劅閰嶇疆鍙兘閫氳繃鐜鍙橀噺鎴栨湰鏈哄畨鍏ㄩ厤缃敞鍏ワ紝涓嶅緱鍐欏叆浠撳簱銆?- API smoke 绀轰緥涓笉寰楀寘鍚湡瀹?AI API Key锛涢渶瑕佹祴璇?AI 鑳藉姏鏃朵娇鐢ㄨ皟鐢ㄨ€呮湰鏈虹幆澧冨彉閲忋€?
## Iteration 13 琛ュ厖锛欰uth API

| 浼樺厛绾?| 鏂规硶 | 璺緞 | 璇存槑 |
| --- | --- | --- | --- |
| P0 | GET | `/api/v1/auth/me` | 鑾峰彇寮€鍙戞€佸綋鍓嶇敤鎴枫€佽鑹层€佸鐢熻韩浠芥槧灏勩€?|

寮€鍙戞€侀壌鏉冭姹傚ご锛?- `X-MindMark-User-Id`锛氶粯璁?`u-teacher-001`銆?- `X-MindMark-Roles`锛氶粯璁?`TEACHER,TA,ADMIN,STUDENT`銆?
鍓嶇鐜鍙橀噺锛?- `VITE_USE_MOCK=false`锛氬惎鐢ㄧ湡瀹炴帴鍙ｆā寮忋€?- `VITE_API_PROXY_TARGET=http://localhost:18080`锛歏ite 浠ｇ悊鍒版祴璇曞悗绔€?- `VITE_AUTH_USER_ID`銆乣VITE_AUTH_ROLES`銆乣VITE_AUTH_STUDENT_ID`锛氭湰鍦拌仈璋冪敤浜庤鐩栨紨绀鸿韩浠姐€?
## Iteration 14 API 瑙勮寖琛ュ厖锛氬紑鍙戦樁娈?Auth 鍗犱綅

- 璁よ瘉 Header锛氬墠绔湡瀹炴帴鍙ｆā寮忎紭鍏堝彂閫?`Authorization: Bearer dev-token-{userId}`銆?- 鍏煎 Header锛歚X-MindMark-User-Id`銆乣X-MindMark-Roles` 浠呴檺寮€鍙戣皟璇曚娇鐢紝姝ｅ紡鐜涓嶅緱渚濊禆銆?- 鐧诲綍鍝嶅簲锛氱粺涓€浣跨敤 `ApiResponse<LoginData>`锛屽叾涓?`LoginData` 鍖呭惈 `token` 涓?`user`銆?- 鐧诲嚭鍝嶅簲锛氱粺涓€浣跨敤 `ApiResponse<{ success: true }>`銆?- 閿欒鐮侊細鏃犳晥 token / 鐧诲綍澶辫触浣跨敤 `MM-401-001`锛涚鐢ㄧ敤鎴蜂娇鐢?`MM-403-001`銆?## Iteration 16 鏇存柊锛氭寮忛壌鏉?Header 瑙勮寖

- 姝ｅ紡/鐪熷疄鎺ュ彛妯″紡鍙厑璁镐娇鐢?`Authorization: Bearer <Sa-Token>` 琛ㄨ揪鐧诲綍鎬併€?- `X-MindMark-User-Id`銆乣X-MindMark-Roles` 灞炰簬鍘嗗彶寮€鍙戣仈璋?Header锛屼笉鍐嶄綔涓哄悗绔寮忛壌鏉冨绾︼紝鍓嶇鐪熷疄鎺ュ彛妯″紡涓嶅緱缁х画娉ㄥ叆銆?- `dev-token-{userId}` 灞炰簬 Iteration 14/15 鍘嗗彶鍗犱綅鏍煎紡锛屼笉鍐嶇鍙戯紱OpenAPI 绀轰緥宸叉敼涓?Sa-Token 涓嶉€忔槑 UUID銆?- 鍙椾繚鎶ゆ帴鍙ｇ粺涓€杩斿洖 `MM-401-001`锛堟湭鐧诲綍/浼氳瘽杩囨湡锛夋垨 `MM-403-001`锛堣鑹蹭笉瓒?鏁版嵁鑼冨洿瓒婃潈锛夈€?## Iteration 17 API 琛ュ厖锛氱鐞嗗憳璐﹀彿娌荤悊

鏈疆鏂板鎺ュ彛鍧囦綅浜?`/api/v1/admin/**`锛屽繀椤绘惡甯?Sa-Token Bearer Token 涓斿叿澶?`ADMIN` 瑙掕壊銆?
| 鏂规硶 | 璺緞 | 璇存槑 |
| --- | --- | --- |
| GET | `/api/v1/admin/users` | 鍒嗛〉鏌ヨ璐﹀彿锛屾敮鎸?`keyword`銆乣role`銆乣status`銆乣page`銆乣pageSize`銆?|
| PATCH | `/api/v1/admin/users/{userId}/status` | 鍚敤/绂佺敤璐﹀彿锛涚鐢ㄥ悗娉ㄩ攢璇ヨ处鍙蜂細璇濄€?|
| PUT | `/api/v1/admin/users/{userId}/roles` | 鏇挎崲鐢ㄦ埛瑙掕壊锛涚姝㈢鐞嗗憳绉婚櫎鑷韩 `ADMIN`銆?|
| POST | `/api/v1/admin/users/{userId}/unlock` | 娓呯┖澶辫触娆℃暟骞惰В闄や复鏃堕攣瀹氥€?|
| GET | `/api/v1/admin/users/{userId}/class-assignments` | 鏌ヨ鏁欏笀/鍔╂暀鐝骇鎺堟潈銆?|
| POST | `/api/v1/admin/users/{userId}/class-assignments` | 鍒涘缓鎴栨洿鏂扮彮绾ф巿鏉冿紝`assignmentRole=OWNER/ASSISTANT`銆?|
| DELETE | `/api/v1/admin/users/{userId}/class-assignments/{assignmentId}` | 鍒犻櫎鐝骇鎺堟潈銆?|
| GET | `/api/v1/admin/audit-logs` | 鍒嗛〉鏌ヨ瀹夊叏瀹¤鏃ュ織锛屾敮鎸?`actorId`銆乣targetUserId`銆乣action`銆乣result`銆?|

OpenAPI 闈欐€佸绾?`apps/mindmark-server/openapi/mindmark-api.yaml` 宸插悓姝ユ柊澧?`AdminUser`銆乣ClassAssignment`銆乣AuthAuditLog` 绛?Schema銆?## Round 1 API 绾﹀畾锛氳绋?鐝骇涓庣櫥褰曟€佸鐢熻韩浠斤紙2026-07-18锛?
### 鍩虹鏁版嵁鎺ュ彛

- `GET /api/v1/classes`锛氳繑鍥炲綋鍓嶇櫥褰曠敤鎴峰彲瑙佺彮绾с€侫DMIN 杩斿洖鍏ㄩ儴 ACTIVE 鐝骇锛汿EACHER/TA 杩斿洖鎺堟潈鐝骇锛汼TUDENT 杩斿洖鏈汉鐝骇銆?- `GET /api/v1/admin/courses`銆乣POST /api/v1/admin/courses`銆乣PATCH /api/v1/admin/courses/{courseId}`锛氱鐞嗗憳缁存姢璇剧▼銆?- `GET /api/v1/admin/classes`銆乣POST /api/v1/admin/classes`銆乣PATCH /api/v1/admin/classes/{classId}`锛氱鐞嗗憳缁存姢鏁欏鐝骇銆?
### 瀛︾敓绔帴鍙ｅ彉鏇?
- `GET /api/v1/student/exams` 涓嶅啀鎺ユ敹 `studentId`锛屽悗绔粠 Sa-Token 鐧诲綍鎬佽В鏋愬綋鍓嶅鐢熸。妗堛€?- `GET /api/v1/answer-sheets/by-exam/{examId}` 涓嶅啀鎺ユ敹 `studentId`锛屽悗绔粎杩斿洖褰撳墠瀛︾敓鏈汉绛斿嵎銆?- `GET /api/v1/student/score-reports` 涓嶅啀鎺ユ敹 `studentId`锛屽悗绔粎杩斿洖褰撳墠瀛︾敓鏈汉鎴愮哗銆?
### 鏉冮檺閿欒

- 鐝骇涓嶅瓨鍦ㄦ垨宸插仠鐢細`MM-404-001` 鎴?`MM-409-001`銆?- 瓒婃潈璁块棶鐝骇/鑰冭瘯/绛斿嵎/鎴愮哗锛歚MM-403-001`銆?

## Round 2 API 约定：考试状态机、时间窗口与幂等（2026-07-18）

- `Exam.status` 枚举补充 `GRADING`：`DRAFT / SCHEDULED / ONGOING / ENDED / GRADING / SCORES_PUBLISHED`。
- `GET /api/v1/exams`、`GET /api/v1/exams/{examId}`、`GET /api/v1/student/exams` 会在事务内刷新时间驱动状态。
- `PUT /api/v1/answer-sheets/{answerSheetId}/draft` 请求体新增 `expectedVersion?: integer`：
  - 未传时兼容旧客户端；
  - 已传时必须等于服务端当前 `answer_sheet.version`；不一致返回 `409 CONFLICT`。
- `PUT /api/v1/answer-sheets/{answerSheetId}/draft` 和 `POST /api/v1/answer-sheets/{answerSheetId}/submit` 均要求当前学生拥有该答卷，且考试处于 `[startAt, endAt)` 答题窗口。
- `POST /api/v1/answer-sheets/{answerSheetId}/submit` 具备幂等语义：重复提交已提交/批改中/已批改答卷，不重复生成批改任务。
- `POST /api/v1/exams/{examId}/publish-scores` 在仍存在未复核批改任务时返回 `409 CONFLICT`，避免部分发布。
## Round 3 API 契约补充：超时与缺考

- `AnswerSheet.status` enum 增加 `ABSENT`，仍保留 `DRAFT`、`SUBMITTED`、`GRADING`、`GRADED`。
- `StudentExam.answerStatus` enum 增加 `ABSENT`，学生考试列表用于直接展示缺考。
- `GET /api/v1/student/exams`、`GET /api/v1/answer-sheets/{id}`、`GET /api/v1/answer-sheets/by-exam/{examId}` 在读取时允许触发生命周期刷新。
- `PUT /api/v1/answer-sheets/{id}/draft` 在超时后返回最终状态；有草稿可进入提交/批改流，无草稿返回 `ABSENT`。
- `POST /api/v1/answer-sheets/{id}/submit` 保持幂等；若答卷已进入 `GRADING/GRADED/ABSENT`，直接返回当前状态。
- OpenAPI 以 `apps/mindmark-server/openapi/mindmark-api.yaml` 为准，契约测试需校验 `ABSENT` 枚举存在。

## Round 4 API：复盘分析、AI 讲评稿与导出产物

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/exams/reviews` | 查询当前教师班级范围内的考试复盘列表 |
| GET | `/api/v1/exams/{examId}/review` | 查询单场考试复盘分析，若无讲评稿则生成初始草稿 |
| POST | `/api/v1/exams/{examId}/lecture-draft/regenerate` | 基于最新批改数据重新生成 AI 讲评稿，状态为 `REVIEWING` |
| POST | `/api/v1/exams/{examId}/lecture-draft/approve` | 教师确认讲评稿，可提交 `teacherEditedContent` |
| POST | `/api/v1/exams/{examId}/review-artifacts` | 生成并上传导出产物，请求体包含 `artifactType` |
| GET | `/api/v1/review-artifacts/{artifactId}/download` | 获取产物元数据和短期下载 URL |

所有接口继续使用统一 `ApiResponse<T>`；权限边界复用班级范围检查，学生端不开放考试复盘管理接口。

## API 契约补充：课程可见列表与题库课程筛选（2026-07-19）

- `GET /api/v1/courses`：返回当前登录用户可见的 ACTIVE 课程列表；ADMIN 返回全部 ACTIVE 课程，教师/助教/学生基于可见班级反查课程。
- `GET /api/v1/questions`：新增查询参数 `courseId`，用于按课程过滤题库题目。
- `Question.difficulty` 五级枚举：`VERY_EASY`、`EASY`、`MEDIUM`、`HARD`、`VERY_HARD`。
- `Question` 响应新增 `courseId`、`courseName` 字段；AI 出题生成请求新增 `courseId`。
