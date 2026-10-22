package com.mindmark.server.modules.ai.provider;

import com.mindmark.server.modules.review.dto.ExamReviewReportResponse;

public interface LectureDraftProvider {
    String providerCode();

    boolean available();

    LectureDraftGenerationResult generate(ExamReviewReportResponse report);
}
