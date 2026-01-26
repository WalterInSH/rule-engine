package com.demo.controller;

import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.serializer.SerializerFeature;
import com.demo.common.Rule;
import com.demo.engine.RuleEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/spaces/{spaceId}/rules")
@RequiredArgsConstructor
@Slf4j
public class RuleController {

    private final RuleEngine ruleEngine;

    @Value("${app.storage.base-dir}")
    private String baseDir;

    @GetMapping("/logs")
    public List<ExecutionLogSummary> getExecutionLogs(
            @PathVariable String spaceId,
            @RequestParam(required = false) String date) {
        
        if (date == null || date.isEmpty()) {
            date = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        }
        
        // Log path: execution_logs/{spaceId}/production/{date}
        File logDir = new File(baseDir + File.separator + "execution_logs" + File.separator + spaceId + File.separator + "production" + File.separator + date);
        if (!logDir.exists() || !logDir.isDirectory()) {
            return java.util.Collections.emptyList();
        }

        File[] files = logDir.listFiles((dir, name) -> name.endsWith(".json"));
        if (files == null) {
            return java.util.Collections.emptyList();
        }

        List<ExecutionLogSummary> summaries = new java.util.ArrayList<>();
        for (File f : files) {
            try {
                String content = new String(Files.readAllBytes(f.toPath()), StandardCharsets.UTF_8);
                JSONObject json = JSONObject.parseObject(content);
                
                ExecutionLogSummary summary = new ExecutionLogSummary();
                summary.setFileName(f.getName());
                
                if (json.containsKey("output") && json.get("output") instanceof JSONObject) {
                    JSONObject output = json.getJSONObject("output");
                    summary.setStartTime(output.getString("_startTime"));
                    summary.setDurationMs(output.getLongValue("_durationMs"));
                } else {
                    summary.setStartTime(json.getString("_startTime"));
                    summary.setDurationMs(json.getLongValue("_durationMs"));
                }
                
                String name = f.getName();
                int lastUnderscore = name.lastIndexOf('_');
                if (lastUnderscore > 0) {
                     summary.setVersion(name.substring(0, lastUnderscore));
                } else {
                     summary.setVersion("unknown");
                }

                summaries.add(summary);
            } catch (Exception e) {
                log.error("Failed to read log file: " + f.getName(), e);
            }
        }
        
        // Sort by startTime desc
        summaries.sort((a, b) -> {
            if (b.getStartTime() == null) return -1;
            if (a.getStartTime() == null) return 1;
            return b.getStartTime().compareTo(a.getStartTime());
        });
        
        return summaries;
    }

    @lombok.Data
    public static class ExecutionLogSummary {
        private String fileName;
        private String version;
        private String startTime;
        private long durationMs;
    }

    @PostMapping("/execute")
    public com.demo.engine.RuleExecutionResult execute(
            @PathVariable String spaceId, 
            @RequestBody JSONObject params,
            @RequestParam(required = false, defaultValue = "dev") String env) {
        
        long start = System.currentTimeMillis();
        com.demo.engine.RuleExecutionResult result = ruleEngine.execute(spaceId, params, env);
        long duration = System.currentTimeMillis() - start;
        
        Date now = new Date(start);
        String dateStr = new SimpleDateFormat("yyyy-MM-dd").format(now);
        String timeStr = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS").format(now);
        
        if (result.getOutput() != null) {
            result.getOutput().put("_startTime", timeStr);
            result.getOutput().put("_durationMs", duration);
        }
        
        // Log execution to file only if production
        if ("production".equalsIgnoreCase(env)) {
            try {
                String version = ruleEngine.getCurrentVersion(spaceId, env);
                String timestamp = new SimpleDateFormat("HHmmssSSS").format(now);
                String fileName = version + "_" + timestamp + ".json";
                
                File spaceDir = new File(baseDir + File.separator + "execution_logs" + File.separator + spaceId + File.separator + "production" + File.separator + dateStr);
                if (!spaceDir.exists()) {
                    spaceDir.mkdirs();
                }
                
                File logFile = new File(spaceDir, fileName);
                String jsonContent = JSONObject.toJSONString(result, SerializerFeature.PrettyFormat);
                Files.write(logFile.toPath(), jsonContent.getBytes(StandardCharsets.UTF_8));
            } catch (Exception e) {
                log.error("Failed to write execution log for space {} env {}", spaceId, env, e);
            }
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
