# 19 鍚庣鎺ュ彛濂戠害鍑嗗

## 1. 鏂囨。鐩殑

鏈枃妗ｆ壙鎺?Iteration 6锛岀敤浜庢妸褰撳墠 `apps/mindmark-web` 鐨勫墠绔?Mock 闂幆鏄犲皠涓哄悗缁悗绔帴鍙ｅ绾︼紝纭繚 Phase 2 鍒涘缓 `apps/mindmark-server` 鏃跺彲浠ユ寜宸叉湁椤甸潰銆佺被鍨嬪拰 service 鍒嗗眰閫愭鏇挎崲 Mock 瀹炵幇銆?
## 2. 褰撳墠缁撹

- 褰撳墠浠嶄笉鍒涘缓鍚庣椤圭洰锛屼笉鍦ㄦ牴鐩綍鍒涘缓涓氬姟 `src/`銆?- 鍚庣鍑嗗宸ヤ綔浠呴檺鎺ュ彛濂戠害銆侀鍩熻竟鐣屻€佽縼绉讳紭鍏堢骇鍜屽墠绔浛鎹㈢偣姊崇悊銆?- 鍓嶇椤甸潰缁х画鍙皟鐢?`src/services/*`锛岄〉闈笉寰楃洿鎺ヤ緷璧栧悗绔?URL 鎴?Mock 鏁版嵁鏂囦欢銆?- 鍚庣画鐪熷疄鎺ュ彛鍝嶅簲蹇呴』閬靛惊 `08_API璁捐瑙勮寖.md` 鐨勭粺涓€鍝嶅簲缁撴瀯銆侀敊璇爜鍜岄壌鏉冪害瀹氥€?
## 3. 鑰冭瘯闂幆鎺ュ彛浼樺厛绾?
| 浼樺厛绾?| 鑼冨洿 | 璇存槑 |
| --- | --- | --- |
| P0 | 棰樺簱銆佽瘯鍗枫€佽€冭瘯銆佺瓟鍗枫€佹壒鏀广€佹垚缁?| 鏀拺鑰冭瘯闂幆蹇呴』浼樺厛杩佺Щ銆?|
| P1 | AI 鍑洪銆佸鐩樻姤鍛娿€丄I 璁茶瘎绋?| 褰卞搷浣撻獙鍜屾櫤鑳藉寲鑳藉姏锛屽湪鏍稿績闂幆鍚庤縼绉汇€?|
| P2 | 閫氱煡銆佺敵璇夈€佸鍑恒€佸璁℃煡璇?| 鍚庣画瀹屽杽闃舵杩佺Щ銆?|

## 4. 鍓嶇 Mock Service 鍒版帴鍙ｆ槧灏?
| 鍓嶇 Service | 鍏抽敭鍑芥暟 | 鍚庣鎺ュ彛 | 浼樺厛绾?| 杩佺Щ璇存槑 |
| --- | --- | --- | --- | --- |
| `questionService` | `listQuestions` | `GET /api/v1/questions` | P0 | 鏀寔棰樺瀷銆侀毦搴︺€佺煡璇嗙偣銆佺姸鎬佺瓫閫夈€?|
| `aiQuestionService` | `generateAiQuestionDrafts` | `POST /api/v1/ai/question-generations` | P1 | 鍚庣闇€鍒涘缓 AI 璋冪敤璁板綍鍜屽€欓€夐瀹℃牳璁板綍銆?|
| `paperService` | `listPapers` | `GET /api/v1/papers` | P0 | 杩斿洖璇曞嵎鍒楄〃鍜岄鐩粨鏋勩€?|
| `paperService` | `addQuestionToPaper` | `POST /api/v1/papers/{paperId}/questions` | P0 | 鍚庣闇€鏍￠獙棰樼洰鐘舵€佷负鍙敤銆?|
| `paperService` | `removeQuestionFromPaper` | `DELETE /api/v1/papers/{paperId}/questions/{questionId}` | P0 | 宸茬粦瀹氬彂甯冭€冭瘯鐨勮瘯鍗峰簲绂佹鐩存帴淇敼銆?|
| `examService` | `createExam` | `POST /api/v1/exams` | P0 | 鍒涘缓鑰冭瘯骞剁粦瀹氳瘯鍗枫€佺彮绾у拰鏃堕棿銆?|
| `examService` | `listStudentExams` | `GET /api/v1/student/exams` | P0 | 浠呰繑鍥炲綋鍓嶅鐢熷彲瑙佽€冭瘯銆?|
| `examService` | `saveAnswerDraft` | `PUT /api/v1/answer-sheets/{id}/draft` | P0 | 闇€瑕佸箓绛夈€佽嚜鍔ㄤ繚瀛樺拰鏇存柊鏃堕棿銆?|
| `examService` | `submitAnswerSheet` | `POST /api/v1/answer-sheets/{id}/submit` | P0 | 鎻愪氦鍚庣瓟鍗蜂笉鍙慨鏀癸紝骞惰Е鍙戞壒鏀规祦绋嬨€?|
| `gradingService` | `listGradingTasks` | `GET /api/v1/grading-tasks` | P0 | 鏀寔鎸夎€冭瘯銆佺彮绾с€佺姸鎬佺瓫閫夈€?|
| `gradingService` | `reviewGradingTask` | `POST /api/v1/grading-tasks/{id}/review` | P0 | 璁板綍鏁欏笀澶嶆牳銆佸垎鏁拌皟鏁村拰璇勮銆?|
| `gradingService` | `publishExamScores` | `POST /api/v1/exams/{examId}/publish-scores` | P0 | 鍚庣闇€鏍￠獙鎵规敼瀹屾垚銆佸彂甯冩潈闄愬拰瀹¤銆?|
| `gradingService` | `listStudentScoreReports` | `GET /api/v1/student/score-reports` | P0 | 瀛︾敓浠呰兘璁块棶鑷繁鐨勬垚缁╁弽棣堛€?|
| `reviewService` | `listExamReviewReports` | `GET /api/v1/review-reports` | P1 | 鍚庣鍙敱缁熻浠诲姟鎴栧悓姝ユ煡璇㈢敓鎴愩€?|
| `reviewService` | `regenerateLectureDraft` | `POST /api/v1/review-reports/{examId}/lecture-draft/regenerate` | P1 | 瑙﹀彂 AI 璁茶瘎绋跨敓鎴愬苟璁板綍椋庨櫓鏍囩銆?|
| `reviewService` | `approveLectureDraft` | `POST /api/v1/review-reports/{examId}/lecture-draft/approve` | P1 | 鏁欏笀纭鍚庤繘鍏ュ凡纭鐘舵€併€?|

