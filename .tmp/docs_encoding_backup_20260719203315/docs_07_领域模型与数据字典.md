# 07 棰嗗煙妯″瀷涓庢暟鎹瓧鍏?

## 1. 棰嗗煙妯″瀷鎬昏

```text
User / Role / Permission
  鈹斺攢 Course / Class
       鈹溾攢 QuestionBank 鈫?Question 鈫?ScoringPoint
       鈹溾攢 Paper 鈫?PaperQuestion
       鈹斺攢 Exam 鈫?ExamParticipant 鈫?AnswerSheet 鈫?AnswerItem
              鈹溾攢 GradingTask
              鈹溾攢 ScoreReport
              鈹溾攢 Appeal
              鈹斺攢 ReviewReport
```

## 2. 鏍稿績瀹炰綋

### 2.1 User 鐢ㄦ埛

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| id | string | 鐢ㄦ埛 ID |
| name | string | 濮撳悕 |
| email | string | 閭 |
| roles | RoleCode[] | 瑙掕壊鍒楄〃 |
| status | UserStatus | 鐘舵€?|

### 2.2 Role 瑙掕壊

| 瑙掕壊缂栫爜 | 璇存槑 |
| --- | --- |
| ADMIN | 绠＄悊鍛?|
| TEACHER | 鏁欏笀 |
| TA | 鍔╂暀 |
| STUDENT | 瀛︾敓 |

### 2.3 Question 棰樼洰

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| id | string | 棰樼洰 ID |
| bankId | string | 鎵€灞為搴?|
| type | QuestionType | 棰樺瀷 |
| title | string | 棰樺共 |
| options | QuestionOption[] | 閫夐」锛屽瑙傞浣跨敤 |
| answer | string / string[] | 鏍囧噯绛旀鎴栧弬鑰冪瓟妗?|
| analysis | string | 瑙ｆ瀽 |
| score | number | 榛樿鍒嗗€?|
| difficulty | Difficulty | 闅惧害 |
| knowledgePoints | string[] | 鐭ヨ瘑鐐?|
| source | QuestionSource | 鏉ユ簮 |
| scoringPoints | ScoringPoint[] | 寰楀垎鐐?|
| status | QuestionStatus | 鐘舵€?|

### 2.4 AiQuestionDraft AI 鍑洪鍊欓€?

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| id | string | AI 鍊欓€夐 ID |
| title | string | 棰樺共 |
| type | QuestionType | 棰樺瀷 |
| difficulty | Difficulty | 闅惧害 |
| knowledgePoints | string[] | 鐭ヨ瘑鐐?|
| score | number | 寤鸿鍒嗗€?|
| answer | string / string[] | 鏍囧噯绛旀鎴栧弬鑰冪瓟妗?|
| analysis | string | AI 鐢熸垚瑙ｆ瀽 |
| options | QuestionOption[] | 閫夐」锛屽瑙傞浣跨敤 |
| scoringPoints | ScoringPoint[] | 涓昏棰?/ 缂栫▼棰樺緱鍒嗙偣 |
| confidence | number | AI 缃俊搴︼紝鑼冨洿 0 - 1 |
| riskCodes | AiRiskCode[] | 椋庨櫓鎻愮ず |
| reviewStatus | AiReviewStatus | 浜哄伐瀹℃牳鐘舵€?|
| model | string | 鐢熸垚妯″瀷鏍囪瘑 |
| generatedAt | datetime | 鐢熸垚鏃堕棿 |

### 2.5 ScoringPoint 寰楀垎鐐?

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| id | string | 寰楀垎鐐?ID |
| description | string | 寰楀垎鐐规弿杩?|
| score | number | 鍒嗗€?|
| keywords | string[] | 鍏抽敭璇嶆垨鍒ゅ畾渚濇嵁 |
| required | boolean | 鏄惁鍏抽敭寰楀垎鐐?|

### 2.6 Paper 璇曞嵎

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| id | string | 璇曞嵎 ID |
| title | string | 璇曞嵎鍚嶇О |
| courseId | string | 璇剧▼ ID |
| totalScore | number | 鎬诲垎 |
| questions | PaperQuestion[] | 璇曞嵎棰樼洰 |
| status | PaperStatus | 鐘舵€?|
| createdBy | string | 鍒涘缓浜?|

### 2.7 Exam 鑰冭瘯

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| id | string | 鑰冭瘯 ID |
| title | string | 鑰冭瘯鍚嶇О |
| courseId | string | 璇剧▼ ID |
| classIds | string[] | 鍙傝€冪彮绾?|
| paperId | string | 璇曞嵎 ID |
| startTime | datetime | 寮€濮嬫椂闂?|
| endTime | datetime | 缁撴潫鏃堕棿 |
| durationMinutes | number | 鏃堕暱 |
| status | ExamStatus | 鐘舵€?|
| antiCheatingLevel | AntiCheatingLevel | 闃蹭綔寮婄骇鍒?|
| settings | ExamSettings | 鑰冭瘯閰嶇疆 |

### 2.8 AnswerSheet 绛斿嵎

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| id | string | 绛斿嵎 ID |
| examId | string | 鑰冭瘯 ID |
| studentId | string | 瀛︾敓 ID |
| status | AnswerSheetStatus | 鐘舵€?|
| startedAt | datetime | 寮€濮嬫椂闂?|
| submittedAt | datetime | 鎻愪氦鏃堕棿 |
| totalScore | number | 鎬诲緱鍒?|
| answers | AnswerItem[] | 浣滅瓟鏄庣粏 |

### 2.9 GradingTask 鎵规敼浠诲姟

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| id | string | 浠诲姟 ID |
| examId | string | 鑰冭瘯 ID |
| answerSheetId | string | 绛斿嵎 ID |
| questionId | string | 棰樼洰 ID |
| type | GradingType | 鑷姩 / AI / 浜哄伐 |
| status | GradingStatus | 鐘舵€?|
| aiScore | number | AI 棰勮瘎鍒?|
| finalScore | number | 鏈€缁堝垎 |
| confidence | number | AI 缃俊搴?|
| comment | string | 璇勮 |
| reviewerId | string | 澶嶆牳浜?|


### 2.10 PaperQuestion 璇曞嵎棰樼洰

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| id | string | 璇曞嵎棰樼洰鍏宠仈 ID |
| questionId | string | 棰樼洰 ID |
| order | number | 璇曞嵎鍐呴『搴?|
| score | number | 鏈瘯鍗蜂腑璇ラ鍒嗗€?|
| question | Question | 棰樼洰蹇収锛涘墠绔?Mock 闃舵鐩存帴寮曠敤棰樼洰瀵硅薄锛屽悗绔樁娈靛簲淇濆瓨鍙戝竷蹇収 |

