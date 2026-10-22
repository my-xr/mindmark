package com.mindmark.server.modules.paper.service;

import com.mindmark.server.modules.paper.dto.PaperComposeAgentPlanResponse;
import com.mindmark.server.modules.paper.dto.PaperComposeMode;
import com.mindmark.server.modules.paper.dto.PaperComposeQualityReportResponse;
import com.mindmark.server.modules.paper.dto.PaperComposeRuleRequest;
import com.mindmark.server.modules.paper.dto.PaperComposeStrategy;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.bsc.langgraph4j.StateGraph;
import org.bsc.langgraph4j.state.AgentState;
import org.bsc.langgraph4j.state.Channel;
import org.bsc.langgraph4j.state.Channels;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import static org.bsc.langgraph4j.action.AsyncNodeAction.node_async;

@Service
public class LangGraphPaperComposePlanService {

    private static final Logger LOGGER = LoggerFactory.getLogger(LangGraphPaperComposePlanService.class);
    private static final String START = "__START__";
    private static final String END = "__END__";

    public PaperComposeAgentPlanResponse plan(PaperComposePlanContext context) {
        try {
            StateGraph<PaperComposePlanState> graph = new StateGraph<>(PaperComposePlanState.SCHEMA, PaperComposePlanState::new)
                .addNode("normalize_rules", node_async(this::normalizeRules))
                .addNode("analyze_quality", node_async(this::analyzeQuality))
                .addNode("build_plan", node_async(this::buildPlan))
                .addEdge(START, "normalize_rules")
                .addEdge("normalize_rules", "analyze_quality")
                .addEdge("analyze_quality", "build_plan")
                .addEdge("build_plan", END);

            PaperComposePlanState finalState = graph.compile()
                .invoke(Map.of("context", context))
                .orElseThrow();
            return require(finalState, "plan", PaperComposeAgentPlanResponse.class);
        } catch (Exception exception) {
            LOGGER.warn("Paper compose LangGraph planning failed, fallback to deterministic plan", exception);
            return fallbackPlan(context);
        }
    }

    private Map<String, Object> normalizeRules(PaperComposePlanState state) {
        PaperComposePlanContext context = require(state, "context", PaperComposePlanContext.class);
        List<String> normalized = context.rules().stream()
            .map(rule -> questionTypeLabel(rule.type()) + " " + rule.count() + " 道 × "
                + rule.score().stripTrailingZeros().toPlainString() + " 分"
                + formatRuleConstraints(rule))
            .toList();
        return Map.of("normalizedRules", normalized);
    }

    private Map<String, Object> analyzeQuality(PaperComposePlanState state) {
        PaperComposePlanContext context = require(state, "context", PaperComposePlanContext.class);
        ArrayList<String> findings = new ArrayList<>();
        findings.add("目标总分 " + formatScore(context.targetScore()) + " 分，计划完成后 "
            + formatScore(context.plannedFinalScore()) + " 分。");
        findings.add("计划新增 " + context.plannedAddedCount() + " 道题，覆盖 "
            + context.qualityReport().knowledgePointCount() + " 个知识点。");
        findings.add("当前试卷基准分 " + formatScore(context.currentScore()) + " 分，本次规则分 "
            + formatScore(context.plannedAddedScore()) + " 分。");

        if (context.qualityReport().risks().isEmpty()) {
            findings.add("未发现明显题型、难度或知识点覆盖风险，可进入教师复核与发布前检查。");
        } else {
            findings.add("需要关注：" + String.join("；", context.qualityReport().risks()));
        }

        ArrayList<String> recommendations = new ArrayList<>();
        recommendations.addAll(context.qualityReport().risks());
        if (recommendations.isEmpty()) {
            recommendations.addAll(context.qualityReport().highlights());
        }
        recommendations.add("发布考试前建议抽查主观题评分点、填空题可接受答案与编程题测试用例描述。");
        recommendations.add("若用于正式考试，建议按课程章节目标复核知识点分布，避免单一章节题量过高。");
        return Map.of("qualityFindings", findings, "recommendations", recommendations);
    }