## 5. 鍚庣妯″潡寤鸿

Phase 2 鍚庣涓绘湇鍔″缓璁噰鐢ㄦā鍧楀寲鍗曚綋锛屼紭鍏堟ā鍧楀涓嬶細

```text
auth / rbac / audit / question-bank / paper / exam / answer / grading / score / review / ai-provider
```

| 妯″潡 | 鏍稿績鑱岃矗 |
| --- | --- |
| auth / rbac | 鐧诲綍銆佺敤鎴疯韩浠姐€佽鑹叉潈闄愩€佹暀甯?/ 瀛︾敓鏁版嵁闅旂銆?|
| audit | 璁板綍缁勫嵎銆佸彂甯冦€佷氦鍗枫€佸鏍搞€佹垚缁╁彂甯冦€丄I 璁茶瘎绋跨‘璁ょ瓑鍏抽敭鎿嶄綔銆?|
| question-bank | 棰樼洰銆佺煡璇嗙偣銆侀搴撹寖鍥村拰 AI 鍊欓€夐鍏ュ簱銆?|
| paper | 璇曞嵎銆佽瘯鍗烽鐩€佸垎鍊笺€佽瘯鍗烽攣瀹氥€?|
| exam | 鑰冭瘯閰嶇疆銆佽€冭瘯鐘舵€併€佺彮绾у弬涓庤寖鍥淬€?|
| answer | 绛斿嵎銆佽崏绋裤€佷氦鍗枫€佺瓟棰樺揩鐓с€?|
| grading | 鑷姩鎵规敼銆丄I 棰勬壒鏀广€佹暀甯堝鏍搞€?|
| score | 鎴愮哗姹囨€汇€佸彂甯冦€佸鐢熸垚缁╁弽棣堛€?|
| review | 鑰冭瘯澶嶇洏銆佺煡璇嗙偣璇婃柇銆佸鐢熷垎灞傘€佽璇勭銆?|
| ai-provider | AI Provider 鎶借薄銆佽皟鐢ㄥ璁°€佸け璐ュ厹搴曘€?|

## 6. 鍓嶇杩佺Щ瑙勫垯

1. 椤甸潰缁勪欢淇濇寔璋冪敤 service锛屼笉鐩存帴璋冪敤 HTTP client銆?2. 姣忎釜 service 鍑芥暟搴斿厛涓庢湰鏂囨。涓殑鎺ュ彛濂戠害寤虹珛涓€涓€瀵瑰簲鍏崇郴銆?3. 鍚庣鎺ュ彛鍙敤鍚庯紝浼樺厛鏇挎崲 service 鍐呴儴瀹炵幇锛屼繚鎸?Vue 椤甸潰鍜岀被鍨嬩笉澶ф敼銆?4. P0 鎺ュ彛杩佺Щ鏃跺繀椤昏ˉ榻愰敊璇姸鎬併€佸姞杞界姸鎬併€佺┖鐘舵€佸拰鍏抽敭鎿嶄綔浜屾纭銆?5. AI 鐩稿叧 P1 鎺ュ彛杩佺Щ鏃跺繀椤讳繚鐣欎汉宸ュ鏍搞€佺疆淇″害銆侀闄╂爣绛惧拰瀹¤瀛楁銆?
## 7. Phase 2 鍚姩鍓嶆鏌ユ竻鍗?
- [ ] `08_API璁捐瑙勮寖.md` 宸茶鐩栨墍鏈?P0 鎺ュ彛銆?- [ ] `07_棰嗗煙妯″瀷涓庢暟鎹瓧鍏?md` 宸茶鐩栨帴鍙ｈ姹?/ 鍝嶅簲鏍稿績瀛楁銆?- [ ] `09_鏉冮檺涓庡畨鍏ㄨ璁?md` 宸茶鐩栨暀甯堛€佸鐢熴€佺鐞嗗憳鏁版嵁闅旂銆?- [ ] `10_AI鑳藉姏涓庝汉宸ュ鏍歌鑼?md` 宸茶鐩?AI 鍑洪銆丄I 鎵规敼銆丄I 璁茶瘎绋裤€?- [ ] 鍓嶇 `src/services/*` 宸叉湁鏄庣‘鍚庣鏇挎崲鐐广€?- [ ] 鍏抽敭鎿嶄綔宸叉湁浜屾纭鍜屾搷浣滅粨鏋滄彁绀恒€?- [ ] 鍚庣椤圭洰鍒涘缓鍓嶄粛閬靛畧鏍圭洰褰曚笉鍐欎笟鍔?`src` 鐨勭害鏉熴€?

## 8. Iteration 7 濂戠害钀藉湴鐘舵€?
Iteration 7 宸插皢鏈枃妗ｄ腑鐨?P0/P1 鎺ュ彛鏄犲皠钀藉湴涓洪潤鎬?OpenAPI 鏂囦欢锛?
```text
apps/mindmark-server/openapi/mindmark-api.yaml
```

褰撳墠鐘舵€侊細

- P0锛氶搴撱€佽瘯鍗枫€佽€冭瘯銆佺瓟鍗枫€佹壒鏀广€佹垚缁╂帴鍙ｈ矾寰勫凡杩涘叆 OpenAPI銆?- P1锛欰I 鍑洪銆佸鐩樻姤鍛娿€丄I 璁茶瘎绋挎帴鍙ｈ矾寰勫凡杩涘叆 OpenAPI銆?- 鍚庣涓氬姟瀹炵幇宸蹭粠 Iteration 8 寮€濮嬶細棰樺簱涓庣粍鍗?P0 鎺ュ彛宸茶浆涓?Controller / Service / Repository / JPA Entity 瀹炵幇銆?- 鍓嶇浠嶄繚鎸?Mock service锛涚湡瀹?HTTP client 鍒囨崲搴旂瓑鍚庣 P0 鎺ュ彛瀹屾垚鍚庡垎鎵硅繘琛屻€?

