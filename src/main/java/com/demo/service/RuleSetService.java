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
import java.util.Collections;
import java.util.List;
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
