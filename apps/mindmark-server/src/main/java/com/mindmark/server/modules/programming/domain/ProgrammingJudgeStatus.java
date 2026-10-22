package com.mindmark.server.modules.programming.domain;

public enum ProgrammingJudgeStatus {
    QUEUED,
    RUNNING,
    ACCEPTED,
    WRONG_ANSWER,
    PARTIAL_ACCEPTED,
    COMPILE_ERROR,
    RUNTIME_ERROR,
    TIME_LIMIT_EXCEEDED,
    MEMORY_LIMIT_EXCEEDED,
    SYSTEM_ERROR,
    CANCELLED
}