## 9. Iteration 8 P0 鎺ュ彛瀹炵幇鐘舵€?
宸插疄鐜板苟涓?OpenAPI 濂戠害瀵归綈鐨勯鎵规帴鍙ｏ細

| 鍓嶇 Service | 鍚庣鎺ュ彛 | 瀹炵幇鐘舵€?| 璇存槑 |
| --- | --- | --- | --- |
| `questionService.listQuestions` | `GET /api/v1/questions` | 宸插疄鐜?| 鏀寔鍒嗛〉銆佸叧閿瘝銆侀鍨嬨€侀毦搴︺€佺姸鎬併€佹潵婧愩€佺煡璇嗙偣绛涢€夈€?|
| `paperService.listPapers` | `GET /api/v1/papers` | 宸插疄鐜?| 鏀寔鍒嗛〉銆佸叧閿瘝绛涢€夛紝杩斿洖璇曞嵎鍙婇鐩粨鏋勩€?|
| `paperService.addQuestionToPaper` | `POST /api/v1/papers/{paperId}/questions` | 宸插疄鐜?| 鏍￠獙璇曞嵎鍙紪杈戙€侀鐩瓨鍦ㄤ笖涓?`ACTIVE`銆佷笉鍙噸澶嶆坊鍔犮€?|
| `paperService.removeQuestionFromPaper` | `DELETE /api/v1/papers/{paperId}/questions/{questionId}` | 宸插疄鐜?| 鏍￠獙璇曞嵎鍙紪杈戯紝鍒犻櫎鍚庨噸鎺掗搴忓苟閲嶇畻鎬诲垎銆?|

鍓嶇鍒囨崲寤鸿锛氫笅涓€闃舵涓嶈涓€娆℃€ф浛鎹㈠叏閮?Mock锛涘厛鍦?service 灞傚鍔?HTTP client 鍒嗘敮鍜屽垎椤甸€傞厤锛屽啀閫愰〉鍒囨崲缁勫嵎椤点€?

## 10. Iteration 9 P0 鎺ュ彛瀹炵幇鐘舵€?
| 鍓嶇鏈嶅姟鎰忓浘 | 鍚庣鎺ュ彛 | 鐘舵€?| 璇存槑 |
| --- | --- | --- | --- |
| `examService.createExam` | `POST /api/v1/exams` | 宸插疄鐜?| 鍩轰簬璇曞嵎鍒涘缓鑰冭瘯锛屽苟鐢熸垚 Mock 鍙備笌瀛︾敓涓庡垵濮嬬瓟鍗枫€?|
| `studentExamService.listExams` | `GET /api/v1/student/exams` | 宸插疄鐜?| 閴存潈鏈疄鐜板墠榛樿鏌ヨ `student-001`锛屾敮鎸?`studentId` 浣滀负鑱旇皟鍙傛暟銆?|
| `answerService.saveDraft` | `PUT /api/v1/answer-sheets/{answerSheetId}/draft` | 宸插疄鐜?| 淇濆瓨 JSON 绛旀锛屾牎楠岀瓟鍗蜂负 `DRAFT` 涓旈鐩睘浜庤€冭瘯璇曞嵎銆?|
| `answerService.submit` | `POST /api/v1/answer-sheets/{answerSheetId}/submit` | 宸插疄鐜?| 灏嗙瓟鍗锋彁浜や负 `SUBMITTED`锛岄樆姝㈤噸澶嶆彁浜ゅ拰鎻愪氦鍚庣户缁繚瀛樸€?|

## Iteration 10 澧為噺锛氭壒鏀逛笌鎴愮哗鎺ュ彛濂戠害钀藉湴

### 鏂板鍚庣鎺ュ彛

- `GET /api/v1/grading-tasks`锛氭暀甯堟壒鏀逛换鍔″垪琛紝鏀寔 `examId` 杩囨护銆?- `GET /api/v1/grading-tasks/{gradingTaskId}`锛氭壒鏀逛换鍔¤鎯咃紝鍖呭惈棰樼洰鏄庣粏銆?- `POST /api/v1/grading-tasks/{gradingTaskId}/auto-grade`锛氬瑙傞鑷姩鎵规敼銆?- `POST /api/v1/grading-tasks/{gradingTaskId}/review`锛氭暀甯堢‘璁ゆ渶缁堝垎涓庤瘎璇€?- `GET /api/v1/exams/{examId}/scores`锛氳€冭瘯鎴愮哗姹囨€汇€?- `POST /api/v1/exams/{examId}/publish-scores`锛氬彂甯冩垚缁╂姤鍛娿€?- `GET /api/v1/student/score-reports`锛氬鐢熸垚缁╂姤鍛婂垪琛紝P0 鏀寔 `studentId` 鏌ヨ鍙傛暟渚夸簬鑱旇皟銆?
### 濂戠害娉ㄦ剰浜嬮」

- `GradingTask.status` 浣跨敤 `PENDING`銆乣AI_CHECKED`銆乣REVIEWED`銆?- 鎴愮哗鍙戝竷浠呭鐞?`REVIEWED` 涓斿瓨鍦?`finalScore` 鐨勪换鍔°€?- `ScoreReport` 鏄彂甯冨揩鐓э紝涓嶇瓑鍚屼簬瀹炴椂鎵规敼浠诲姟銆?

## 11. Iteration 11锛氬墠绔湡瀹炴帴鍙ｅ垏鎹㈡槧灏勪笌濂戠害缂哄彛

### 11.1 宸茶繘鍏ョ湡瀹炴帴鍙ｆā寮忕殑 P0 閾捐矾