### 2.11 StudentAnswer 瀛︾敓浣滅瓟

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| questionId | string | 棰樼洰 ID |
| type | QuestionType | 棰樺瀷 |
| answer | string \| string[] | 瀛︾敓绛旀锛涘閫夐涓烘暟缁勶紝鍏朵綑棰樺瀷涓哄瓧绗︿覆 |

### 2.12 StudentExamSummary 瀛︾敓鑰冭瘯鎽樿

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| id | string | 鑰冭瘯 ID |
| title | string | 鑰冭瘯鍚嶇О |
| courseName | string | 璇剧▼鍚嶇О |
| timeRange | string | 鑰冭瘯鏃堕棿鑼冨洿 |
| durationMinutes | number | 鑰冭瘯鏃堕暱 |
| totalScore | number | 婊″垎 |
| status | StudentExamStatus | 瀛︾敓瑙嗚鑰冭瘯鐘舵€?|
| submittedAt | datetime | 鎻愪氦鏃堕棿锛涙湭鎻愪氦鏃朵负绌?|

### 2.13 QuestionGrade 鍗曢鎵规敼缁撴灉

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| questionId | string | 棰樼洰 ID |
| order | number | 棰樺彿 |
| maxScore | number | 鏈婊″垎 |
| studentAnswer | string \| string[] | 瀛︾敓绛旀 |
| referenceAnswer | string \| string[] | 鍙傝€冪瓟妗?|
| gradingMode | QuestionGradingMode | 鎵规敼妯″紡 |
| autoScore | number | 瀹㈣棰樿嚜鍔ㄥ垎 |
| aiSuggestedScore | number | AI 寤鸿鍒?|
| finalScore | number | 鏁欏笀澶嶆牳鍚庣殑鏈€缁堝垎 |
| aiConfidence | number | AI 棰勬壒鏀圭疆淇″害 |
| teacherComment | string | 鏁欏笀鎵规敞 |
| status | GradingTaskStatus | 鍗曢鎵规敼鐘舵€?|

### 2.14 GradingTask 鎵规敼浠诲姟

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| id | string | 鎵规敼浠诲姟 ID |
| examId | string | 鑰冭瘯 ID |
| studentId | string | 瀛︾敓 ID |
| studentName | string | 瀛︾敓濮撳悕蹇収 |
| className | string | 鐝骇鍚嶇О蹇収 |
| submittedAt | datetime | 浜ゅ嵎鏃堕棿 |
| totalScore | number | 婊″垎 |
| currentScore | number | 褰撳墠鎬诲垎锛涘彂甯冨墠浠呮暀甯堝彲瑙?|
| status | GradingTaskStatus | 鎵规敼浠诲姟鐘舵€?|
| questionGrades | QuestionGrade[] | 鍗曢鎵规敼缁撴灉 |
| reviewedAt | datetime | 澶嶆牳瀹屾垚鏃堕棿 |
| reviewer | string | 澶嶆牳浜?|

### 2.15 ExamScoreSummary 鑰冭瘯鎴愮哗姹囨€?

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| examId | string | 鑰冭瘯 ID |
| examTitle | string | 鑰冭瘯鍚嶇О |
| totalScore | number | 婊″垎 |
| participantCount | number | 搴旇€冧汉鏁?|
| submittedCount | number | 宸叉彁浜や汉鏁?|
| reviewedCount | number | 宸插鏍哥瓟鍗锋暟 |
| averageScore | number | 骞冲潎鍒?|
| highestScore | number | 鏈€楂樺垎 |
| lowestScore | number | 鏈€浣庡垎 |
| passRate | number | 鍙婃牸鐜?|
| publishStatus | ScorePublishStatus | 鍙戝竷鐘舵€?|
| publishedAt | datetime | 鍙戝竷鏃堕棿 |

### 2.16 StudentScoreReport 瀛︾敓鎴愮哗鍙嶉

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| id | string | 鎴愮哗鎶ュ憡 ID |
| examId | string | 鑰冭瘯 ID |
| studentId | string | 瀛︾敓 ID |
| totalScore | number | 婊″垎 |
| score | number | 鏈€缁堝緱鍒嗭紱鏈彂甯冩椂涓虹┖ |
| rank | number | 鎺掑悕锛涙湭寮€鏀炬椂涓虹┖ |
| status | ScorePublishStatus | 鍙戝竷鐘舵€?|
| teacherComment | string | 鏁欏笀鎬昏瘎 |
| knowledgeFeedback | KnowledgeFeedback[] | 鐭ヨ瘑鐐瑰弽棣?|
| questionResults | StudentScoreQuestionResult[] | 鍗曢寰楀垎鏄庣粏 |

## 3. 鏋氫妇

### 3.1 QuestionType

| 鍊?| 璇存槑 |
| --- | --- |
| SINGLE_CHOICE | 鍗曢€?|
| MULTIPLE_CHOICE | 澶氶€?|
| TRUE_FALSE | 鍒ゆ柇 |
| FILL_BLANK | 濉┖ |
| SHORT_ANSWER | 绠€绛?|
| PROGRAMMING | 缂栫▼ |

### 3.2 Difficulty

| 鍊?| 璇存槑 |
| --- | --- |
| EASY | 绠€鍗?|
| MEDIUM | 涓瓑 |
| HARD | 鍥伴毦 |

### 3.3 QuestionSource

| 鍊?| 璇存槑 |
| --- | --- |
| MANUAL | 鏁欏笀鎵嬪姩鍒涘缓 |
| AI | AI 鐢熸垚骞剁粡浜哄伐瀹℃牳 |
| IMPORT | 鎵归噺瀵煎叆 |

### 3.4 QuestionStatus

| 鍊?| 璇存槑 |
| --- | --- |
| DRAFT | 鑽夌 |
| PENDING_REVIEW | 寰呭鏍?|
| ACTIVE | 宸插叆搴?/ 鍙敤浜庣粍鍗?|
| DISABLED | 宸插仠鐢?|

### 3.5 AiReviewStatus

| 鍊?| 璇存槑 |
| --- | --- |
| PENDING | 寰呬汉宸ュ鏍?|
| ACCEPTED | 宸叉帴鍙楀叆搴?|
| EDITED_ACCEPTED | 缂栬緫鍚庡叆搴?|
| REJECTED | 宸叉嫆缁?|

### 3.6 AiRiskCode

| 鍊?| 璇存槑 |
| --- | --- |
| LOW_CONFIDENCE | 浣庣疆淇″害 |
| AMBIGUOUS_STEM | 棰樺共鐤戜技姝т箟 |
| ANSWER_NOT_UNIQUE | 绛旀鍙兘涓嶅敮涓€ |
| KNOWLEDGE_MISMATCH | 鐭ヨ瘑鐐瑰彲鑳戒笉鍖归厤 |
| SCORING_POINT_WEAK | 寰楀垎鐐瑰亸寮?|

### 3.7 AntiCheatingLevel

