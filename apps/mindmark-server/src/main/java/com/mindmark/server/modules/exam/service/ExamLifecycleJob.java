package com.mindmark.server.modules.exam.service;

import java.time.OffsetDateTime;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ExamLifecycleJob {

    private final ExamLifecycleService examLifecycleService;

    public ExamLifecycleJob(ExamLifecycleService examLifecycleService) {
        this.examLifecycleService = examLifecycleService;
    }

    @Scheduled(fixedDelayString = "${mindmark.exam.lifecycle.finalize-fixed-delay-ms:30000}")
    public void finalizeEndedExams() {
        examLifecycleService.finalizeDueExams(OffsetDateTime.now());
    }
}