| 鍓嶇 Service | 鍚庣鎺ュ彛 | 鏈疆鐘舵€?| 璇存槑 |
| --- | --- | --- | --- |
| `questionService.listQuestions` | `GET /api/v1/questions` | 宸叉帴鍏?| 鏀寔 page/pageSize 涓庨鍨嬨€侀毦搴︺€佺姸鎬佺瓑绛涢€夊弬鏁伴€傞厤銆?|
| `paperService.listPapers` | `GET /api/v1/papers` | 宸叉帴鍏?| 鍓嶇灏嗗悗绔垎椤靛搷搴旈€傞厤涓洪〉闈㈠垪琛ㄦ暟鎹€?|
| `paperService.addQuestionToPaper` | `POST /api/v1/papers/{paperId}/questions` | 宸叉帴鍏?| 缁勫嵎娣诲姞棰樼洰鐪熷疄鎺ュ彛鍒嗘敮宸插彲璋冪敤銆?|
| `paperService.removeQuestionFromPaper` | `DELETE /api/v1/papers/{paperId}/questions/{questionId}` | 宸叉帴鍏?| 缁勫嵎绉婚櫎棰樼洰鐪熷疄鎺ュ彛鍒嗘敮宸插彲璋冪敤銆?|
| `examService.listExams` | `GET /api/v1/exams` | 鏈疆鏂板骞舵帴鍏?| 鏁欏笀绔€冭瘯鍒楄〃銆?|
| `examService.getExamById` | `GET /api/v1/exams/{examId}` | 鏈疆鏂板骞舵帴鍏?| 鏁欏笀绔€冭瘯璇︽儏锛屽墠绔細琛ュ厖鍏宠仈 paper 鏁版嵁銆?|
| `examService.createExam` | `POST /api/v1/exams` | 宸叉帴鍏?| 鍓嶇灏嗙彮绾у悕绉?鏍囪瘑閫傞厤涓哄悗绔?`classIds`銆?|
| `examService.listStudentExams` | `GET /api/v1/student/exams` | 宸叉帴鍏?| 鑱旇皟闃舵浣跨敤 `studentId=student-001`銆?|
| `examService.saveAnswerDraft` | `PUT /api/v1/answer-sheets/{answerSheetId}/draft` | 宸叉帴鍏?| 鍓嶇浼氬厛瑙ｆ瀽鎴栫紦瀛?`answerSheetId`銆?|
| `examService.submitAnswerSheet` | `POST /api/v1/answer-sheets/{answerSheetId}/submit` | 宸叉帴鍏?| 鎻愪氦鍓嶄細鍏堜繚瀛樺綋鍓嶈崏绋裤€?|
| `gradingService.listGradingTasks` | `GET /api/v1/grading-tasks`銆乣GET /api/v1/grading-tasks/{gradingTaskId}` | 宸叉帴鍏?| 鍒楄〃鍚庢寜浠诲姟鎷夊彇璇︽儏浠ユ弧瓒抽〉闈㈠睍绀恒€?|
| `gradingService.reviewGradingTask` | `POST /api/v1/grading-tasks/{gradingTaskId}/review` | 宸叉帴鍏?| 鍓嶇鍗曢瑕嗙洊姹囨€讳负浠诲姟绾ф渶缁堝垎涓庤瘎璇€?|
| `gradingService.listExamScoreSummaries` | `GET /api/v1/exams/{examId}/scores` | 宸叉帴鍏?| 鍓嶇鍏堣鍙栬€冭瘯鍒楄〃鍐嶆眹鎬绘垚缁┿€?|
| `gradingService.publishExamScores` | `POST /api/v1/exams/{examId}/publish-scores` | 宸叉帴鍏?| 鍙戝竷鎴愮哗鎶ュ憡銆?|
| `gradingService.listStudentScoreReports` | `GET /api/v1/student/score-reports` | 宸叉帴鍏?| 瀛︾敓鎴愮哗鍙嶉鍒楄〃銆?|

### 11.2 褰撳墠濂戠害缂哄彛

| 缂哄彛 | 褰撳墠鍓嶇闄嶇骇 | 寤鸿琛ラ綈鏂瑰紡 |
| --- | --- | --- |
| 缂哄皯 `GET /api/v1/papers/{paperId}` | 閫氳繃 `GET /api/v1/papers` 鍚庡湪鍓嶇鏌ユ壘 | 鍚庣琛ヨ鎯呮帴鍙ｅ苟杩斿洖瀹屾暣棰樼洰缁撴瀯銆?|
| 缂哄皯璇曞嵎鐘舵€佹祦杞帴鍙?| 鐪熷疄鎺ュ彛妯″紡涓?`updatePaperStatus` 鏆?no-op 骞堕噸鏂拌鍙栧垪琛?| 澧炲姞 `PATCH /api/v1/papers/{paperId}/status` 鎴栨槑纭彂甯?褰掓。鎺ュ彛銆?|
| 缂哄皯鎸夎€冭瘯涓庡鐢熷畾浣嶇瓟鍗风殑璇︽儏鎺ュ彛 | 鍓嶇浠庡鐢熻€冭瘯鍒楄〃缂撳瓨 `answerSheetId` | 澧炲姞 `GET /api/v1/exams/{examId}/answer-sheets/me` 鎴?`GET /api/v1/answer-sheets/{id}`銆?|
| 鎵规敼璇︽儏缂哄皯瀛︾敓鍘熷绛旀瀛楁 | 鎵规敼椤电湡瀹炴ā寮忔殏鏃犳硶瀹屾暣灞曠ず瀛︾敓浣滅瓟 | 鍦?`GradingTaskItemResponse` 涓ˉ鍏?answer content / normalized answer銆?|
| 鍗曢绾т汉宸ュ鏍告帴鍙ｇ己澶?| 鍓嶇灏嗗崟棰樺緱鍒嗘眹鎬讳负浠诲姟绾?finalScore/comment | 澧炲姞 item-level review DTO锛屾敮鎸侀鐩骇寰楀垎銆佽瘎璇笌瀹℃牳浜恒€?|

### 11.3 杩愯鎬佽仈璋冪姸鎬?
- 缂栬瘧涓庢祴璇曢棬绂佸凡閫氳繃锛歚pnpm server:compile`銆乣pnpm server:test`銆?- Spring Boot 鍚姩宸插皾璇曡繛鎺ユ湰鍦?PostgreSQL 涓庢墽琛?Flyway銆?- Iteration 12 宸蹭慨澶嶆湰鍦?PostgreSQL 鍑嵁锛氬紑鍙戠幆澧冧娇鐢?`MINDMARK_DB_PASSWORD=123456`锛屽悗绔仴搴锋鏌ヤ笌 P0 smoke 宸查€氳繃銆?- Redis 6379 涓?MinIO 9000/9001 宸茬敱鐢ㄦ埛璇存槑鍙敤锛涘綋鍓?P0 鑰冭瘯闂幆鏈緷璧?Redis/MinIO 鏁版嵁缁撴瀯锛屽凡瀹屾垚 API 绾?smoke銆?

## 12. Iteration 12锛氬墿浣欏绾﹁ˉ榻愪笌 Smoke 缁撴灉

### 12.1 宸茶ˉ榻愬绾?
| 濂戠害缂哄彛 | 琛ラ綈缁撴灉 | 瀵瑰簲鎺ュ彛 |
| --- | --- | --- |
| 璇曞嵎璇︽儏 | 宸茶惤鍦?| `GET /api/v1/papers/{paperId}` |
| 璇曞嵎鐘舵€佹祦杞?| 宸茶惤鍦?| `PATCH /api/v1/papers/{paperId}/status` |
| 鎸夎€冭瘯涓庡鐢熷畾浣嶇瓟鍗?| 宸茶惤鍦?| `GET /api/v1/answer-sheets/by-exam/{examId}?studentId=` |
| 鎵规敼璇︽儏涓殑瀛︾敓鍘熷绛旀 | 宸茶惤鍦?| `GradingItem.studentAnswer` |
| 鍗曢绾т汉宸ュ鏍?| 宸茶惤鍦?| `POST /api/v1/grading-tasks/{gradingTaskId}/items/{questionId}/review` |

### 12.2 Smoke 鎵ц缁撴灉

- 鏂板鑴氭湰锛歚scripts/api-smoke/run-exam-loop-smoke.ps1`銆?- 鏂板鍛戒护锛歚pnpm server:smoke`銆?- 宸查€氳繃閾捐矾锛氬仴搴锋鏌?鈫?棰樺簱鏌ヨ 鈫?璇曞嵎鍒楄〃/璇︽儏/鐘舵€?鈫?鍒涘缓鑰冭瘯 鈫?瀛︾敓鑰冭瘯鍒楄〃 鈫?绛斿嵎璇︽儏 鈫?淇濆瓨鑽夌 鈫?浜ゅ嵎 鈫?鐢熸垚鎵规敼浠诲姟 鈫?瀹㈣棰樿嚜鍔ㄦ壒鏀?鈫?鍗曢澶嶆牳 鈫?浠诲姟澶嶆牳 鈫?鎴愮哗姹囨€?鈫?鍙戝竷鎴愮哗 鈫?瀛︾敓鎴愮哗鎶ュ憡銆?
### 12.3 涓嬩竴杞绾﹀缓璁?
- 涓哄墠绔〉闈㈢骇鑱旇皟琛ュ厖鐧诲綍/瑙掕壊 Header 鎴栬交閲忛壌鏉冨崰浣嶅绾︼紝閬垮厤缁х画渚濊禆鍥哄畾鐢ㄦ埛銆?- 灏?API smoke 杈撳嚭绾冲叆 CI 鎴栨湰鍦颁竴閿獙鏀舵祦绋嬶紝鍚庣画鏂板鎺ュ彛蹇呴』鍚屾鏇存柊 `.http` 涓庤嚜鍔ㄥ寲鑴氭湰銆?
## Iteration 13 琛ュ厖锛氶壌鏉冨崰浣嶅绾?
### `GET /api/v1/auth/me`

鐢ㄩ€旓細寮€鍙戞€佽幏鍙栧綋鍓嶇敤鎴枫€佽鑹插拰瀛︾敓韬唤鏄犲皠锛屼负鍓嶇鐪熷疄鎺ュ彛妯″紡鎻愪緵缁熶竴鐧诲綍鎬佹潵婧愩€?
璇锋眰澶达細
| Header | 蹇呭～ | 璇存槑 |
| --- | --- | --- |
| `X-MindMark-User-Id` | 鍚?| 寮€鍙戞€佽鐩栧綋鍓嶇敤鎴?ID锛涢粯璁?`u-teacher-001`銆?|
| `X-MindMark-Roles` | 鍚?| 閫楀彿鍒嗛殧瑙掕壊锛屽 `TEACHER,TA,ADMIN,STUDENT`锛涙湭浼犳椂浣跨敤鏁版嵁搴撶敤鎴疯鑹层€?|

鍝嶅簲锛?```json
{
  "code": "0",
  "message": "Success",
  "data": {
    "id": "u-teacher-001",
    "name": "MindMark Demo Teacher",
    "email": "teacher@mindmark.local",
    "roles": ["ADMIN", "STUDENT", "TA", "TEACHER"],
    "status": "ACTIVE",
    "studentId": "student-001"
  }
}
```

绾︽潫锛氳鎺ュ彛浠呬负鐪熷疄閴存潈涓婄嚎鍓嶇殑鍗犱綅濂戠害锛屼笉鎻愪緵姝ｅ紡鐧诲綍銆乀oken 鏍￠獙鎴栨暟鎹殧绂讳繚璇併€?
## Iteration 14 濂戠害琛ュ厖锛氬紑鍙戦樁娈甸壌鏉冩渶灏忛棴鐜?
### 鏂板鎺ュ彛
| 鏂规硶 | 璺緞 | 璇存槑 | 褰撳墠鐘舵€?|
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | 浣跨敤婕旂ず璐﹀彿鎴?userId 鐧诲綍锛岃繑鍥炲紑鍙戦樁娈?bearer token 涓庡綋鍓嶇敤鎴?| 宸插疄鐜?|
| GET | `/api/v1/auth/me` | 浼樺厛瑙ｆ瀽 `Authorization: Bearer dev-token-*`锛屽叾娆″吋瀹瑰紑鍙?Header | 宸插寮?|
| POST | `/api/v1/auth/logout` | 鏃犵姸鎬佺櫥鍑哄崰浣嶏紝渚涘墠绔棴鐜皟鐢?| 宸插疄鐜?|

### 鍏抽敭绾﹀畾
- 鐧诲綍璇锋眰鏀寔 `{ username, password, userId }`锛屽綋鍓嶆紨绀鸿处鍙蜂负 `teacher@mindmark.local` / `dev-password`銆?- 鍝嶅簲 token 鏍煎紡涓?`dev-token-u-teacher-001`锛屼粎鐢ㄤ簬鏈湴寮€鍙戣仈璋冿紝涓嶄綔涓烘寮忓畨鍏ㄦ柟妗堛€?- OpenAPI 宸茶ˉ榻?`LoginRequest`銆乣LoginResponse`銆乣LogoutResponse`锛屽绾︽祴璇曞凡绾冲叆鏂█銆?- 鍚庣画姝ｅ紡閴存潈搴旀浛鎹负 Spring Security + 瀵嗙爜鍝堝笇 + JWT/Session + RBAC 鏉冮檺鎷︽埅銆?## Iteration 15 濂戠害鑽夋锛氳€冭瘯璐﹀彿浣撶郴

> 褰撳墠涓哄绾﹁崏妗堬紝姝ｅ紡瀹炵幇鍓嶉渶鍚屾 OpenAPI 涓庡墠绔?`apiContracts.ts`銆?
| 鏂规硶 | 璺緞 | 璇存槑 | 鏉冮檺 |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | 姝ｅ紡鐧诲綍锛氭牎楠?username/password锛岃繑鍥?token銆佸綋鍓嶇敤鎴蜂笌 `mustChangePassword`銆?| 鍏紑 |
| POST | `/api/v1/auth/change-password` | 褰撳墠鐢ㄦ埛淇敼瀵嗙爜锛涢娆＄櫥褰曞繀椤昏皟鐢ㄣ€?| 宸茬櫥褰曠敤鎴?|
| POST | `/api/v1/classes/{classId}/students/import` | 瀵煎叆瀛︾敓鍚嶅崟骞舵壒閲忓垱寤?鏇存柊瀛︾敓璐﹀彿銆?| TEACHER / TA / ADMIN |
| GET | `/api/v1/roster-import-tasks/{taskId}` | 鏌ヨ鍚嶅崟瀵煎叆浠诲姟缁撴灉涓庤绾ч敊璇€?| TEACHER / TA / ADMIN |
| GET | `/api/v1/classes/{classId}/students` | 鏌ョ湅鐝骇瀛︾敓璐﹀彿鍒楄〃涓庨娆℃敼瀵嗙姸鎬併€?| TEACHER / TA / ADMIN |
| POST | `/api/v1/students/{studentId}/reset-password` | 鏁欏笀/TA/绠＄悊鍛橀噸缃鐢熷瘑鐮侊紝骞惰缃笅娆＄櫥褰曞繀椤绘敼瀵嗐€?| TEACHER / TA / ADMIN |

### 鍏抽敭杩斿洖绾﹀畾
- `LoginResponse` 闇€鏂板 `mustChangePassword: boolean`銆?- 褰?`mustChangePassword=true` 鏃讹紝鍓嶇蹇呴』璺宠浆 `/auth/change-password`锛岀姝㈣繘鍏ヤ笟鍔￠〉闈€?- 閲嶇疆瀵嗙爜鎺ュ彛榛樿鎸夆€滃鍙峰悗 6 浣嶁€濈敓鎴愭柊瀵嗙爜骞朵粎杩斿洖鎿嶄綔缁撴灉锛涘鍚庣画鏀逛负涓存椂瀵嗙爜锛屼篃涓嶅緱鍦ㄦ棩蹇椾腑璁板綍鏄庢枃銆?

## Iteration 15 濂戠害琛ラ綈锛氳€冭瘯璐﹀彿浣撶郴 P0

### 鏂板/寮哄寲鎺ュ彛
| 鏂规硶 | 璺緞 | 璇存槑 | 鏉冮檺 |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | 浣跨敤 `username/password` 鏍￠獙鐧诲綍锛岃繑鍥?`token`銆佸綋鍓嶇敤鎴蜂笌 `mustChangePassword` | Public |
| POST | `/api/v1/auth/change-password` | 褰撳墠鐧诲綍鐢ㄦ埛淇敼瀵嗙爜锛屾垚鍔熷悗娓呴櫎棣栨鏀瑰瘑鏍囪 | Authenticated |
| GET | `/api/v1/student-roster-template` | 涓嬭浇瀛︾敓鍚嶅崟 CSV 瀵煎叆妯℃澘 | TEACHER/TA/ADMIN锛堝綋鍓?P0 鏈己鍒讹級 |
| POST | `/api/v1/classes/{classId}/students/import` | 鎵归噺瀵煎叆瀛︾敓骞跺垱寤鸿处鍙凤紱閲嶅瀛﹀彿/璐﹀彿璺宠繃 | TEACHER/TA/ADMIN |
| GET | `/api/v1/roster-import-tasks/{taskId}` | 鏌ヨ鍚嶅崟瀵煎叆浠诲姟缁撴灉涓庤绾ч敊璇?| TEACHER/TA/ADMIN |
| GET | `/api/v1/classes/{classId}/students` | 鏌ヨ鐝骇瀛︾敓璐﹀彿涓庨娆℃敼瀵嗙姸鎬?| TEACHER/TA/ADMIN |
| POST | `/api/v1/students/{studentId}/reset-password` | 灏嗗鐢熷瘑鐮侀噸缃负瀛﹀彿鍚?6 浣嶏紝骞惰姹備笅娆＄櫥褰曟敼瀵?| TEACHER/TA/ADMIN |

### 鍏抽敭濂戠害绾︽潫
- 瀛︾敓璐﹀彿鐢ㄦ埛鍚嶄负瀛﹀彿 `studentNo`銆?- 瀛﹀彿涓嶈冻 6 浣嶆椂涓嶅垱寤鸿处鍙凤紝骞惰繑鍥炶绾ч敊璇€?- 鍒濆瀵嗙爜涓庨噸缃瘑鐮佽鍒欏潎涓哄鍙峰悗 6 浣嶏紝浣嗘帴鍙ｄ笉杩斿洖鏄庢枃瀵嗙爜銆?- 宸插鍏ュ鐢熶笉浼氶噸澶嶅鍏ワ細鍚屼竴鎵规閲嶅鎴栨暟鎹簱宸插瓨鍦?`studentNo/username` 鏃惰鍏?`skippedCount`銆?- `LoginResponse.data.mustChangePassword=true` 鏃讹紝鍓嶇蹇呴』璺宠浆 `/auth/change-password` 骞堕樆姝㈣繘鍏ヤ笟鍔￠〉闈€?- OpenAPI 宸茶ˉ鍏?`ChangePasswordRequest/Response`銆乣StudentRosterImportRequest`銆乣RosterImportResponse`銆乣StudentAccountListResponse`銆乣ResetPasswordResponse`銆?

## Iteration 16 濂戠害琛ラ綈锛歋a-Token 閴存潈涓庤处鍙锋不鐞?
| 鏂规硶 | 璺緞 | 濂戠害鍙樺寲 | 鏉冮檺 |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | 鏍￠獙 `username/password` 鍚庡垱寤?Sa-Token 浼氳瘽锛岃繑鍥炰笉閫忔槑 `token`銆乣user`銆乣mustChangePassword`銆?| Public |
| POST | `/api/v1/auth/logout` | 娉ㄩ攢褰撳墠 Sa-Token 浼氳瘽锛孴oken 闅忓悗涓嶅彲缁х画璁块棶鍙椾繚鎶ゆ帴鍙ｃ€?| Authenticated |
| GET | `/api/v1/auth/me` | 浠呮牴鎹?`Authorization: Bearer <token>` 璇诲彇褰撳墠鐢ㄦ埛锛涘紑鍙?Header 涓嶅啀浣滀负姝ｅ紡濂戠害銆?| Authenticated |
| POST | `/api/v1/auth/change-password` | 鏂板瘑鐮佹渶灏?8 浣嶃€佸惈瀛楁瘝鍜屾暟瀛椼€佷笉寰椾笌鏃у瘑鐮?鐢ㄦ埛鍚?閭鐩稿悓銆?| Authenticated |
| GET | `/api/v1/student-roster-template` | 妯℃澘涓嬭浇绾冲叆缁熶竴鐧诲綍鎷︽埅銆?| ADMIN/TEACHER/TA |
| POST | `/api/v1/classes/{classId}/students/import` | 瑙掕壊閫氳繃鍚庣户缁牎楠屾暀甯?鍔╂暀鐝骇鎺堟潈锛涢噸澶嶅鐢熺户缁烦杩囥€?| ADMIN 鎴栬鎺堟潈 TEACHER/TA |
| GET | `/api/v1/classes/{classId}/students` | 澧炲姞鐝骇鑼冨洿鏍￠獙銆?| ADMIN 鎴栬鎺堟潈 TEACHER/TA |
| POST | `/api/v1/students/{studentId}/reset-password` | 閫氳繃瀛︾敓鎵€鍦ㄧ彮绾ф牎楠屾搷浣滆€呰寖鍥达紱閲嶇疆鍚庝粛寮哄埗棣栨鏀瑰瘑銆?| ADMIN 鎴栬鎺堟潈 TEACHER/TA |

閿欒绾﹀畾锛氭湭鐧诲綍/杩囨湡缁熶竴杩斿洖 `MM-401-001`锛岃鑹蹭笉瓒虫垨鐝骇瓒婃潈缁熶竴杩斿洖 `MM-403-001`銆侽penAPI 涓?`bearerFormat` 宸蹭粠 JWT 淇涓?`Sa-Token opaque UUID`銆?## Iteration 17 濂戠害琛ラ綈锛氱鐞嗗憳璐﹀彿娌荤悊

- 鏂板 Admin Tag锛氳处鍙锋不鐞嗘帴鍙ｇ粺涓€褰掑睘 `Admin`銆?- 鏂板璺緞锛歚/api/v1/admin/users`銆乣/api/v1/admin/users/{userId}/status`銆乣/api/v1/admin/users/{userId}/roles`銆乣/api/v1/admin/users/{userId}/unlock`銆乣/api/v1/admin/users/{userId}/class-assignments`銆乣/api/v1/admin/users/{userId}/class-assignments/{assignmentId}`銆乣/api/v1/admin/audit-logs`銆?- 鏂板 Schema锛歚AdminUser`銆乣AdminUserResponse`銆乣AdminUserPageResponse`銆乣UpdateUserStatusRequest`銆乣UpdateUserRolesRequest`銆乣ClassAssignment`銆乣ClassAssignmentRequest`銆乣ClassAssignmentResponse`銆乣ClassAssignmentListResponse`銆乣AuthAuditLog`銆乣AuthAuditLogPageResponse`銆乣BooleanResponse`銆?- 閿欒鐮佸鐢細鏈櫥褰?浼氳瘽澶辨晥 `MM-401-001`锛岃鑹蹭笉瓒?`MM-403-001`锛屽弬鏁伴敊璇?`MM-400-001`锛岃嚜閿佸啿绐?`MM-409-001`銆
## Round 2 契约补充：考试状态机与时间窗口（2026-07-18）

