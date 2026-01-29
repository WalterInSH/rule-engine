package com.demo.controller;

import com.alibaba.fastjson.JSONObject;
import com.demo.engine.RuleEngine;
import com.demo.engine.RuleExecutionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/spaces/{spaceId}/rules")
@RequiredArgsConstructor
@Slf4j
public class RuleController {

    private final RuleEngine ruleEngine;
    private final com.demo.service.log.ExecutionLogManager logManager;

    @Value("${app.storage.base-dir}")
    private String baseDir;

    @GetMapping("/logs")
    public List<com.demo.model.log.ExecutionLogSummary> getExecutionLogs(
            @PathVariable String spaceId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String storage) {

        if (date == null || date.isEmpty()) {
            date = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        }

        return logManager.fetchLogs(spaceId, date, storage);
    }

    @GetMapping("/logs/{fileName}")
    public Object getExecutionLogDetail(
            @PathVariable String spaceId,
            @PathVariable String fileName,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String storage) {

        if (date == null || date.isEmpty()) {
            date = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        }

        return logManager.fetchLogDetail(spaceId, date, fileName, storage);
    }

    // Removed internal ExecutionLogSummary class as it is now in model package

    @PostMapping("/execute")
    public RuleExecutionResult execute(
            @PathVariable String spaceId,
            @RequestBody JSONObject params,
            @RequestParam(required = false, defaultValue = "dev") String env) {

        long start = System.currentTimeMillis();
        RuleExecutionResult result = ruleEngine.execute(spaceId, params, env);
        long duration = System.currentTimeMillis() - start;

        // Generate Execution ID
        String executionId = java.util.UUID.randomUUID().toString();
        result.setExecutionId(executionId);

        Date now = new Date(start);
        String dateStr = new SimpleDateFormat("yyyy-MM-dd").format(now);
        String timeStr = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS").format(now);

        if (result.getOutput() != null) {
            result.getOutput().put("_startTime", timeStr);
            result.getOutput().put("_durationMs", duration);
        }

        // Log execution
        if ("production".equalsIgnoreCase(env)) {
            logManager.log(spaceId, env, result);
        }

        return result;
    }

    @PostMapping("/reload")
    public String reload(
            @PathVariable String spaceId,
            @RequestBody com.demo.common.RuleSet ruleSet,
            @RequestParam(required = false, defaultValue = "dev") String env) {

        ruleEngine.loadRules(spaceId, ruleSet, env);
        return "Loaded " + (ruleSet.getRules() != null ? ruleSet.getRules().size() : 0) + " rules for space " + spaceId + " env " + env;
    }
}