| 鍊?| 璇存槑 |
| --- | --- |
| L0 | 涓嶅惎鐢ㄩ槻浣滃紛闄愬埗 |
| L1 | 绂佸鍒?/ 鍙抽敭 / 鍏ㄥ睆绛夊熀纭€闄愬埗 |
| L2 | 鍒囧睆妫€娴?+ 棰樺簭 / 閫夐」闅忔満 |
| L3 | 涓ユ牸闃蹭綔寮婏紝褰撳墠鏆備笉瀹炵幇 |


### 3.8 PaperStatus

| 鍊?| 璇存槑 |
| --- | --- |
| DRAFT | 鑽夌 |
| READY | 鍙敤浜庤€冭瘯 |
| PUBLISHED | 宸插叧鑱旇€冭瘯 |
| ARCHIVED | 宸插綊妗?|

### 3.9 ExamStatus

| 鍊?| 璇存槑 |
| --- | --- |
| DRAFT | 鑽夌 |
| SCHEDULED | 宸插彂甯冩湭寮€濮?|
| IN_PROGRESS | 杩涜涓?|
| GRADING | 鎵规敼涓?|
| GRADED | 鎵规敼瀹屾垚寰呭彂甯?|
| PUBLISHED | 鎴愮哗宸插彂甯?|
| ARCHIVED | 宸插綊妗?|

### 3.10 AnswerSheetStatus

| 鍊?| 璇存槑 |
| --- | --- |
| NOT_STARTED | 鏈紑濮?|
| IN_PROGRESS | 绛旈涓?|
| SUBMITTED | 宸叉彁浜?|

### 3.11 StudentExamStatus

| 鍊?| 璇存槑 |
| --- | --- |
| NOT_STARTED | 鏈紑濮?|
| AVAILABLE | 鍙繘鍏ヨ€冭瘯 |
| SUBMITTED | 宸叉彁浜?|
| GRADED | 宸插嚭鍒?|

### 3.12 GradingTaskStatus

| 鍊?| 璇存槑 |
| --- | --- |
| PENDING | 寰呮壒鏀?|
| AI_GRADED | AI 宸查鎵癸紝绛夊緟鏁欏笀澶嶆牳 |
| REVIEWED | 鏁欏笀澶嶆牳瀹屾垚 |

### 3.13 QuestionGradingMode

| 鍊?| 璇存槑 |
| --- | --- |
| AUTO | 瀹㈣棰樿嚜鍔ㄥ垽鍒?|
| AI_ASSISTED | AI 棰勬壒鏀?+ 浜哄伐澶嶆牳 |
| MANUAL | 绾汉宸ユ壒鏀?|

### 3.14 ScorePublishStatus

| 鍊?| 璇存槑 |
| --- | --- |
| UNPUBLISHED | 寰呭彂甯?|
| PUBLISHED | 宸插彂甯?|

## 4. 鏁版嵁寤烘ā鍘熷垯

- 棰樼洰銆佽瘯鍗枫€佽€冭瘯鍙戝竷鍚庡簲淇濈暀蹇収锛岄伩鍏嶅悗缁搴撲慨鏀瑰奖鍝嶅巻鍙茶€冭瘯銆?
- 涓昏棰樿瘎鍒嗗簲淇濈暀 AI 璇勫垎銆佷汉宸ヨ皟鏁村拰鏈€缁堣瘎鍒嗐€?
- 鎴愮哗鍙戝竷搴旀湁鍙戝竷鎵规鍜屽彂甯冩椂闂淬€?
- 瀛︾敓鐢诲儚鍒濈増鍙帴鏀惰€冭瘯鎴愮哗鍜岀煡璇嗙偣鎺屾彙搴︽暟鎹€?
- API Key 绛夋晱鎰熶俊鎭笉寰楁槑鏂囧瓨鍌ㄣ€?

## 5. 鍚庣画缁存姢瑙勫垯

鏂板瀹炰綋銆佸瓧娈点€佹灇涓炬垨鐘舵€佸墠锛屽繀椤诲厛鏇存柊鏈枃妗ｏ紝鍐嶆洿鏂?TypeScript 绫诲瀷銆佹暟鎹簱妯″瀷鍜屾帴鍙ｆ枃妗ｃ€?

## 6. Iteration 5 澶嶇洏鍒嗘瀽妯″瀷琛ュ厖

### 6.1 ExamReviewReport 鑰冭瘯澶嶇洏鎶ュ憡

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| examId | string | 鑰冭瘯 ID銆?|
| examTitle | string | 鑰冭瘯鍚嶇О銆?|
| courseName | string | 璇剧▼鍚嶇О銆?|
| totalScore | number | 璇曞嵎婊″垎銆?|
| averageScore | number | 褰撳墠缁熻鍧囧垎銆?|
| passRate | number | 閫氳繃鐜囩櫨鍒嗘瘮銆?|
| submittedCount | number | 宸叉彁浜ょ瓟鍗锋暟銆?|
| reviewedCount | number | 宸插畬鎴愭暀甯堝鏍告暟銆?|
| scoreBands | ScoreBand[] | 鍒嗘暟娈靛垎甯冦€?|
| questionPerformances | QuestionPerformance[] | 棰樼洰琛ㄧ幇鍒楄〃銆?|
| knowledgeWeaknesses | KnowledgeWeakness[] | 鐭ヨ瘑鐐硅瘖鏂垪琛ㄣ€?|
| studentLayerInsights | StudentLayerInsight[] | 瀛︾敓鍒嗗眰寤鸿銆?|
| lectureDraft | AiLectureDraft | AI 璁茶瘎绋胯崏绋裤€?|

### 6.2 澶嶇洏瀛愭ā鍨?

| 妯″瀷 | 鍏抽敭瀛楁 | 璇存槑 |
| --- | --- | --- |
| ScoreBand | label銆乧ount銆乺atio | 鍒嗘暟娈典汉鏁颁笌鍗犳瘮銆?|
| QuestionPerformance | questionId銆乷rder銆乼itle銆乵axScore銆乤verageScore銆乻coreRate銆亀eaknessTags | 鍗曢骞冲潎鍒嗐€佸緱鍒嗙巼鍜岄闄╂爣绛俱€?|
| KnowledgeWeakness | knowledgePoint銆乻coreRate銆乴evel銆乻uggestion | 鐭ヨ瘑鐐瑰緱鍒嗙巼銆侀闄╃骇鍒拰鏁欏寤鸿銆?|
| StudentLayerInsight | layer銆乧ount銆乻uggestion | 瀛︾敓鍒嗗眰浜烘暟鍜屽悗缁粌涔犲缓璁€?|
| AiLectureDraft | id銆乪xamId銆乼itle銆乻tatus銆乬eneratedAt銆乧onfidence銆乺iskLabels銆乷utline銆乧ontent銆乼eacherEditedContent銆乤pprovedAt | AI 璁茶瘎绋胯崏绋裤€佹暀甯堢紪杈戝唴瀹瑰拰纭鏃堕棿銆?|