- `Exam.status` 增加 `GRADING`，OpenAPI 枚举同步为 `DRAFT / SCHEDULED / ONGOING / ENDED / GRADING / SCORES_PUBLISHED`。
- `SaveAnswerDraftRequest` 增加 `expectedVersion`，用于答卷草稿乐观并发控制。
- 答题写接口统一返回 `409 CONFLICT` 表达时间窗口不允许、答卷版本冲突、状态不允许等业务冲突。
- 提交答卷接口要求幂等：重复提交不得重复创建 `grading_task`。
## Round 3 契约补充：考试生命周期终态

| 契约项 | 变更 |
| --- | --- |
| `AnswerSheet.status` | 增加 `ABSENT`；`GRADING/GRADED` 继续表示已进入批改/已批完。 |
| `StudentExam.answerStatus` | 增加 `ABSENT`；`GRADING` 答卷在学生列表中归一为 `SUBMITTED`。 |
| 答卷保存 | 超时后不再允许继续改写答案，接口返回服务端 finalize 后状态。 |
| 答卷提交 | 幂等；已提交、批改中、已批改、缺考均返回当前状态。 |
| 批改任务 | 仅对有效提交答卷生成；缺考不生成批改任务。 |
| Smoke | `scripts/api-smoke/run-exam-loop-smoke.ps1` 覆盖登录态、正常闭环、超时自动提交、缺考。 |

