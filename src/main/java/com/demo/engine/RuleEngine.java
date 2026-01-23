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

    private final com.demo.service.DataModelService dataModelService;

    public RuleEngine(com.demo.service.DataModelService dataModelService) {
        this.dataModelService = dataModelService;
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
                loadRules(rs);
            } else {
                log.warn("rules.json not found in classpath.");
            }
        } catch (Exception e) {
            log.error("Error initializing rules from file", e);
        }
    }

    public void loadRules(com.demo.common.RuleSet ruleSet) {
        if (ruleSet == null) {
            this.activeRules = Collections.emptyList();
            this.activeInternalModels = Collections.emptyList();
            return;
        }

        this.activeInternalModels = ruleSet.getInternalModels() != null ? ruleSet.getInternalModels() : new ArrayList<>();
        
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
        log.info("Successfully loaded {} rules and configured {} internal models.", newRules.size(), activeInternalModels.size());
    }

    public void execute(JSONObject params) {
        // Load data from internal models
        for (String modelName : activeInternalModels) {
            try {
                // Find model definition to get source path
                // Note: In a real high-perf scenario, we might cache the map of name->path
                com.demo.common.DataModel model = dataModelService.getAllDataModels().stream()
                        .filter(m -> m.getName().equals(modelName))
                        .findFirst()
                        .orElse(null);

                if (model != null && model.getSource() != null && !model.getSource().isEmpty()) {
                    java.io.File file = new java.io.File(model.getSource());
                    if (file.exists() && file.isFile()) {
                        String content = new String(java.nio.file.Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8);
                        JSONObject modelData = JSON.parseObject(content);
                        if (modelData != null) {
                            params.putAll(modelData);
                            log.debug("Loaded internal model '{}' data from {}", modelName, model.getSource());
                        }
                    } else {
                        log.warn("Internal model '{}' source file not found: {}", modelName, model.getSource());
                    }
                } else {
                    log.warn("Internal model '{}' not found or has no source configured.", modelName);
                }
            } catch (Exception e) {
                log.error("Failed to load internal model: " + modelName, e);
            }
        }

        ExecutePolicy policy = new ExecutePolicy(activeRules);
        policy.execute(params);
    }
}