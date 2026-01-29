package com.demo.model.log;

import lombok.Data;

@Data
public class ExecutionLogSummary {
    private String fileName;
    private String version;
    private String executionId;
    private String startTime;
    private long durationMs;
    private String abTestId;
    private String abVariantId;
}