## Round 4 契约补齐：Review / AI Lecture / Artifact

OpenAPI 已补充复盘分析、AI 讲评稿、导出产物路径和核心 Schema：`ExamReviewReportResponse`、`AiLectureDraftResponse`、`ReviewArtifactResponse`。后端契约测试已覆盖路径存在性，后续若引入或切换真实 OpenAI / Anthropic 调用，需要补充异步任务、失败重试、费用与模型输出审计字段。
## 2026-07-18 复盘产物二进制下载契约补充

### GET `/api/v1/review-artifacts/{artifactId}/file`
- 认证：`Authorization: Bearer <token>`。
- 权限：教师/助教/管理员需具备对应考试班级访问权限。
- 响应：二进制文件流，不包裹 `ApiResponse`。
- 响应头：
  - `Content-Type`：按产物类型返回，例如 `text/markdown; charset=utf-8` 或 `text/csv; charset=utf-8`。
  - `Content-Length`：文件字节数。
  - `Content-Disposition`：`attachment`，使用 UTF-8 filename 编码，支持中文文件名如 `*-AI讲评稿.md`。
- 典型错误：
  - `401`：未登录或 token 失效。
  - `403`：无考试班级访问权限。
  - `404`：产物不存在。

### 相关 JSON 契约
- `GET /api/v1/review-artifacts/{artifactId}/download` 仍返回 `ApiResponse<ReviewArtifactResponse>`，用于获取产物元数据和 MinIO presigned URL。
- 页面内优先使用 `/file` 完成受控下载；需要外链下载或调试时可使用 `downloadUrl`。

