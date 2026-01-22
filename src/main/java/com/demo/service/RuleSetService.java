package com.demo.service;

import com.alibaba.fastjson.JSON;
import com.demo.common.RuleSet;
import lombok.extern.slf4j.Slf4j;
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

    private final String STORAGE_DIR = System.getProperty("java.io.tmpdir") + File.separator + "simple-rule-engine" + File.separator + "rulesets";

    @PostConstruct
    public void init() {
        File dir = new File(STORAGE_DIR);
        if (!dir.exists()) {
            if (dir.mkdirs()) {
                log.info("Created rule set storage directory: {}", STORAGE_DIR);
            }
        } else {
            log.info("Using rule set storage directory: {}", STORAGE_DIR);
        }
    }

    public List<RuleSet> getAllRuleSets() {
        try (Stream<Path> paths = Files.walk(Paths.get(STORAGE_DIR))) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".json"))
                    .map(this::readRuleSet)
                    .filter(rs -> rs != null)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.error("Failed to list rule sets", e);
            return Collections.emptyList();
        }
    }

    public void saveRuleSet(RuleSet ruleSet) {
        if (ruleSet == null || ruleSet.getName() == null) {
            throw new IllegalArgumentException("Rule Set or Name cannot be null");
        }
        Path path = Paths.get(STORAGE_DIR, ruleSet.getName() + ".json");
        try {
            String json = JSON.toJSONString(ruleSet, true);
            Files.write(path, json.getBytes(StandardCharsets.UTF_8));
            log.info("Saved rule set: {}", ruleSet.getName());
        } catch (IOException e) {
            log.error("Failed to save rule set: " + ruleSet.getName(), e);
            throw new RuntimeException("Failed to save rule set", e);
        }
    }

    public void deleteRuleSet(String name) {
        Path path = Paths.get(STORAGE_DIR, name + ".json");
        try {
            Files.deleteIfExists(path);
            log.info("Deleted rule set: {}", name);
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
