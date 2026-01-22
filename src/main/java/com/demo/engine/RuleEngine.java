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
        if (ruleSet == null || ruleSet.getRules() == null || ruleSet.getRules().isEmpty()) {
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
        log.info("Successfully loaded {} rules.", newRules.size());
    }

    public void execute(JSONObject params) {
        ExecutePolicy policy = new ExecutePolicy(activeRules);
        policy.execute(params);
    }
}