## 2026-07-18 学生成绩报告契约字段补齐

### GET `/api/v1/student/score-reports`
本轮将学生成绩反馈页需要的展示字段从前端硬编码迁移到后端契约，响应项在原有 `id`、`examId`、`examTitle`、`score`、`rank`、`weakKnowledgePoints`、`feedback`、`publishedAt` 基础上补充：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `courseName` | string | 课程名称，来自考试试卷信息；缺失时前端可回退为考试标题。 |
| `studentId` | string | 学生账号/学号标识。 |
| `studentName` | string | 学生姓名，用于成绩反馈页抬头展示。 |
| `className` | string | 班级展示名；当前后端按考试班级 ID 列表拼接，暂无班级名称时用 `-`。 |
| `totalScore` | number | 考试总分，用于前端计算与展示得分占比。 |

### 前后端约束
- 后端 `ScoreReportResponse`、`ScoreReportMapper`、`ScoreReportRepository` 与 OpenAPI `ScoreReport` schema 已同步更新。
- 前端 `gradingService.listStudentScoreReports` 已优先读取真实字段，避免继续使用硬编码学生名称、学生 ID 与默认总分。
- 后续若引入班级实体名称查询，应保持 `className` 对前端稳定，不要求前端理解班级 ID 到名称的转换。


