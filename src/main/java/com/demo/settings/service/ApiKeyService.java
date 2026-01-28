package com.demo.settings.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.serializer.SerializerFeature;
import com.demo.settings.model.ApiKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ApiKeyService {

    @Value("${app.storage.base-dir}")
    private String baseDir;

    private final Map<String, ApiKey> apiKeyMap = new ConcurrentHashMap<>();
    private File storageFile;

    @PostConstruct
    public void init() {
        File settingsDir = new File(baseDir + File.separator + "settings");
        if (!settingsDir.exists()) {
            settingsDir.mkdirs();
        }
        storageFile = new File(settingsDir, "api-keys.json");
        loadKeys();
    }

    private void loadKeys() {
        if (!storageFile.exists()) {
            return;
        }
        try {
            String content = new String(Files.readAllBytes(storageFile.toPath()), StandardCharsets.UTF_8);
            List<ApiKey> keys = JSON.parseArray(content, ApiKey.class);
            if (keys != null) {
                keys.forEach(k -> apiKeyMap.put(k.getKey(), k));
            }
        } catch (Exception e) {
            log.error("Failed to load api keys", e);
        }
    }

    private void saveKeys() {
        try {
            String content = JSON.toJSONString(new ArrayList<>(apiKeyMap.values()), SerializerFeature.PrettyFormat);
            Files.write(storageFile.toPath(), content.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Failed to save api keys", e);
        }
    }

    public List<ApiKey> listKeys() {
        return apiKeyMap.values().stream()
                .sorted(Comparator.comparing(ApiKey::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    public ApiKey createKey(String name) {
        String key = "sk-" + UUID.randomUUID().toString().replace("-", "") + 
                     UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        
        ApiKey apiKey = new ApiKey();
        apiKey.setId(UUID.randomUUID().toString());
        apiKey.setName(name);
        apiKey.setKey(key);
        apiKey.setMaskedKey("sk-..." + key.substring(key.length() - 4));
        apiKey.setCreatedAt(System.currentTimeMillis());
        
        apiKeyMap.put(key, apiKey);
        saveKeys();
        return apiKey;
    }

    public void deleteKey(String id) {
        apiKeyMap.values().removeIf(k -> k.getId().equals(id));
        saveKeys();
    }

    public boolean validateKey(String key) {
        ApiKey apiKey = apiKeyMap.get(key);
        if (apiKey != null) {
            apiKey.setLastUsedAt(System.currentTimeMillis());
            // Ideally we should persist the lastUsedAt update, 
            // but for performance we might want to do it async or periodically.
            // For this simple implementation, we'll save it.
            saveKeys(); 
            return true;
        }
        return false;
    }
}