### 6.3 鏂板鏋氫妇

| 鏋氫妇 | 鍊?| 璇存槑 |
| --- | --- | --- |
| ReviewInsightLevel | GOOD銆乄ARNING銆丷ISK | 鐭ヨ瘑鐐硅瘖鏂骇鍒細鎺屾彙鑹ソ銆侀渶瑕佸珐鍥恒€侀噸鐐硅璇勩€?|
| LectureDraftStatus | DRAFT銆丷EVIEWING銆丄PPROVED | AI 璁茶瘎绋跨姸鎬侊細AI 鑽夌銆佸緟鏁欏笀纭銆佸凡纭銆?|


## 7. Iteration 8 鍚庣棰樺簱涓庣粍鍗疯惤搴撴ā鍨?
Iteration 8 灏嗛搴撲笌缁勫嵎 P0 鎺ュ彛浠?Mock 濂戠害鎺ㄨ繘鍒?PostgreSQL 鎸佷箙鍖栧疄鐜般€傚悗绔瓧娈电户缁榻愬墠绔?TypeScript 绫诲瀷锛屾灇涓惧€奸噰鐢ㄥぇ鍐欏瓧绗︿覆锛涘鏉傜粨鏋勫厛浠?JSON 瀛楃涓插瓨鍌ㄥ苟鍦?DTO 灞傝浆鎹€?
### 7.1 鏋氫妇鍊?
| 鏋氫妇 | 鍊?|
| --- | --- |
| QuestionType | `SINGLE_CHOICE`銆乣MULTIPLE_CHOICE`銆乣TRUE_FALSE`銆乣FILL_BLANK`銆乣SHORT_ANSWER`銆乣PROGRAMMING` |
| Difficulty | `EASY`銆乣MEDIUM`銆乣HARD` |
| QuestionSource | `MANUAL`銆乣AI`銆乣IMPORT` |
| QuestionStatus | `DRAFT`銆乣PENDING_REVIEW`銆乣ACTIVE`銆乣DISABLED` |
| PaperStatus | `DRAFT`銆乣READY`銆乣PUBLISHED`銆乣ARCHIVED` |

### 7.2 question 琛?
| 瀛楁 | 鏁版嵁搴撳瓧娈?| 绫诲瀷 | 璇存槑 |
| --- | --- | --- | --- |
| id | id | varchar(64) | 棰樼洰 ID銆?|
| title | title | varchar(500) | 棰樺共銆?|
| type | type | varchar(32) | `QuestionType`銆?|
| difficulty | difficulty | varchar(32) | `Difficulty`銆?|
| source | source | varchar(32) | `QuestionSource`銆?|
| status | status | varchar(32) | `QuestionStatus`銆?|
| score | score | numeric(8,2) | 榛樿鍒嗗€笺€?|
| answer | answer_json | text | 鏍囧噯绛旀鎴栧弬鑰冪瓟妗?JSON銆?|
| analysis | analysis | text | 瑙ｆ瀽銆?|
| options | options_json | text | 閫夐」 JSON 鏁扮粍銆?|
| scoringPoints | scoring_points_json | text | 寰楀垎鐐?JSON 鏁扮粍銆?|
| createdBy | created_by | varchar(64) | 鍒涘缓浜哄揩鐓с€?|
| updatedAt | updated_at | timestamptz | 鏇存柊鏃堕棿銆?|

### 7.3 question_knowledge_point 琛?
| 瀛楁 | 鏁版嵁搴撳瓧娈?| 绫诲瀷 | 璇存槑 |
| --- | --- | --- | --- |
| questionId | question_id | varchar(64) | 棰樼洰 ID锛屽閿叧鑱?`question.id`銆?|
| order | order_index | int | 鐭ヨ瘑鐐归『搴忋€?|
| knowledgePoint | knowledge_point | varchar(128) | 鐭ヨ瘑鐐瑰悕绉般€?|

### 7.4 paper 琛?
| 瀛楁 | 鏁版嵁搴撳瓧娈?| 绫诲瀷 | 璇存槑 |
| --- | --- | --- | --- |
| id | id | varchar(64) | 璇曞嵎 ID銆?|
| title | title | varchar(200) | 璇曞嵎鍚嶇О銆?|
| courseName | course_name | varchar(128) | 璇剧▼鍚嶇О蹇収銆?|
| description | description | text | 璇曞嵎璇存槑銆?|
| durationMinutes | duration_minutes | int | 寤鸿鑰冭瘯鏃堕暱銆?|
| totalScore | total_score | numeric(8,2) | 璇曞嵎鎬诲垎锛屾坊鍔?/ 绉婚櫎棰樼洰鍚庨噸绠椼€?|
| status | status | varchar(32) | `PaperStatus`銆?|
| createdBy | created_by | varchar(64) | 鍒涘缓浜哄揩鐓с€?|
| updatedAt | updated_at | timestamptz | 鏇存柊鏃堕棿銆?|

### 7.5 paper_question 琛?
| 瀛楁 | 鏁版嵁搴撳瓧娈?| 绫诲瀷 | 璇存槑 |
| --- | --- | --- | --- |
| id | id | varchar(128) | 璇曞嵎棰樼洰鍏宠仈 ID銆?|
| paperId | paper_id | varchar(64) | 璇曞嵎 ID锛屽閿叧鑱?`paper.id`銆?|
| questionId | question_id | varchar(64) | 棰樼洰 ID锛屽閿叧鑱?`question.id`銆?|
| order | order_index | int | 璇曞嵎鍐呴搴忋€?|
| score | score | numeric(8,2) | 鏈瘯鍗蜂腑璇ラ鍒嗗€笺€?|

涓氬姟绾︽潫锛?
- 鍚屼竴璇曞嵎涓嶅彲閲嶅娣诲姞鍚屼竴棰樼洰銆?- 鍙湁 `ACTIVE` 棰樼洰鍏佽琚坊鍔犲埌璇曞嵎銆?- `PUBLISHED`銆乣ARCHIVED` 璇曞嵎涓嶅厑璁哥户缁鍒犻鐩€?- 娣诲姞鎴栫Щ闄ら鐩悗蹇呴』閲嶇畻棰樺簭鍜岃瘯鍗锋€诲垎銆?- Flyway 璐熻矗寤鸿〃鍜岀瀛愭暟鎹紱JPA/Hibernate 鍙礋璐ｆ槧灏勫拰鏌ヨ锛屼笉鑷姩寤鸿〃銆?

## 8. Iteration 9 鑰冭瘯涓庣瓟鍗疯惤搴撴ā鍨?
Iteration 9 灏嗚€冭瘯鍒涘缓銆佸鐢熻€冭瘯鍒楄〃銆佺瓟鍗疯崏绋夸繚瀛樹笌浜ゅ嵎浠?OpenAPI 濂戠害鎺ㄨ繘鍒?PostgreSQL 鎸佷箙鍖栧疄鐜般€?
### 8.1 鏂板鏋氫妇