## 契约补齐：题库课程维度与五级难度（2026-07-19）

- 后端新增 `GET /api/v1/courses`，供教师题库筛选与 AI 出题课程下拉使用。
- `GET /api/v1/questions` 支持 `courseId` 过滤；题目响应返回课程 ID 与课程名称快照。
- 数据库迁移 `V14__question_course_and_five_level_difficulty.sql`：为 `question` 表补充 `course_id/course_name`，并将难度约束扩展为五级。

## 2026-07-19 契约补齐：试卷课程 ID 与组卷课程一致性

- `Paper` schema 增加 `courseId`，与 `courseName` 一起返回。
- `Question.courseId/courseName` 从兼容展示字段收敛为必填字段，数据库侧通过 `V15` 迁移设置非空。
- `POST /api/v1/papers/{paperId}/questions` 语义补充：仅允许加入与试卷同课程的 ACTIVE 题目；跨课程或题目无课程归属返回 `409 CONFLICT`。
- `PATCH /api/v1/papers/{paperId}/status` 标记 `READY` 时会校验整卷题目课程一致性。
- 当前后端尚未提供题目创建/导入/AI 审核入库真实写接口；后续实现这些接口时必须要求 `courseId`，并根据课程表回填 `courseName`。
## 2026-07-19 契约补齐：题库写入、OpenAI/Anthropic Provider 与 LangGraph AI 生成

### 题库写入
- `POST /api/v1/questions`：教师/助教/管理员手工创建题目，写入 `source=MANUAL`、`status=ACTIVE`。
- `POST /api/v1/questions/import`：教师/助教/管理员批量导入题目，重复题按课程、题型、标题跳过并返回 `importedCount/skippedCount`。
- 写入请求统一使用 `QuestionCreateRequest`，要求 `courseId/title/type/difficulty/score/answer/analysis`。

### AI Provider 设置
- `GET /api/v1/ai/provider-settings?provider=OPENAI|ANTHROPIC`：读取当前登录教师指定 Provider 设置，只返回 `provider/providerLabel/configured/keyPreview/updatedAt`。
- `PUT /api/v1/ai/provider-settings`：保存当前登录教师指定 Provider 的 API Key；服务端加密保存，不返回明文。
- `/api/v1/ai/provider-settings/kimi` 仅作为旧前端兼容别名保留，不作为新开发入口。

### LangGraph AI 生成入库
- `POST /api/v1/ai/questions/generate`：根据 `courseId/provider/prompt/questionType/difficulty/count/knowledgePoint/requirement` 调用 LangGraph + OpenAI/Anthropic Provider，并将中文校验通过的结果持久化为待审核 AI 题目。
- Provider Key 解析顺序：当前教师个人配置 -> 对应 Provider 的全局环境变量（`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`）。
- OpenAPI 已新增 `AiQuestionGenerateRequest`、`AiProviderSettingRequest/Response`、`QuestionImportRequest/Response` 等 Schema。