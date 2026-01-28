package com.demo.config;

import com.demo.common.RuleSet;
import com.demo.common.Space;
import com.demo.engine.RuleEngine;
import com.demo.service.RuleSetService;
import com.demo.service.SpaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductionLoader implements ApplicationRunner {

    private final SpaceService spaceService;
    private final RuleSetService ruleSetService;
    private final RuleEngine ruleEngine;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("Starting Production Rules Loader...");
        
        for (Space space : spaceService.getAllSpaces()) {
            try {
                // 1. Load Main Production Rules
                RuleSet prodRuleSet = ruleSetService.readProductionRuleSet(space.getId());
                if (prodRuleSet != null) {
                    java.util.Map<String, Object> config = ruleSetService.getProductionConfig(space.getId());
                    if (config != null) {
                        if (config.containsKey("tag")) {
                            prodRuleSet.setVersion((String) config.get("tag"));
                        } else if (config.containsKey("version")) {
                            prodRuleSet.setVersion((String) config.get("version"));
                        }
                    }
                    ruleEngine.loadRules(space.getId(), prodRuleSet, "production");
                    log.info("Loaded production rules for space: {}", space.getName());
                } else {
                    log.info("No production rules found for space: {}", space.getName());
                }

                // 2. Load A/B Test Plan
                com.demo.common.AbTestConfig abConfig = ruleSetService.getAbTestConfig(space.getId());
                if (abConfig != null && abConfig.isActive()) {
                    log.info("Loading A/B test plan for space: {}", space.getName());
                    for (com.demo.common.AbTestConfig.Variant variant : abConfig.getVariants()) {
                        try {
                            RuleSet variantRs = ruleSetService.readVariantRuleSet(space.getId(), variant.getId());
                            if (variantRs != null) {
                                variantRs.setVersion(variant.getTag() != null ? variant.getTag() : variant.getVersion());
                                ruleEngine.loadRules(space.getId(), variantRs, "production:" + variant.getId());
                                log.info("Loaded variant {} for space {}", variant.getName(), space.getName());
                            } else {
                                log.warn("Failed to read rule set for variant {} in space {}", variant.getId(), space.getName());
                            }
                        } catch (Exception e) {
                            log.error("Failed to load variant " + variant.getId(), e);
                        }
                    }
                    ruleEngine.loadAbTestConfig(space.getId(), abConfig);
                }

            } catch (Exception e) {
                log.error("Failed to load production rules for space: " + space.getName(), e);
            }
        }
    }
}