| 鏋氫妇 | 鍊?|
| --- | --- |
| ExamStatus | `DRAFT`銆乣SCHEDULED`銆乣ONGOING`銆乣ENDED`銆乣SCORES_PUBLISHED` |
| AnswerSheetStatus | `DRAFT`銆乣SUBMITTED`銆乣GRADING`銆乣GRADED` |
| StudentAnswerStatus | `NOT_STARTED`銆乣IN_PROGRESS`銆乣SUBMITTED`銆乣GRADED` |

### 8.2 鏂板鏁版嵁琛?
| 琛?| 璇存槑 |
| --- | --- |
| exam | 鑰冭瘯涓昏〃锛屽叧鑱旇瘯鍗凤紝淇濆瓨鑰冭瘯鍚嶇О銆佹椂闂淬€佹椂闀裤€佹€诲垎銆佺姸鎬佸拰鍒涘缓浜哄揩鐓с€?|
| exam_class | 鑰冭瘯鐝骇鑼冨洿琛紝瀵瑰簲 `ExamEntity.classIds`銆?|
| exam_participant | 鑰冭瘯鍙備笌瀛︾敓蹇収琛紝褰撳墠闃舵浣跨敤 Mock 鐝骇鑺卞悕鍐岀敓鎴愩€?|
| answer_sheet | 瀛︾敓绛斿嵎涓昏〃锛岃褰曠瓟鍗风姸鎬併€佺増鏈€佷繚瀛樻椂闂翠笌浜ゅ嵎鏃堕棿銆?|
| answer_item | 鍗曢浣滅瓟琛紝鎸?`answer_json` 淇濆瓨涓嶅悓棰樺瀷鐨勪綔绛斿唴瀹广€?|

### 8.3 涓氬姟绾︽潫

