package com.demo.engine;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.demo.builder.SimpleRuleBuilder;
import com.demo.common.Rule;
import com.demo.compiler.CompilerUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Scanner;

@Service
@Slf4j
public class RuleEngine {
    private volatile List<RunTimeRule> activeRules = new ArrayList<>();
    private volatile List<String> activeInternalModels = new ArrayList<>();
    private volatile String currentSpaceId = "default";
    private volatile String currentVersion = "init";

    private final com.demo.service.DataModelService dataModelService;
    private final List<com.demo.loader.DataLoader> dataLoaders;

    public RuleEngine(com.demo.service.DataModelService dataModelService, List<com.demo.loader.DataLoader> dataLoaders) {
        this.dataModelService = dataModelService;
        this.dataLoaders = dataLoaders;
    }

    public String getCurrentVersion() {
        return currentVersion;
    }

    @PostConstruct
    public void init() {
        log.info("Initializing Rule Engine...");
        try {
            InputStream is = getClass().getClassLoader().getResourceAsStream("rules.json");
            if (is != null) {
                String jsonText;
                try (Scanner scanner = new Scanner(is, StandardCharsets.UTF_8.name())) {
                    jsonText = scanner.useDelimiter("\\A").next();
                }
                List<Rule> rules = JSON.parseArray(jsonText, Rule.class);
                // Default to SYNC if loading from legacy list file
                com.demo.common.RuleSet rs = new com.demo.common.RuleSet();
                rs.setRules(rules);
                rs.setRunType(com.demo.common.RuleRunType.SYNC); 
                loadRules("default", rs);
            } else {
                log.warn("rules.json not found in classpath.");
            }
        } catch (Exception e) {
            log.error("Error initializing rules from file", e);
        }
    }

    public void loadRules(String spaceId, com.demo.common.RuleSet ruleSet) {
        if (ruleSet == null) {
            this.activeRules = Collections.emptyList();
            this.activeInternalModels = Collections.emptyList();
            this.currentVersion = "unknown";
            return;
        }
        
        this.currentSpaceId = spaceId;
        this.activeInternalModels = ruleSet.getInternalModels() != null ? ruleSet.getInternalModels() : new ArrayList<>();
        this.currentVersion = ruleSet.getVersion() != null ? ruleSet.getVersion() : "v" + System.currentTimeMillis();
        
        if (ruleSet.getRules() == null || ruleSet.getRules().isEmpty()) {
            this.activeRules = Collections.emptyList();
            return;
        }

        List<RunTimeRule> newRules = new ArrayList<>();
        for (Rule ruleDef : ruleSet.getRules()) {
            try {
                // 1. Generate Source
                String javaSource = SimpleRuleBuilder.buildJavaSource(ruleDef, ruleSet.getRunType());
                log.info("Generated source for rule {}:\n{}", ruleDef.getId(), javaSource);

                // 2. Compile
                Class<? extends RunTimeRule> ruleClass = CompilerUtil.compile(
                        SimpleRuleBuilder.PACKAGE_NAME, 
                        "Rule_" + ruleDef.getId(), 
                        javaSource
                );

                // 3. Instantiate
                RunTimeRule ruleInstance = ruleClass.getDeclaredConstructor().newInstance();
                newRules.add(ruleInstance);
                
            } catch (Exception e) {
                log.error("Failed to load rule {}", ruleDef.getId(), e);
            }
        }
        this.activeRules = newRules;
        log.info("Successfully loaded {} rules and configured {} internal models for space {}.", newRules.size(), activeInternalModels.size(), spaceId);
    }

    public void execute(JSONObject params) {
        // Load data from internal models
        for (String modelName : activeInternalModels) {
            try {
                com.demo.common.DataModel model = dataModelService.getAllDataModels(currentSpaceId).stream()
                        .filter(m -> m.getName().equals(modelName))
                        .findFirst()
                        .orElse(null);

                if (model != null) {
                    boolean loaded = false;
                    for (com.demo.loader.DataLoader loader : dataLoaders) {
                        if (loader.supports(model)) {
                            JSONObject modelData = loader.load(model);
                            if (modelData != null) {
                                params.putAll(modelData);
                                loaded = true;
                                break; // Stop after first successful loader matches and loads
                            }
                        }
                    }
                    if (!loaded) {
                        log.warn("No suitable data loader found or failed to load data for internal model '{}'", modelName);
                    }
                } else {
                    log.warn("Internal model definition not found for '{}'", modelName);
                }
            } catch (Exception e) {
                log.error("Failed to load internal model: " + modelName, e);
            }
        }

        ExecutePolicy policy = new ExecutePolicy(activeRules);
        policy.execute(params);
    }
}