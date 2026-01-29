package com.demo.service.log;

import com.demo.engine.RuleExecutionResult;
import com.demo.model.log.ExecutionLogConfig;
import com.demo.model.log.ExecutionLogSummary;

import java.util.List;

public interface ExecutionLogStorage {
    
    /**
     * Initializes the storage with configuration.
     */
    void init(ExecutionLogConfig config);

    /**
     * Saves the execution log.
     */
    void save(String spaceId, String env, RuleExecutionResult result);

    /**
     * Fetches log summaries for a specific date.
     * Only supported by "readable" storages (Local, S3, ES).
     */
    List<ExecutionLogSummary> fetch(String spaceId, String date);

    /**
     * Fetches details for a specific log entry.
     */
    Object fetchDetail(String spaceId, String date, String fileNameOrId);

    /**
     * Returns true if this storage supports fetching logs.
     */
    boolean isReadable();
    
    String getType();
}
