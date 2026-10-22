package com.mindmark.server.modules.paper.dto;

import java.io.Serializable;
import java.util.List;

public record PaperComposeAgentPlanResponse(
    String workflow,
    String summary,
    List<String> steps,
    List<String> rationale,
    List<String> recommendations
) implements Serializable {}