from pathlib import Path
p=Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/score/web/ScoreController.java')
text=p.read_text(encoding='utf-8-sig')
text=text.replace('import com.mindmark.server.common.api.ApiResponse;\n', 'import com.mindmark.server.common.api.ApiResponse;\nimport com.mindmark.server.common.api.PageResponse;\n')
text=text.replace('import com.mindmark.server.modules.score.dto.ScoreReportResponse;\n', 'import com.mindmark.server.modules.score.dto.ScoreReportResponse;\nimport com.mindmark.server.modules.score.dto.ScoreSummaryItemResponse;\n')
text=text.replace('import org.springframework.web.bind.annotation.PostMapping;\n', 'import org.springframework.web.bind.annotation.PostMapping;\nimport org.springframework.web.bind.annotation.RequestParam;\n')
anchor='''    @GetMapping("/api/v1/exams/{examId}/scores")\n    public ApiResponse<ExamScoreSummaryResponse> getExamScores(@PathVariable String examId) {\n        return ApiResponse.success(scoreService.getExamScores(examId));\n    }\n\n'''
insert='''    @GetMapping("/api/v1/score-summaries")\n    public ApiResponse<PageResponse<ExamScoreSummaryResponse>> listExamScoreSummaries(\n        @RequestParam(defaultValue = "1") Integer page,\n        @RequestParam(defaultValue = "10") Integer pageSize\n    ) {\n        return ApiResponse.success(scoreService.listExamScoreSummaries(page, pageSize));\n    }\n\n    @GetMapping("/api/v1/exams/{examId}/scores")\n    public ApiResponse<ExamScoreSummaryResponse> getExamScores(@PathVariable String examId) {\n        return ApiResponse.success(scoreService.getExamScores(examId));\n    }\n\n    @GetMapping("/api/v1/exams/{examId}/score-reports")\n    public ApiResponse<PageResponse<ScoreSummaryItemResponse>> listExamScoreReports(\n        @PathVariable String examId,\n        @RequestParam(defaultValue = "1") Integer page,\n        @RequestParam(defaultValue = "10") Integer pageSize\n    ) {\n        return ApiResponse.success(scoreService.listExamScoreReports(examId, page, pageSize));\n    }\n\n'''
if anchor not in text:
    raise SystemExit('anchor not found')
text=text.replace(anchor,insert)
p.write_text(text,encoding='utf-8')