- 鍒涘缓鑰冭瘯蹇呴』鍩轰簬 `READY` 鎴?`PUBLISHED` 璇曞嵎锛屼笖璇曞嵎鑷冲皯鍖呭惈涓€閬撻銆?- `endAt` 蹇呴』鏅氫簬 `startAt`锛宍durationMinutes` 蹇呴』澶т簬 0銆?- 褰撳墠鏈疄鐜扮湡瀹炵彮绾?/ 瀛︾敓 / 閴存潈妯″潡锛屽垱寤鸿€冭瘯鏃舵牴鎹?`classIds` 鐢熸垚 Mock 鍙備笌瀛︾敓涓庡垵濮嬬瓟鍗枫€?- 鑽夌淇濆瓨鍙厑璁告搷浣?`DRAFT` 绛斿嵎锛屾瘡娆′繚瀛樹細閫掑 `version`銆?- 鑽夌棰樼洰蹇呴』灞炰簬璇ヨ€冭瘯鍏宠仈璇曞嵎銆?- 浜ゅ嵎鍚庣瓟鍗风姸鎬佸彉涓?`SUBMITTED`锛屼笉鍏佽缁х画淇濆瓨鑽夌鎴栭噸澶嶄氦鍗枫€?

## Iteration 10 澧為噺锛氭壒鏀逛笌鎴愮哗棰嗗煙妯″瀷

### `grading_task` 鎵规敼浠诲姟

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| `id` | varchar(96) | 鎵规敼浠诲姟 ID锛孭0 浣跨敤 `GT-{answerSheetId}` |
| `exam_id` | varchar(64) | 鎵€灞炶€冭瘯 |
| `answer_sheet_id` | varchar(96) | 鎵€灞炵瓟鍗凤紝鍞竴 |
| `student_id` / `student_name` | varchar | 瀛︾敓蹇収淇℃伅 |
| `status` | varchar(32) | `PENDING` / `AI_CHECKED` / `REVIEWED` |
| `objective_score` | numeric(8,2) | 瀹㈣棰樺緱鍒?|
| `subjective_score` | numeric(8,2) | 涓昏棰樺緱鍒嗭紝P0 鐢辨暀甯堟渶缁堝垎鍙嶆帹 |
| `ai_score` | numeric(8,2) | P0 鏆傜瓑浜庡瑙傞鑷姩鍒?|
| `final_score` | numeric(8,2) | 鏁欏笀纭鍚庣殑鏈€缁堝垎 |
| `comment` | text | 鏁欏笀璇勮 |
| `reviewed_at` | timestamptz | 鏁欏笀纭鏃堕棿 |

### `grading_item` 鎵规敼棰樼洰鏄庣粏

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| `id` | varchar(128) | 鏄庣粏 ID |
| `grading_task_id` | varchar(96) | 鎵€灞炴壒鏀逛换鍔?|
| `question_id` | varchar(64) | 瀵瑰簲棰樼洰 |
| `question_type` | varchar(32) | 棰樺瀷蹇収 |
| `max_score` | numeric(8,2) | 璇ラ婊″垎锛屾潵鑷瘯鍗烽鐩垎鍊?|
| `auto_score` | numeric(8,2) | 瀹㈣棰樿嚜鍔ㄥ垎 |
| `final_score` | numeric(8,2) | 棰樼洰鏈€缁堝垎锛孭0 瀹㈣棰樿嚜鍔ㄥ啓鍏ワ紝涓昏棰樺悗缁墿灞曢€愰鎵规敼 |
| `is_objective` | boolean | 鏄惁瀹㈣棰?|
| `is_correct` | boolean | 瀹㈣棰樻槸鍚︽纭?|

### `score_report` 鎴愮哗鎶ュ憡蹇収

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| `id` | varchar(96) | 鎴愮哗鎶ュ憡 ID |
| `exam_id` / `answer_sheet_id` | varchar | 鑰冭瘯涓庣瓟鍗峰紩鐢?|
| `student_id` / `student_name` | varchar | 瀛︾敓蹇収淇℃伅 |
| `exam_title` | varchar(200) | 鑰冭瘯鏍囬蹇収 |
| `score` | numeric(8,2) | 鏈€缁堝垎 |
| `rank_no` | integer | 鏈鑰冭瘯鎺掑悕 |
| `weak_knowledge_points_json` | text | 钖勫急鐭ヨ瘑鐐?JSON 鏁扮粍 |
| `feedback` | text | 瀛︾敓绔弽棣堟枃妗?|
| `published_at` | timestamptz | 鍙戝竷鏃堕棿 |

## Iteration 13 琛ュ厖锛欰uth 鍗犱綅鏁版嵁妯″瀷

### 鏋氫妇
| 鏋氫妇 | 鍊?|
| --- | --- |
| `RoleCode` | `ADMIN`銆乣TEACHER`銆乣TA`銆乣STUDENT` |
| `UserStatus` | `ACTIVE`銆乣DISABLED` |

### `auth_user`
| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| `id` | varchar(64) | 鐢ㄦ埛 ID |
| `name` | varchar(64) | 鐢ㄦ埛鍚嶇О |
| `email` | varchar(128) | 閭 |
| `status` | varchar(32) | 鐢ㄦ埛鐘舵€?|
| `student_id` | varchar(64) | 瀛︾敓韬唤鏄犲皠锛涙暀甯堝吋婕旂ず瀛︾敓鏃朵娇鐢?|
| `created_at` / `updated_at` | timestamptz | 鍒涘缓涓庢洿鏂版椂闂?|

### `auth_role`
| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| `code` | varchar(32) | 瑙掕壊缂栫爜 |
| `name` | varchar(64) | 瑙掕壊鍚嶇О |
| `description` | varchar(255) | 瑙掕壊璇存槑 |

### `auth_user_role`
| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| `user_id` | varchar(64) | 鐢ㄦ埛 ID |
| `role_code` | varchar(32) | 瑙掕壊缂栫爜 |
## Iteration 15 瑙勫垝锛氭寮忚处鍙锋暟鎹ā鍨嬭ˉ鍏?
> 褰撳墠 `auth_user` 浠呬负 Iteration 13/14 寮€鍙戞€佸崰浣嶏紝缂哄皯瀵嗙爜鍝堝笇銆佺櫥褰曞悕銆侀娆℃敼瀵嗗拰鍚嶅崟瀵煎叆鑳藉姏銆傛寮忚€冭瘯璐﹀彿浣撶郴闇€鍦ㄥ悗缁縼绉讳腑琛ラ綈浠ヤ笅瀛楁/琛ㄣ€?
### `auth_user` 寰呮墿灞曞瓧娈?| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| `username` | varchar(64) | 鐧诲綍璐﹀彿锛涘鐢熼粯璁や娇鐢ㄥ鍙凤紝鏁欏笀/TA 鍙娇鐢ㄥ伐鍙锋垨閭銆?|
| `password_hash` | varchar(255) | BCrypt/PasswordEncoder 鐢熸垚鐨勫瘑鐮佸搱甯岋紱绂佹淇濆瓨鏄庢枃瀵嗙爜銆?|
| `must_change_password` | boolean | 鏄惁蹇呴』鍦ㄧ櫥褰曞悗淇敼瀵嗙爜锛涘鍏ュ鐢熶笌閲嶇疆瀵嗙爜鍚庝负 true銆?|
| `password_updated_at` | timestamptz | 鏈€杩戜竴娆″瘑鐮佹洿鏂版椂闂淬€?|
| `last_login_at` | timestamptz | 鏈€杩戠櫥褰曟椂闂淬€?|
| `account_source` | varchar(32) | `MANUAL`銆乣ROSTER_IMPORT`銆乣SYSTEM_SEED` 绛夎处鍙锋潵婧愩€?|

### `student_profile` 寤鸿琛?| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| `id` | varchar(64) | 瀛︾敓妗ｆ ID銆?|
| `user_id` | varchar(64) | 鍏宠仈 `auth_user.id`銆?|
| `student_no` | varchar(64) | 瀛﹀彿锛涘鍏ュ幓閲嶄富閿箣涓€銆?|
| `class_id` / `class_name` | varchar | 鐝骇鏍囪瘑涓庡悕绉般€?|
| `grade` / `major` | varchar | 骞寸骇銆佷笓涓氱瓑鍚嶅崟瀛楁銆?|
| `created_at` / `updated_at` | timestamptz | 鍒涘缓涓庢洿鏂版椂闂淬€?|

### `roster_import_task` 寤鸿琛?| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| `id` | varchar(64) | 瀵煎叆浠诲姟 ID銆?|
| `operator_id` | varchar(64) | 瀵煎叆鎿嶄綔鑰呫€?|
| `class_id` / `class_name` | varchar | 鐩爣鐝骇銆?|
| `status` | varchar(32) | `PENDING`銆乣PROCESSING`銆乣SUCCEEDED`銆乣PARTIAL_FAILED`銆乣FAILED`銆?|
| `total_count` / `success_count` / `failed_count` | integer | 瀵煎叆缁熻銆?|
| `error_report_json` | text | 琛岀骇澶辫触鍘熷洜锛屼笉鍖呭惈鏄庢枃瀵嗙爜銆?|
| `created_at` / `finished_at` | timestamptz | 鍒涘缓涓庡畬鎴愭椂闂淬€?|

## Iteration 15 鏁版嵁妯″瀷琛ュ厖锛氳处鍙蜂笌瀛︾敓妗ｆ

### auth_user 琛ュ厖瀛楁
| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| `username` | varchar(64) | 鐧诲綍璐﹀彿锛涘鐢熶负瀛﹀彿锛屾暀甯堟紨绀鸿处鍙蜂负 `teacher@mindmark.local` |
| `password_hash` | varchar(255) | PBKDF2 瀵嗙爜鍝堝笇锛岀姝㈠瓨鍌ㄦ槑鏂?|
| `must_change_password` | boolean | 鏄惁蹇呴』淇敼瀵嗙爜锛涘鐢熷鍏ヤ笌閲嶇疆鍚庝负 true |
| `password_updated_at` | timestamptz | 瀵嗙爜鏇存柊鏃堕棿 |
| `last_login_at` | timestamptz | 鏈€杩戠櫥褰曟椂闂?|
| `account_source` | varchar(32) | 璐﹀彿鏉ユ簮锛歚SYSTEM_SEED`銆乣ROSTER_IMPORT` 绛?|

### student_profile
| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| `id` | varchar(64) | 瀛︾敓妗ｆ ID |
| `user_id` | varchar(64) | 瀵瑰簲 `auth_user.id` |
| `student_no` | varchar(64) | 瀛﹀彿锛屽叏灞€鍞竴 |
| `class_id` | varchar(64) | 鐝骇 ID |
| `class_name` | varchar(128) | 鐝骇鍚嶇О |
| `grade` | varchar(32) | 骞寸骇 |
| `major` | varchar(128) | 涓撲笟 |

### roster_import_task / auth_audit_log
- `roster_import_task` 璁板綍鍚嶅崟瀵煎叆浠诲姟鐨勬€绘暟銆佸垱寤烘暟銆佽烦杩囨暟銆佸け璐ユ暟涓庤绾ч敊璇€?- `auth_audit_log` 璁板綍鐧诲綍銆佹敼瀵嗐€佸悕鍗曞鍏ャ€侀噸缃瘑鐮佺瓑瀹夊叏鐩稿叧鎿嶄綔銆?

## Iteration 16 鏁版嵁妯″瀷琛ュ厖锛氳处鍙锋不鐞嗕笌鐝骇鎺堟潈

### `teacher_class_assignment`

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| `id` | varchar(64) | 涓婚敭锛屽缓璁娇鐢ㄤ笟鍔″墠缂€鎴?UUID銆?|
| `user_id` | varchar(64) | 鏁欏笀/鍔╂暀鐢ㄦ埛 ID锛屽閿叧鑱?`auth_user.id`銆?|
| `class_id` | varchar(64) | 琚巿鏉冪鐞嗙殑鐝骇 ID銆?|
| `assignment_role` | varchar(32) | 鐝骇鎺堟潈瑙掕壊锛歚OWNER` / `ASSISTANT`銆?|
| `created_at` | timestamptz | 鎺堟潈鍒涘缓鏃堕棿銆?|

