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
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
public class RuleSetService {

    private final String BASE_DIR;

    public RuleSetService(@Value("${app.storage.base-dir}") String baseDir) {
        this.BASE_DIR = baseDir;
    }

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

    private Path getProductionPath(String spaceId) {
        return Paths.get(BASE_DIR, "spaces", spaceId, "production");
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

    // Production Deployment Methods

    public void deploySnapshotToProduction(String spaceId, String ruleSetName, String snapshotFilename, String tag) {
        Path snapshotPath = getSnapshotPath(spaceId, ruleSetName).resolve(snapshotFilename);
        if (!Files.exists(snapshotPath)) {
            throw new RuntimeException("Snapshot not found: " + snapshotFilename);
        }

        Path prodDir = getProductionPath(spaceId);
        try {
            if (!Files.exists(prodDir)) {
                Files.createDirectories(prodDir);
            }

            // 1. Copy to active_ruleset.json
            Path activeRuleSetPath = prodDir.resolve("active_ruleset.json");
            Files.copy(snapshotPath, activeRuleSetPath, StandardCopyOption.REPLACE_EXISTING);

            // 2. Update config.json
            Map<String, String> config = new HashMap<>();
            config.put("ruleSet", ruleSetName);
            config.put("version", snapshotFilename);
            if (tag != null) {
                config.put("tag", tag);
            }
            config.put("deployedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            Path configPath = prodDir.resolve("config.json");
            Files.write(configPath, JSON.toJSONString(config, true).getBytes(StandardCharsets.UTF_8));

            log.info("Deployed snapshot {} (tag: {}) of {} to production in space {}", snapshotFilename, tag, ruleSetName, spaceId);

        } catch (IOException e) {
            log.error("Failed to deploy to production", e);
            throw new RuntimeException("Failed to deploy to production", e);
        }
    }

    public Map<String, Object> getProductionConfig(String spaceId) {
        Path configPath = getProductionPath(spaceId).resolve("config.json");
        if (!Files.exists(configPath)) {
            return null;
        }
        try {
            String content = new String(Files.readAllBytes(configPath), StandardCharsets.UTF_8);
            return JSON.parseObject(content, Map.class);
        } catch (IOException e) {
            log.error("Failed to read production config", e);
            return null;
        }
    }

    public RuleSet readProductionRuleSet(String spaceId) {
        Path path = getProductionPath(spaceId).resolve("active_ruleset.json");
        if (!Files.exists(path)) {
            return null;
        }
        return readRuleSet(path);
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

    // A/B Testing Support

    private Path getAbProductionPath(String spaceId) {
        return getProductionPath(spaceId).resolve("ab");
    }

    private Path getAbHistoryPath(String spaceId) {
        return getProductionPath(spaceId).resolve("ab_history");
    }

    public void deployAbTestPlan(String spaceId, com.demo.common.AbTestConfig config) {
        Path abDir = getAbProductionPath(spaceId);
        try {
            // 1. Clean up existing AB directory
            if (Files.exists(abDir)) {
                // simple recursive delete
                Files.walk(abDir)
                        .sorted(java.util.Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
            }
            Files.createDirectories(abDir);

            // 2. Copy variant rule sets
            for (com.demo.common.AbTestConfig.Variant variant : config.getVariants()) {
                Path snapshotPath = getSnapshotPath(spaceId, variant.getRuleSetName()).resolve(variant.getVersion());
                if (!Files.exists(snapshotPath)) {
                    throw new RuntimeException("Snapshot not found for variant " + variant.getName() + ": " + variant.getVersion());
                }

                Path targetPath = abDir.resolve(variant.getId() + ".json");
                Files.copy(snapshotPath, targetPath);
            }

            // 3. Save config
            if (config.getStartedAt() == null) {
                config.setStartedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }
            Path configPath = abDir.resolve("config.json");
            Files.write(configPath, JSON.toJSONString(config, true).getBytes(StandardCharsets.UTF_8));

            log.info("Deployed A/B test plan to space {}", spaceId);

        } catch (IOException e) {
            log.error("Failed to deploy A/B test plan", e);
            throw new RuntimeException("Failed to deploy A/B test plan", e);
        }
    }

    public com.demo.common.AbTestConfig getAbTestConfig(String spaceId) {
        Path configPath = getAbProductionPath(spaceId).resolve("config.json");
        if (!Files.exists(configPath)) {
            return null;
        }
        try {
            String content = new String(Files.readAllBytes(configPath), StandardCharsets.UTF_8);
            return JSON.parseObject(content, com.demo.common.AbTestConfig.class);
        } catch (IOException e) {
            log.error("Failed to read A/B test config", e);
            return null;
        }
    }

    public void archiveAbTestPlan(String spaceId, com.demo.common.AbTestConfig config) {
        if (config == null) return;
        Path historyDir = getAbHistoryPath(spaceId);
        try {
            if (!Files.exists(historyDir)) {
                Files.createDirectories(historyDir);
            }
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = "ab_" + timestamp + ".json";
            Path archivePath = historyDir.resolve(filename);

            Files.write(archivePath, JSON.toJSONString(config, true).getBytes(StandardCharsets.UTF_8));
            log.info("Archived A/B test plan to {}", filename);
        } catch (IOException e) {
             log.error("Failed to archive A/B test plan", e);
        }
    }

    public void deleteAbTestPlan(String spaceId) {
        // Archive first
        com.demo.common.AbTestConfig current = getAbTestConfig(spaceId);
        if (current != null) {
            current.setActive(false);
            if (current.getEndedAt() == null) {
                current.setEndedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }
            archiveAbTestPlan(spaceId, current);
        }

        Path abDir = getAbProductionPath(spaceId);
        if (Files.exists(abDir)) {
            try {
                Files.walk(abDir)
                        .sorted(java.util.Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
                log.info("Deleted A/B test plan for space {}", spaceId);
            } catch (IOException e) {
                log.error("Failed to delete A/B test plan", e);
                throw new RuntimeException("Failed to delete A/B test plan", e);
            }
        }
    }

    public List<com.demo.common.AbTestConfig> getAbTestHistory(String spaceId) {
        Path historyDir = getAbHistoryPath(spaceId);
        if (!Files.exists(historyDir)) return Collections.emptyList();

        List<com.demo.common.AbTestConfig> history = new ArrayList<>();
        try (Stream<Path> paths = Files.list(historyDir)) {
            paths.filter(Files::isRegularFile)
                 .filter(p -> p.toString().endsWith(".json"))
                 .forEach(p -> {
                     try {
                         String content = new String(Files.readAllBytes(p), StandardCharsets.UTF_8);
                         history.add(JSON.parseObject(content, com.demo.common.AbTestConfig.class));
                     } catch (Exception e) {
                         log.error("Failed to read history file " + p, e);
                     }
                 });
        } catch (IOException e) {
            log.error("Failed to list A/B history", e);
        }
        // Sort by startedAt desc
        history.sort((a, b) -> {
            String t1 = a.getStartedAt() != null ? a.getStartedAt() : "";
            String t2 = b.getStartedAt() != null ? b.getStartedAt() : "";
            return t2.compareTo(t1);
        });
        return history;
    }

    public RuleSet readVariantRuleSet(String spaceId, String variantId) {
        Path path = getAbProductionPath(spaceId).resolve(variantId + ".json");
        if (!Files.exists(path)) {
            return null;
        }
        return readRuleSet(path);
    }
}
