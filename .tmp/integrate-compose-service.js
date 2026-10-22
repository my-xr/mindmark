const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/paper/service/PaperService.java';
let text = fs.readFileSync(path, 'utf8');
const imports = [
  'import com.mindmark.server.modules.paper.dto.PaperComposeAgentPlanResponse;',
  'import com.mindmark.server.modules.paper.dto.PaperComposeDistributionItemResponse;',
  'import com.mindmark.server.modules.paper.dto.PaperComposePreviewResponse;',
  'import com.mindmark.server.modules.paper.dto.PaperComposeQualityReportResponse;'
];
for (const imp of imports) {
  if (!text.includes(imp)) {
    text = text.replace('import com.mindmark.server.modules.paper.dto.AddPaperQuestionRequest;\n', 'import com.mindmark.server.modules.paper.dto.AddPaperQuestionRequest;\n' + imp + '\n');
  }
}
if (!text.includes('private final LangGraphPaperComposePlanService composePlanService;')) {
  text = text.replace(
    '    private final QuestionRepository questionRepository;\n    private final PaperResponseMapper responseMapper;\n',
    '    private final QuestionRepository questionRepository;\n    private final PaperResponseMapper responseMapper;\n    private final LangGraphPaperComposePlanService composePlanService;\n'
  );
  text = text.replace(
    '        QuestionRepository questionRepository,\n        PaperResponseMapper responseMapper\n    ) {',
    '        QuestionRepository questionRepository,\n        PaperResponseMapper responseMapper,\n        LangGraphPaperComposePlanService composePlanService\n    ) {'
  );
  text = text.replace(
    '        this.questionRepository = questionRepository;\n        this.responseMapper = responseMapper;\n',
    '        this.questionRepository = questionRepository;\n        this.responseMapper = responseMapper;\n        this.composePlanService = composePlanService;\n'
  );
}
if (!text.includes('public PaperComposePreviewResponse previewCompose')) {
  text = text.replace(
    '    @Transactional\n    public PaperResponse removeQuestion(String paperId, String questionRef) {',
    '    @Transactional(readOnly = true)\n    public PaperComposePreviewResponse previewCompose(String paperId, PaperComposeRequest request, PaperComposeStrategy strategy) {\n        PaperCompositionDraft draft = buildCompositionDraft(paperId, request, strategy);\n        return new PaperComposePreviewResponse(\n            draft.paper().getId(),\n            draft.mode(),\n            strategy,\n            draft.targetScore(),\n            draft.baseScore(),\n            draft.ruleScore(),\n            draft.plannedFinalScore(),\n            draft.selectedQuestions().size(),\n            draft.gaps().isEmpty(),\n            draft.gaps(),\n            draft.warnings(),\n            draft.qualityReport(),\n            draft.agentPlan()\n        );\n    }\n\n    @Transactional\n    public PaperResponse removeQuestion(String paperId, String questionRef) {'
  );
}
const start = text.indexOf('    private PaperComposeResultResponse composePaper(');
const end = text.indexOf('    private List<PaperComposeRuleRequest> normalizeRules', start);
if (start < 0 || end < 0) throw new Error('composePaper block not found');
const replacement = `    private PaperComposeResultResponse composePaper(
        String paperId,
        PaperComposeRequest request,
        PaperComposeStrategy strategy
    ) {
        PaperCompositionDraft draft = buildCompositionDraft(paperId, request, strategy);
        if (!draft.gaps().isEmpty()) {
            throw new BusinessException(ErrorCode.CONFLICT, buildGapMessage(draft.paper(), draft.gaps()));
        }

        PaperEntity paper = draft.paper();
        if (draft.mode() == PaperComposeMode.REPLACE) {
            paper.getQuestions().clear();
            paperRepository.saveAndFlush(paper);
        }

        int orderIndex = paper.getQuestions().size() + 1;
        for (SelectedQuestion selectedQuestion : draft.selectedQuestions()) {
            PaperQuestionEntity paperQuestion = createPaperQuestion(
                paper,
                selectedQuestion.question(),
                orderIndex,
                selectedQuestion.score()
            );
            paper.getQuestions().add(paperQuestion);
            orderIndex += 1;
        }
        touchAndRecalculate(paper);
        PaperEntity savedPaper = paperRepository.save(paper);
        PaperComposeQualityReportResponse qualityReport = buildQualityReport(toQualityQuestionsFromPaper(savedPaper), draft.targetScore());
        PaperComposeAgentPlanResponse agentPlan = buildAgentPlan(draft, qualityReport);

        return new PaperComposeResultResponse(
            responseMapper.toResponse(savedPaper),
            draft.selectedQuestions().size(),
            draft.ruleScore(),
            draft.targetScore(),
            savedPaper.getTotalScore(),
            draft.mode(),
            strategy,
            List.of(),
            draft.warnings(),
            qualityReport,
            agentPlan
        );
    }

    private PaperCompositionDraft buildCompositionDraft(
        String paperId,
        PaperComposeRequest request,
        PaperComposeStrategy strategy
    ) {
        PaperEntity paper = findPaper(paperId);
        ensurePaperEditable(paper);
        ensurePaperHasCourse(paper);

        PaperComposeMode mode = request == null || request.mode() == null ? PaperComposeMode.REPLACE : request.mode();
        List<PaperComposeRuleRequest> rules = normalizeRules(request == null ? null : request.rules());
        BigDecimal ruleScore = calculateRuleScore(rules);
        BigDecimal baseScore = mode == PaperComposeMode.APPEND ? paper.getTotalScore() : BigDecimal.ZERO;
        BigDecimal plannedFinalScore = baseScore.add(ruleScore);
        BigDecimal targetScore = request == null || request.targetScore() == null ? DEFAULT_TARGET_SCORE : request.targetScore();
        if (plannedFinalScore.compareTo(targetScore) != 0) {
            throw new BusinessException(
                ErrorCode.CONFLICT,
                "组卷规则总分与目标总分不一致：当前规则完成后为 " + plannedFinalScore.stripTrailingZeros().toPlainString()
                    + " 分，目标为 " + targetScore.stripTrailingZeros().toPlainString() + " 分"
            );
        }

        Set<String> excludedQuestionIds = mode == PaperComposeMode.APPEND
            ? collectCurrentQuestionIds(paper)
            : new HashSet<>();
        List<SelectedQuestion> selectedQuestions = new ArrayList<>();
        List<PaperComposeGapResponse> gaps = new ArrayList<>();

        for (PaperComposeRuleRequest rule : rules) {
            if (rule.count() == 0) {
                continue;
            }
            List<QuestionEntity> candidates = findCandidates(paper, rule, excludedQuestionIds);
            if (candidates.size() < rule.count()) {
                gaps.add(new PaperComposeGapResponse(
                    rule.type(),
                    rule.count(),
                    candidates.size(),
                    cleanKnowledgePoints(rule.knowledgePoints()),
                    "题库可用题量不足，无法满足该题型规则"
                ));
                continue;
            }
            List<QuestionEntity> picked = selectCandidates(candidates, rule.count(), strategy);
            for (QuestionEntity question : picked) {
                excludedQuestionIds.add(question.getId());
                selectedQuestions.add(new SelectedQuestion(question, rule.score()));
            }
        }

        List<String> warnings = strategy == PaperComposeStrategy.AGENT
            ? List.of("智能组卷已按课程、题型、难度、知识点覆盖与题库库存完成后端校验后写入。")
            : List.of("随机组卷已按规则从当前课程 ACTIVE 题库抽取并写入。");
        PaperComposeQualityReportResponse qualityReport = buildQualityReport(toQualityQuestionsForDraft(paper, mode, selectedQuestions), targetScore);
        PaperComposeAgentPlanResponse agentPlan = buildAgentPlan(
            new PaperCompositionDraft(paper, mode, strategy, rules, ruleScore, baseScore, plannedFinalScore, targetScore, selectedQuestions, gaps, warnings, qualityReport, null),
            qualityReport
        );
        return new PaperCompositionDraft(
            paper,
            mode,
            strategy,
            rules,
            ruleScore,
            baseScore,
            plannedFinalScore,
            targetScore,
            selectedQuestions,
            gaps,
            warnings,
            qualityReport,
            agentPlan
        );
    }

`;
text = text.slice(0, start) + replacement + text.slice(end);
fs.writeFileSync(path, text, 'utf8');