绾︽潫锛歚(user_id, class_id)` 鍞竴锛涚鐞嗗憳瑙掕壊 `ADMIN` 鍏峰鍏ㄥ眬鐝骇绠＄悊鏉冮檺锛屾暀甯?鍔╂暀蹇呴』鍛戒腑璇ユ巿鏉冭〃鍚庢墠鑳藉鍏ュ悕鍗曘€佹煡鐪嬬彮绾у鐢熸垨閲嶇疆瀛︾敓瀵嗙爜銆?
### 閴存潈浼氳瘽妯″瀷

- 褰撳墠鐧诲綍鎬佺敱 Sa-Token 绠＄悊锛孴oken 鏄笉閫忔槑 UUID 鏍峰紡锛屼笉鍦ㄤ笟鍔¤〃涓惤搴撱€?- Redis 浣滀负 Sa-Token 浼氳瘽瀛樺偍锛涘簲鐢ㄩ噸鍚悗浼氳瘽鍙湪 Redis 鏈夋晥鏈熷唴缁х画浣跨敤銆?- `auth_audit_log` 缁х画璁板綍鐧诲綍銆佺櫥鍑恒€佹敼瀵嗐€佸悕鍗曞鍏ャ€佸瘑鐮侀噸缃笌鐝骇鑼冨洿鎷掔粷绛夎处鍙锋不鐞嗕簨浠躲€?## Iteration 17 鏁版嵁瀛楀吀琛ュ厖锛氳处鍙锋不鐞嗕笌瀹¤

### auth_user 鎵╁睍瀛楁

| 瀛楁 | 绫诲瀷 | 璇存槑 |
| --- | --- | --- |
| failed_login_count | INTEGER | 杩炵画鐧诲綍澶辫触娆℃暟锛屾垚鍔熺櫥褰曘€佺鐞嗗憳鍚敤鎴栬В閿佸悗褰掗浂銆?|
| locked_until | TIMESTAMPTZ | 涓存椂閿佸畾鎴鏃堕棿锛涗负绌鸿〃绀烘湭閿佸畾锛屾棭浜庡綋鍓嶆椂闂存椂鐧诲綍娴佺▼浼氳嚜鍔ㄦ竻鐞嗐€?|

### teacher_class_assignment 娌荤悊绾︽潫

- `assignment_role` 鍥哄畾涓?`OWNER` / `ASSISTANT`銆?- `(user_id, class_id)` 淇濇寔鍞竴锛涢噸澶嶆巿鏉冩墽琛屾洿鏂帮紝渚夸簬鍚庡彴椤甸潰骞傜瓑淇濆瓨銆?- 浠呮嫢鏈?`TEACHER` 鎴?`TA` 瑙掕壊鐨勮处鍙峰彲琚巿浜堢彮绾ф潈闄愩€?
### auth_audit_log 鍙鍖栧瓧娈?
- `actor_id`锛氬彂璧锋搷浣滅殑鐢ㄦ埛 ID锛涘尶鍚嶇櫥褰曞け璐ヨ褰曚负 `anonymous`銆?- `action`锛氬姩浣滅紪鐮侊紝渚嬪 `LOGIN`銆乣LOGOUT`銆乣CHANGE_PASSWORD`銆乣ADMIN_UPDATE_USER_STATUS`銆乣ADMIN_UPDATE_USER_ROLES`銆乣ADMIN_UNLOCK_USER`銆乣ADMIN_UPSERT_CLASS_ASSIGNMENT`銆乣ADMIN_DELETE_CLASS_ASSIGNMENT`銆?- `target_user_id`锛氳鎿嶄綔璐﹀彿 ID銆?- `result`锛歚SUCCESS` / `FAILED`銆?- `detail`锛氬け璐ュ師鍥犮€佺姸鎬佸彉鍖栥€佺彮绾ф巿鏉冨彉鍖栫瓑绠€瑕佹枃鏈€?## Round 1锛氬熀纭€鏁版嵁涓庢潈闄愯竟鐣屾敹鏁涳紙2026-07-18锛?
### 棰嗗煙鏂板

- **Course锛堣绋嬶級**锛氭暀瀛︾粍缁囩殑涓婂眰褰掑睘锛屽瓧娈靛寘鎷?`id`銆乣code`銆乣name`銆乣description`銆乣status`銆乣createdAt`銆乣updatedAt`銆?- **TeachingClass锛堟暀瀛︾彮绾э級**锛氳€冭瘯鎺堟潈銆佸鐢熷悕鍗曞鍏ャ€佽€冭瘯鍒涘缓涓庢垚缁╄闂殑鏈€灏忔潈闄愯竟鐣岋紝瀛楁鍖呮嫭 `id`銆乣courseId`銆乣code`銆乣name`銆乣grade`銆乣major`銆乣status`銆乣createdAt`銆乣updatedAt`銆?- **AcademicStatus**锛歚ACTIVE` 鍙敤锛沗DISABLED` 鏆傚仠浣跨敤锛沗ARCHIVED` 褰掓。鍙銆?
### 鍏宠仈瑙勫垯

