package com.demo.service;

import com.alibaba.fastjson.JSON;
import com.demo.common.RuleSet;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
public class RuleSetService {

    private final String BASE_DIR;

    public RuleSetService(@Value("${app.storage.base-dir}") String baseDir) {
        this.BASE_DIR = baseDir;
    }
    
    // ... existing code ...

    @PostConstruct
    public void init() {
        // Migration logic: Move legacy rulesets to default space
        Path legacyDir = Paths.get(BASE_DIR, "rulesets");
        Path defaultSpaceDir = Paths.get(BASE_DIR, "spaces", "default", "rulesets");
        
        if (Files.exists(legacyDir) && Files.isDirectory(legacyDir)) {
            try {
                if (!Files.exists(defaultSpaceDir)) {
                    Files.createDirectories(defaultSpaceDir);
                }
                
                try (Stream<Path> paths = Files.list(legacyDir)) {
                    paths.filter(Files::isRegularFile)
                         .filter(p -> p.toString().endsWith(".json"))
                         .forEach(p -> {
                             try {
                                 Files.move(p, defaultSpaceDir.resolve(p.getFileName()));
                                 log.info("Migrated legacy ruleset {} to default space", p.getFileName());
                             } catch (IOException e) {
                                 log.error("Failed to migrate " + p, e);
                             }
                         });
                }
                // Optional: remove legacy dir if empty
                // Files.deleteIfExists(legacyDir);
            } catch (IOException e) {
                log.error("Migration failed", e);
            }
        }
    }

    private Path getStoragePath(String spaceId) {
        return Paths.get(BASE_DIR, "spaces", spaceId, "rulesets");
    }

    private Path getSnapshotPath(String spaceId, String ruleSetName) {
        return Paths.get(BASE_DIR, "spaces", spaceId, "snapshots", ruleSetName);
    }

    public List<RuleSet> getAllRuleSets(String spaceId) {
        Path dir = getStoragePath(spaceId);
        if (!Files.exists(dir)) return Collections.emptyList();

        try (Stream<Path> paths = Files.walk(dir)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".json"))
                    .map(this::readRuleSet)
                    .filter(rs -> rs != null)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.error("Failed to list rule sets for space " + spaceId, e);
            return Collections.emptyList();
        }
    }

    public void saveRuleSet(String spaceId, RuleSet ruleSet) {
        if (ruleSet == null || ruleSet.getName() == null) {
            throw new IllegalArgumentException("Rule Set or Name cannot be null");
        }
        Path dir = getStoragePath(spaceId);
        if (!Files.exists(dir)) {
            try {
                Files.createDirectories(dir);
            } catch (IOException e) {
                throw new RuntimeException("Failed to create directory " + dir, e);
            }
        }

        Path path = dir.resolve(ruleSet.getName() + ".json");
        try {
            String json = JSON.toJSONString(ruleSet, true);
            Files.write(path, json.getBytes(StandardCharsets.UTF_8));
            log.info("Saved rule set: {} in space {}", ruleSet.getName(), spaceId);
        } catch (IOException e) {
            log.error("Failed to save rule set: " + ruleSet.getName(), e);
            throw new RuntimeException("Failed to save rule set", e);
        }
    }

    public void snapshotRuleSet(String spaceId, String ruleSetName, String tag) {
        Path currentPath = getStoragePath(spaceId).resolve(ruleSetName + ".json");
        if (!Files.exists(currentPath)) {
            throw new RuntimeException("Rule set not found: " + ruleSetName);
        }

        Path snapshotDir = getSnapshotPath(spaceId, ruleSetName);
        try {
            if (!Files.exists(snapshotDir)) {
                Files.createDirectories(snapshotDir);
            }
            
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = timestamp + "_" + tag + ".json";
            Path snapshotPath = snapshotDir.resolve(filename);
            
            Files.copy(currentPath, snapshotPath);
            log.info("Created snapshot {} for rule set {} in space {}", filename, ruleSetName, spaceId);
        } catch (IOException e) {
            log.error("Failed to create snapshot for rule set: " + ruleSetName, e);
            throw new RuntimeException("Failed to create snapshot", e);
        }
    }

    public List<Map<String, String>> getRuleSetVersions(String spaceId, String ruleSetName) {
        Path snapshotDir = getSnapshotPath(spaceId, ruleSetName);
        if (!Files.exists(snapshotDir)) {
            return Collections.emptyList();
        }

        List<Map<String, String>> versions = new ArrayList<>();
        try (Stream<Path> paths = Files.list(snapshotDir)) {
            paths.filter(Files::isRegularFile)
                 .filter(p -> p.toString().endsWith(".json"))
                 .forEach(p -> {
                     String filename = p.getFileName().toString();
                     // Expected format: yyyyMMdd_HHmmss_tag.json
                     // Simple parsing
                     Map<String, String> info = new HashMap<>();
                     info.put("filename", filename);
                     
                     String nameWithoutExt = filename.substring(0, filename.length() - 5);
                     String[] parts = nameWithoutExt.split("_", 3);
                     if (parts.length >= 3) {
                         info.put("date", parts[0]);
                         info.put("time", parts[1]);
                         info.put("tag", parts[2]);
                     } else {
                         info.put("tag", nameWithoutExt);
                     }
                     versions.add(info);
                 });
        } catch (IOException e) {
            log.error("Failed to list snapshots for rule set: " + ruleSetName, e);
        }
        
        // Sort by filename descending (newest first)
        versions.sort((a, b) -> b.get("filename").compareTo(a.get("filename")));
        return versions;
    }

    public void restoreRuleSetVersion(String spaceId, String ruleSetName, String versionFilename) {
        Path snapshotPath = getSnapshotPath(spaceId, ruleSetName).resolve(versionFilename);
        if (!Files.exists(snapshotPath)) {
            throw new RuntimeException("Snapshot not found: " + versionFilename);
        }
        
        Path targetPath = getStoragePath(spaceId).resolve(ruleSetName + ".json");
        try {
            // Backup current before restore? Maybe too complex for now. The user can snapshot before restore.
            Files.copy(snapshotPath, targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            log.info("Restored rule set {} from snapshot {} in space {}", ruleSetName, versionFilename, spaceId);
        } catch (IOException e) {
            log.error("Failed to restore rule set: " + ruleSetName, e);
            throw new RuntimeException("Failed to restore rule set", e);
        }
    }

    public void deleteRuleSet(String spaceId, String name) {
        Path path = getStoragePath(spaceId).resolve(name + ".json");
        try {
            Files.deleteIfExists(path);
            log.info("Deleted rule set: {} from space {}", name, spaceId);
        } catch (IOException e) {
            log.error("Failed to delete rule set: " + name, e);
            throw new RuntimeException("Failed to delete rule set", e);
        }
    }

    private RuleSet readRuleSet(Path path) {
        try {
            String content = new String(Files.readAllBytes(path), StandardCharsets.UTF_8);
            return JSON.parseObject(content, RuleSet.class);
        } catch (Exception e) {
            log.error("Failed to read rule set from file: " + path, e);
            return null;
        }
    }
}
