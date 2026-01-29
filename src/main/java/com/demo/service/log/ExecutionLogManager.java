package com.demo.service.log;

import com.alibaba.fastjson.JSONObject;
import com.demo.engine.RuleExecutionResult;
import com.demo.model.log.ExecutionLogConfig;
import com.demo.model.log.ExecutionLogSummary;
import com.demo.service.log.impl.ElasticsearchLogStorage;
import com.demo.service.log.impl.KafkaLogStorage;
import com.demo.service.log.impl.LocalLogStorage;
import com.demo.service.log.impl.S3LogStorage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class ExecutionLogManager {

    private final List<ExecutionLogStorage> storages = new ArrayList<>();
    
    // Inject implementations
    private final LocalLogStorage localStorage;
    private final S3LogStorage s3Storage;
    private final KafkaLogStorage kafkaStorage;
    private final ElasticsearchLogStorage elasticsearchStorage;

    @Value("${app.storage.base-dir}")
    private String baseDir;
    
    private ExecutionLogConfig currentConfig;

    public ExecutionLogManager(LocalLogStorage localStorage,
                               S3LogStorage s3Storage,
                               KafkaLogStorage kafkaStorage,
                               ElasticsearchLogStorage elasticsearchStorage) {
        this.localStorage = localStorage;
        this.s3Storage = s3Storage;
        this.kafkaStorage = kafkaStorage;
        this.elasticsearchStorage = elasticsearchStorage;
        
        storages.add(localStorage);
        storages.add(s3Storage);
        storages.add(kafkaStorage);
        storages.add(elasticsearchStorage);
    }

    @PostConstruct
    public void init() {
        loadConfig();
    }

    public synchronized void loadConfig() {
        // Load config from file
        File configFile = new File(baseDir + File.separator + "execution_logs" + File.separator + "config.json");
        if (configFile.exists()) {
            try {
                String content = new String(Files.readAllBytes(configFile.toPath()), StandardCharsets.UTF_8);
                this.currentConfig = JSONObject.parseObject(content, ExecutionLogConfig.class);
            } catch (Exception e) {
                log.error("Failed to load execution log config", e);
                this.currentConfig = new ExecutionLogConfig(); // default
            }
        } else {
            this.currentConfig = new ExecutionLogConfig();
        }

        // Init all storages
        for (ExecutionLogStorage storage : storages) {
            storage.init(this.currentConfig);
        }
    }

    public synchronized void saveConfig(ExecutionLogConfig config) {
        try {
            this.currentConfig = config;
            File configFile = new File(baseDir + File.separator + "execution_logs" + File.separator + "config.json");
            if (!configFile.getParentFile().exists()) {
                configFile.getParentFile().mkdirs();
            }
            String content = JSONObject.toJSONString(config, true);
            Files.write(configFile.toPath(), content.getBytes(StandardCharsets.UTF_8));
            
            // Re-init
            for (ExecutionLogStorage storage : storages) {
                storage.init(this.currentConfig);
            }
        } catch (Exception e) {
            log.error("Failed to save execution log config", e);
            throw new RuntimeException("Failed to save config");
        }
    }
    
    public ExecutionLogConfig getConfig() {
        return this.currentConfig;
    }

    public void log(String spaceId, String env, RuleExecutionResult result) {
        for (ExecutionLogStorage storage : storages) {
            try {
                storage.save(spaceId, env, result);
            } catch (Exception e) {
                log.error("Error saving log to storage: " + storage.getType(), e);
            }
        }
    }

    public List<ExecutionLogSummary> fetchLogs(String spaceId, String date, String preferredStorageType) {
        // Find storage to fetch from
        ExecutionLogStorage storage = null;
        
        if (preferredStorageType != null && !preferredStorageType.isEmpty()) {
            storage = storages.stream()
                    .filter(s -> s.getType().equals(preferredStorageType) && s.isReadable())
                    .findFirst()
                    .orElse(null);
        }
        
        // Default to local if not specified or not found
        if (storage == null) {
            storage = localStorage;
        }

        // If local is disabled, try to find any readable enabled storage
        if (storage == localStorage && !currentConfig.getLocal().isEnabled()) {
             storage = storages.stream()
                     .filter(s -> s.isReadable() && isEnabled(s))
                     .findFirst()
                     .orElse(null);
        }

        if (storage != null) {
             return storage.fetch(spaceId, date);
        }
        
        return new ArrayList<>();
    }
    
    private boolean isEnabled(ExecutionLogStorage s) {
        if (s instanceof LocalLogStorage) return currentConfig.getLocal().isEnabled();
        if (s instanceof S3LogStorage) return currentConfig.getS3().isEnabled();
        if (s instanceof ElasticsearchLogStorage) return currentConfig.getElasticsearch().isEnabled();
        return false;
    }

    public Object fetchLogDetail(String spaceId, String date, String fileName, String preferredStorageType) {
         // Similar logic to fetchLogs
         ExecutionLogStorage storage = null;
         if (preferredStorageType != null) {
             storage = storages.stream()
                    .filter(s -> s.getType().equals(preferredStorageType) && s.isReadable())
                    .findFirst()
                    .orElse(null);
         }
         if (storage == null) storage = localStorage;
         
          if (storage == localStorage && !currentConfig.getLocal().isEnabled()) {
             storage = storages.stream()
                     .filter(s -> s.isReadable() && isEnabled(s))
                     .findFirst()
                     .orElse(null);
        }

         if (storage != null) {
             return storage.fetchDetail(spaceId, date, fileName);
         }
         return null;
    }
}