    private Map<String, Object> buildPlan(PaperComposePlanState state) {
        PaperComposePlanContext context = require(state, "context", PaperComposePlanContext.class);
        @SuppressWarnings("unchecked")
        List<String> normalizedRules = (List<String>) require(state, "normalizedRules", List.class);
        @SuppressWarnings("unchecked")
        List<String> qualityFindings = (List<String>) require(state, "qualityFindings", List.class);
        @SuppressWarnings("unchecked")
        List<String> recommendations = (List<String>) require(state, "recommendations", List.class);

        String modeLabel = context.mode() == PaperComposeMode.REPLACE ? "替换当前试题" : "追加到当前试题";
        String strategyLabel = context.strategy() == PaperComposeStrategy.AGENT ? "智能均衡组卷" : "随机组卷";
        ArrayList<String> rationale = new ArrayList<>();
        rationale.add("组卷对象：《" + context.paperTitle() + "》 / " + context.courseName());
        rationale.addAll(normalizedRules);
        rationale.addAll(qualityFindings);

        PaperComposeAgentPlanResponse plan = new PaperComposeAgentPlanResponse(
            "paper_compose_plan:v2(normalize_rules -> analyze_quality -> build_plan)",
            strategyLabel + "计划已生成，写入方式为“" + modeLabel + "”。",
            List.of(
                "解析教师设置的题型、题量、分值、难度和知识点约束，计算目标分一致性。",
                "限定当前试卷所属课程，只读取 ACTIVE 状态题库；追加模式会排除已选题。",
                "智能模式按难度 × 知识点分桶轮询抽取，降低同一难度或同一知识点过度集中风险。",
                "生成题型、难度、知识点覆盖质量报告；题库不足时只返回缺口，不写入试卷。",
                "正式组卷前由后端再次校验课程边界、题目状态、重复题和总分，并在事务中写入。"
            ),
            List.copyOf(rationale),
            List.copyOf(recommendations)
        );
        return Map.of("plan", plan);
    }

    private PaperComposeAgentPlanResponse fallbackPlan(PaperComposePlanContext context) {
        ArrayList<String> recommendations = new ArrayList<>();
        if (context.qualityReport().risks().isEmpty()) {
            recommendations.add("建议教师重点复核主观题评分点和编程题测试用例描述。");
        } else {
            recommendations.addAll(context.qualityReport().risks());
        }
        return new PaperComposeAgentPlanResponse(
            "paper_compose_plan:fallback",
            "已生成后端确定性组卷计划。",
            List.of("读取规则", "筛选题库", "校验库存", "生成质量报告", "后端写入"),
            context.rules().stream()
                .map(rule -> questionTypeLabel(rule.type()) + " " + rule.count() + " 道")
                .toList(),
            List.copyOf(recommendations)
        );
    }

    private String formatRuleConstraints(PaperComposeRuleRequest rule) {
        ArrayList<String> constraints = new ArrayList<>();
        if (rule.difficulties() != null && !rule.difficulties().isEmpty()) {
            constraints.add("难度 " + rule.difficulties().size() + " 档");
        }
        if (rule.knowledgePoints() != null && !rule.knowledgePoints().isEmpty()) {
            constraints.add("知识点 " + String.join(" / ", rule.knowledgePoints()));
        }
        return constraints.isEmpty() ? "" : "（" + String.join("，", constraints) + "）";
    }

    private String formatScore(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).stripTrailingZeros().toPlainString();
    }

    @SuppressWarnings("unchecked")
    private <T> T require(PaperComposePlanState state, String key, Class<T> type) {
        return (T) state.value(key).orElseThrow();
    }

    private String questionTypeLabel(QuestionType type) {
        return switch (type) {
            case SINGLE_CHOICE -> "单选题";
            case MULTIPLE_CHOICE -> "多选题";
            case TRUE_FALSE -> "判断题";
            case FILL_BLANK -> "填空题";
            case SHORT_ANSWER -> "简答题";
            case ESSAY -> "论述题";
            case CASE_ANALYSIS -> "案例分析题";
            case PROGRAMMING -> "编程题";
        };
    }

    public record PaperComposePlanContext(
        String paperId,
        String paperTitle,
        String courseName,
        PaperComposeMode mode,
        PaperComposeStrategy strategy,
        BigDecimal targetScore,
        BigDecimal currentScore,
        BigDecimal plannedAddedScore,
        BigDecimal plannedFinalScore,
        Integer plannedAddedCount,
        List<PaperComposeRuleRequest> rules,
        PaperComposeQualityReportResponse qualityReport
    ) implements Serializable {}

    public static class PaperComposePlanState extends AgentState {
        private static final PaperComposePlanContext EMPTY_CONTEXT = new PaperComposePlanContext(
            "",
            "",
            "",
            PaperComposeMode.REPLACE,
            PaperComposeStrategy.AGENT,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            0,
            List.of(),
            new PaperComposeQualityReportResponse(BigDecimal.ZERO, BigDecimal.ZERO, 0, 0, List.of(), List.of(), List.of(), List.of(), List.of(), List.of())
        );

        static final Map<String, Channel<?>> SCHEMA = Map.of(
            "context", Channels.base(() -> EMPTY_CONTEXT),
            "normalizedRules", Channels.base(() -> List.<String>of()),
            "qualityFindings", Channels.base(() -> List.<String>of()),
            "recommendations", Channels.base(() -> List.<String>of()),
            "plan", Channels.base(() -> new PaperComposeAgentPlanResponse("", "", List.of(), List.of(), List.of()))
        );

        public PaperComposePlanState(Map<String, Object> initData) {
            super(initData);
        }
    }
}