- `student_profile.class_id` 蹇呴』寮曠敤鐪熷疄 `teaching_class.id`锛沗class_name` 浠呬綔涓哄巻鍙插啑浣欏睍绀猴紝涓嶄綔涓烘潈闄愬垽鏂緷鎹€?- `teacher_class_assignment.class_id` 蹇呴』寮曠敤鐪熷疄 `teaching_class.id`銆?- 鑰冭瘯 `exam_class.class_id` 蹇呴』鏉ヨ嚜鐪熷疄涓?`ACTIVE` 鐨勬暀瀛︾彮绾с€?- Round 1 鏆備笉鏂板瀛︾敓澶氱彮鍏崇郴琛紱涓€涓鐢熻处鍙?P0 褰掑睘涓€涓暀瀛︾彮绾э紝鍚庣画鍐嶆墿灞?`class_student`銆?
### 涓氬姟涓嶅彉閲?
1. 鍒涘缓鑰冭瘯鏃讹紝鏁欏笀/鍔╂暀蹇呴』瀵规墍鏈夌洰鏍囩彮绾ф湁鎺堟潈锛涚鐞嗗憳涓嶅彈鐝骇鎺堟潈闄愬埗銆?2. 瀛︾敓绔€冭瘯鍒楄〃銆佺瓟鍗枫€佹垚缁╁弽棣堝潎閫氳繃鐧诲綍鎬佽В鏋愬鐢熻韩浠斤紝绂佹璇锋眰鍙傛暟鎸囧畾浠绘剰 `studentId`銆?3. 鏁欏笀/鍔╂暀鏌ョ湅鎵规敼浠诲姟銆佽€冭瘯鎴愮哗銆佸鐢熷悕鍗曟椂鍙兘璁块棶琚巿鏉冪彮绾ц寖鍥村唴鐨勬暟鎹€?

## Round 2 数据字典补充：考试生命周期与答卷版本（2026-07-18）

### exam.status

当前枚举：`DRAFT`、`SCHEDULED`、`ONGOING`、`ENDED`、`GRADING`、`SCORES_PUBLISHED`。

- `SCHEDULED / ONGOING / ENDED`：由 `start_at`、`end_at` 与服务端当前时间推导并在读取时推进。
- `GRADING`：进入批改阶段；当考试已结束或已无 `DRAFT` 答卷且批改任务已生成时进入。
- `SCORES_PUBLISHED`：成绩已发布，学生端可查看成绩报告。

### answer_sheet.version

`answer_sheet.version` 是答卷草稿版本号。每次保存草稿成功后递增 1；前端真实接口模式应在保存时携带 `expectedVersion`，服务端发现版本不一致时返回 `409 CONFLICT`。
## Round 3 补充：超时答卷与缺考数据字典

| 模型/枚举 | 新增/调整 | 说明 |
| --- | --- | --- |
| `AnswerSheetStatus` | `ABSENT` | 考试结束时学生未产生有效草稿（`version == 0`）的缺考答卷状态。 |
| `StudentAnswerStatus` | `ABSENT` | 学生考试列表中的缺考状态，前端应以不可答题、不可提交的终态展示。 |
| `answer_sheet.status` | check constraint 增加 `ABSENT` | 通过 `V11__answer_timeout_finalization.sql` 调整。 |
| `answer_sheet(exam_id, status)` | 新增索引 | 支撑考试结束扫描与状态统计。 |

超时有草稿答卷仍复用 `SUBMITTED -> GRADING -> GRADED` 主流程；无有效草稿才进入 `ABSENT`，且不生成批改任务。

## Round 4 新增领域模型：考试复盘与导出产物

### review_lecture_draft
| 字段 | 说明 |
| --- | --- |
| id | 讲评稿 ID，格式 `draft-{uuid}` |
| exam_id | 所属考试 |
| status | `DRAFT` / `REVIEWING` / `APPROVED` / `FAILED` |
| provider | 生成来源，讲评稿 P0 为 `LOCAL_TEMPLATE`；题目生成 Provider 支持 `OPENAI` / `ANTHROPIC` |
| confidence | 讲评稿置信度，仅作教师审核辅助 |
| risk_labels_json | 风险标签 JSON 数组 |
| outline_json | 讲评提纲 JSON 数组 |
| content | AI 生成讲评稿正文 Markdown |
| teacher_edited_content | 教师确认前编辑后的正文 |
| prompt_snapshot | 生成提示词与关键输入摘要 |
| artifact_id | 已导出讲评稿产物 ID，可为空 |
| generated_at / approved_at / updated_at | 生成、确认与更新时间 |

### review_artifact
| 字段 | 说明 |
| --- | --- |
| id | 产物 ID，格式 `artifact-{uuid}` |
| exam_id | 所属考试 |
| artifact_type | `REVIEW_REPORT_MARKDOWN` / `LECTURE_DRAFT_MARKDOWN` / `SCORE_SUMMARY_CSV` |
| file_name | 面向用户展示的文件名 |
| object_key | MinIO 对象路径，例如 `reviews/{examId}/{uuid}-复盘报告.md` |
| content_type | 文件 MIME 类型 |
| size_bytes | 文件大小 |
| checksum_sha256 | 文件 SHA-256 校验值 |
| created_by / created_at | 创建人和创建时间 |

## 数据字典补充：Question 课程归属与五级难度（2026-07-19）

### Question 题目

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `courseId` | string | 否 | 题目所属课程 ID，用于题库课程筛选与后续组卷约束。 |
| `courseName` | string | 否 | 题目所属课程名称快照，用于列表和详情展示。 |
| `difficulty` | enum | 是 | 五级难度枚举：`VERY_EASY`、`EASY`、`MEDIUM`、`HARD`、`VERY_HARD`。 |

> 兼容策略：存量 `EASY/MEDIUM/HARD` 数据继续有效；新建题目与 AI 出题应从五级枚举中选择。

## 2026-07-19 数据字典补充：题目/试卷课程边界

- `Question.courseId`：必填，题目所属课程 ID；题目创建、导入、AI 审核入库时必须写入。
- `Question.courseName`：必填，题目所属课程名称快照，用于列表展示；以后如课程改名，可按需要异步刷新快照。
- `Paper.courseId`：必填，试卷所属课程 ID；组卷时作为题目准入边界。
- `Paper.courseName`：必填，试卷所属课程名称快照。
- 组卷约束：`PaperQuestion.question.courseId` 必须等于 `Paper.courseId`，否则后端返回业务冲突，不允许加入试卷；试卷从 DRAFT 标记 READY 前也需要重新校验整卷课程一致性。
- `Difficulty` 当前枚举：`VERY_EASY / EASY / MEDIUM / HARD / VERY_HARD`。
## 2026-07-19 数据字典补充：AI Provider 设置与题库写入

### ai_provider_setting

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | varchar | Provider 设置 ID。 |
| `teacher_id` | varchar | 教师/助教/管理员用户 ID。 |
| `provider` | varchar | AI 服务商，当前题目生成支持 `OPENAI` / `ANTHROPIC`；`KIMI` 仅历史兼容。 |
| `encrypted_api_key` | text | 使用 AES/GCM 加密后的 API Key 密文。 |
| `key_suffix` | varchar | Key 后缀脱敏预览，用于前端确认是否已配置。 |
| `created_at` | timestamptz | 创建时间。 |
| `updated_at` | timestamptz | 更新时间。 |

唯一约束：`teacher_id + provider`。明文 API Key 不进入数据库、日志和接口响应。

### question 写入来源补充

| 写入路径 | `source` | 初始 `status` | 课程规则 |
| --- | --- | --- | --- |
| 手工创建 | `MANUAL` | `ACTIVE` | `courseId` 必填，并回填 `courseName`。 |
| 批量导入 | `IMPORT` | `ACTIVE` | 每条题目均需绑定有效课程；重复题按课程、题型、标题跳过。 |
| AI 生成 | `AI` | `PENDING_REVIEW` | LangGraph + OpenAI/Anthropic Provider 生成并通过中文内容校验后写入待审核状态。 |

五级难度继续统一使用：`VERY_EASY / EASY / MEDIUM / HARD / VERY_HARD`。