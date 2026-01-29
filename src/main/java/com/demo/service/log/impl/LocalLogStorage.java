package com.demo.service.log.impl;

import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.serializer.SerializerFeature;
import com.demo.engine.RuleExecutionResult;
import com.demo.model.log.ExecutionLogConfig;
import com.demo.model.log.ExecutionLogSummary;
import com.demo.service.log.ExecutionLogStorage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@Slf4j
@Service
public class LocalLogStorage implements ExecutionLogStorage {

    @Value("${app.storage.base-dir}")
    private String baseDir;

    private boolean enabled = true;

    @Override
    public void init(ExecutionLogConfig config) {
        this.enabled = config.getLocal().isEnabled();
    }

    @Override
    public String getType() {
        return "local";
    }

    @Override
    public boolean isReadable() {
        return true;
    }

    @Override
    public void save(String spaceId, String env, RuleExecutionResult result) {
        if (!enabled) return;

        try {
            // Re-parsing start time from output if available to ensure consistency, or use current time
            String dateStr;
            String timestamp;
            if (result.getOutput() != null && result.getOutput().containsKey("_startTime")) {
                String startTime = result.getOutput().getString("_startTime");
                // format: yyyy-MM-dd HH:mm:ss.SSS
                dateStr = startTime.substring(0, 10);
                // We need timestamp for filename. 
                // Let's just use executionId mostly, but old format was version_timestamp_uuid.
                // We'll generate a timestamp based on now for filename.
                timestamp = new SimpleDateFormat("HHmmssSSS").format(new Date()); 
            } else {
                Date now = new Date();
                dateStr = new SimpleDateFormat("yyyy-MM-dd").format(now);
                timestamp = new SimpleDateFormat("HHmmssSSS").format(now);
            }

            String version = result.getExecutedVersion() != null ? result.getExecutedVersion() : "unknown";
            String executionId = result.getExecutionId();
            String fileName = version + "_" + timestamp + "_" + executionId + ".json";

            File spaceDir = new File(baseDir + File.separator + "execution_logs" + File.separator + spaceId + File.separator + env + File.separator + dateStr);
            if (!spaceDir.exists()) {
                spaceDir.mkdirs();
            }

            File logFile = new File(spaceDir, fileName);
            String jsonContent = JSONObject.toJSONString(result, SerializerFeature.PrettyFormat);
            Files.write(logFile.toPath(), jsonContent.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Failed to write local execution log for space {} env {}", spaceId, env, e);
        }
    }

    @Override
    public List<ExecutionLogSummary> fetch(String spaceId, String date) {
        if (!enabled) return java.util.Collections.emptyList();

        // Assume production env for fetching by default, or we might need env parameter in fetch
        // Current requirement implies fetching logs generally. The old controller hardcoded "production".
        // Let's stick to "production" for fetch as per existing behavior, or maybe iterate all envs?
        // Let's stick to "production" as per RuleController behavior for now.
        String env = "production";

        File logDir = new File(baseDir + File.separator + "execution_logs" + File.separator + spaceId + File.separator + env + File.separator + date);
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

                if (json.containsKey("abTestId")) {
                    summary.setAbTestId(json.getString("abTestId"));
                }
                if (json.containsKey("abVariantId")) {
                    summary.setAbVariantId(json.getString("abVariantId"));
                }
                if (json.containsKey("executionId")) {
                    summary.setExecutionId(json.getString("executionId"));
                }

                String name = f.getName();
                if (json.containsKey("executedVersion")) {
                    summary.setVersion(json.getString("executedVersion"));
                } else {
                    int lastUnderscore = name.lastIndexOf('_');
                    if (lastUnderscore > 0) {
                        summary.setVersion(name.substring(0, lastUnderscore));
                    } else {
                        summary.setVersion("unknown");
                    }
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

    @Override
    public Object fetchDetail(String spaceId, String date, String fileName) {
         if (!enabled) return null;
         String env = "production";
         
         // Validate fileName
        if (fileName.contains(".." ) || fileName.contains("/") || fileName.contains("\\")) {
            throw new IllegalArgumentException("Invalid filename");
        }

        File logFile = new File(baseDir + File.separator + "execution_logs" + File.separator + spaceId + File.separator + env + File.separator + date + File.separator + fileName);

        if (!logFile.exists()) {
            return null;
        }

        try {
            String content = new String(Files.readAllBytes(logFile.toPath()), StandardCharsets.UTF_8);
            return JSONObject.parse(content);
        } catch (Exception e) {
            log.error("Failed to read log file: " + fileName, e);
            throw new RuntimeException("Failed to read log");
        }
    }
}
