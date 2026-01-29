package com.demo.service.log.impl;

import com.alibaba.fastjson.JSONObject;
import com.demo.engine.RuleExecutionResult;
import com.demo.model.log.ExecutionLogConfig;
import com.demo.model.log.ExecutionLogSummary;
import com.demo.service.log.ExecutionLogStorage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class S3LogStorage implements ExecutionLogStorage {

    private boolean enabled = false;
    private S3Client s3Client;
    private String bucketName;

    @Override
    public void init(ExecutionLogConfig config) {
        ExecutionLogConfig.S3Config s3Config = config.getS3();
        this.enabled = s3Config.isEnabled();
        this.bucketName = s3Config.getBucket();

        if (this.enabled) {
            try {
                var builder = S3Client.builder()
                        .region(Region.of(s3Config.getRegion()))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(s3Config.getAccessKey(), s3Config.getSecretKey())
                        ));

                if (s3Config.getEndpoint() != null && !s3Config.getEndpoint().isEmpty()) {
                    builder.endpointOverride(URI.create(s3Config.getEndpoint()));
                }

                this.s3Client = builder.build();
            } catch (Exception e) {
                log.error("Failed to initialize S3 client", e);
                this.enabled = false;
            }
        }
    }

    @Override
    public String getType() {
        return "s3";
    }

    @Override
    public boolean isReadable() {
        return true;
    }

    @Override
    public void save(String spaceId, String env, RuleExecutionResult result) {
        if (!enabled || s3Client == null) return;

        try {
            String dateStr;
            String timestamp;
            if (result.getOutput() != null && result.getOutput().containsKey("_startTime")) {
                String startTime = result.getOutput().getString("_startTime");
                dateStr = startTime.substring(0, 10);
                timestamp = new SimpleDateFormat("HHmmssSSS").format(new Date());
            } else {
                Date now = new Date();
                dateStr = new SimpleDateFormat("yyyy-MM-dd").format(now);
                timestamp = new SimpleDateFormat("HHmmssSSS").format(now);
            }

            String version = result.getExecutedVersion() != null ? result.getExecutedVersion() : "unknown";
            String executionId = result.getExecutionId();
            // Key structure: execution_logs/{spaceId}/{env}/{date}/{fileName}
            String fileName = version + "_" + timestamp + "_" + executionId + ".json";
            String key = "execution_logs/" + spaceId + "/" + env + "/" + dateStr + "/" + fileName;

            String jsonContent = JSONObject.toJSONString(result);
            
            s3Client.putObject(PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType("application/json")
                    .build(), RequestBody.fromString(jsonContent, StandardCharsets.UTF_8));

        } catch (Exception e) {
            log.error("Failed to upload log to S3", e);
        }
    }

    @Override
    public List<ExecutionLogSummary> fetch(String spaceId, String date) {
        if (!enabled || s3Client == null) return java.util.Collections.emptyList();

        String env = "production";
        String prefix = "execution_logs/" + spaceId + "/" + env + "/" + date + "/";

        try {
            ListObjectsV2Response response = s3Client.listObjectsV2(ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .build());

            return response.contents().stream()
                    .filter(obj -> obj.key().endsWith(".json"))
                    .map(obj -> {
                        // In a real S3 scenario, listing doesn't give content. 
                        // We might need to fetch content to get details like duration, or encode them in metadata/filename.
                        // For performance, we should probably encode metadata in filename or assume we only get basic info here.
                        // Existing Local storage reads file content. Doing that for S3 list is expensive (N+1 requests).
                        // Let's implement a lighter version or just accept the latency for now/fetch strictly necessary info if possible.
                        // For the summary list, we might not have all details if not in filename.
                        // Filename: version_timestamp_executionId.json
                        
                        String key = obj.key();
                        String fileName = key.substring(key.lastIndexOf('/') + 1);
                        ExecutionLogSummary summary = new ExecutionLogSummary();
                        summary.setFileName(fileName);
                        
                        // Extract from filename
                        String name = fileName;
                        if (name.endsWith(".json")) name = name.substring(0, name.length() - 5);
                        String[] parts = name.split("_");
                        if (parts.length >= 3) {
                            summary.setVersion(parts[0]);
                            // timestamp is parts[1] (HHmmssSSS), but we don't have full date in filename (it's in path)
                            // We can construct start time approximately or leave it.
                            summary.setExecutionId(parts[2]);
                        }
                        
                        // To get full details (startTime, duration, abTest), we'd need to read the object.
                        // For this exercise, let's skip reading body for list to avoid 100 HTTP calls for 100 logs.
                        // We will return what we can from filename.
                        
                        return summary;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to list logs from S3", e);
            return java.util.Collections.emptyList();
        }
    }

    @Override
    public Object fetchDetail(String spaceId, String date, String fileName) {
        if (!enabled || s3Client == null) return null;

        String env = "production";
        String key = "execution_logs/" + spaceId + "/" + env + "/" + date + "/" + fileName;

        try {
            var response = s3Client.getObjectAsBytes(GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build());
            
            String content = response.asUtf8String();
            return JSONObject.parse(content);
        } catch (Exception e) {
            log.error("Failed to fetch log detail from S3", e);
            return null;
        }
    }
}
