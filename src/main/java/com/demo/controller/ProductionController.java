package com.demo.controller;

import com.demo.common.RuleSet;
import com.demo.engine.RuleEngine;
import com.demo.service.RuleSetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/spaces/{spaceId}/production")
@RequiredArgsConstructor
@Slf4j
public class ProductionController {

    private final RuleSetService ruleSetService;
    private final RuleEngine ruleEngine;

    @PostMapping("/deploy")
    public ResponseEntity<?> deploy(
            @PathVariable String spaceId,
            @RequestParam String ruleSetName,
            @RequestParam String version,
            @RequestParam(required = false) String tag) {
        
        try {
            // 1. Persist deployment
            ruleSetService.deploySnapshotToProduction(spaceId, ruleSetName, version, tag);
            
            // 2. Load into Engine
            RuleSet prodRuleSet = ruleSetService.readProductionRuleSet(spaceId);
            if (prodRuleSet != null) {
                // Ensure the RuleSet object has the correct version identifier (prefer tag if available)
                String displayVersion = (tag != null && !tag.isEmpty()) ? tag : version;
                prodRuleSet.setVersion(displayVersion);
                ruleEngine.loadRules(spaceId, prodRuleSet, "production");
                return ResponseEntity.ok("Deployed " + displayVersion + " to production for space " + spaceId);
            } else {
                return ResponseEntity.internalServerError().body("Failed to read deployed rule set.");
            }
        } catch (Exception e) {
            log.error("Deployment failed", e);
            return ResponseEntity.internalServerError().body("Deployment failed: " + e.getMessage());
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus(@PathVariable String spaceId) {
        Map<String, Object> config = ruleSetService.getProductionConfig(spaceId);
        if (config == null) {
            return ResponseEntity.ok(Map.of("status", "not-configured"));
        }
        return ResponseEntity.ok(config);
    }

    @PostMapping("/ab-test")
    public ResponseEntity<?> createAbTest(@PathVariable String spaceId, @RequestBody com.demo.common.AbTestConfig config) {
        try {
            // Validate
            if (config.getVariants() == null || config.getVariants().isEmpty()) {
                return ResponseEntity.badRequest().body("Variants are required");
            }
            // Check weights
            int sum = config.getVariants().stream().mapToInt(v -> v.getWeight()).sum();
            if (sum >= 100) {
                 return ResponseEntity.badRequest().body("Sum of variant weights must be less than 100 (rest for main)");
            }
            if (config.getVariants().size() > 2) {
                 return ResponseEntity.badRequest().body("Max 2 additional variants allowed");
            }

            // Assign IDs if missing
            if (config.getId() == null) {
                config.setId(java.util.UUID.randomUUID().toString());
            }
            for (com.demo.common.AbTestConfig.Variant v : config.getVariants()) {
                if (v.getId() == null) v.setId(java.util.UUID.randomUUID().toString());
            }
            config.setActive(true);

            // Deploy to disk
            ruleSetService.deployAbTestPlan(spaceId, config);

            // Load to Engine
            for (com.demo.common.AbTestConfig.Variant variant : config.getVariants()) {
                RuleSet variantRs = ruleSetService.readVariantRuleSet(spaceId, variant.getId());
                if (variantRs != null) {
                    variantRs.setVersion(variant.getTag() != null ? variant.getTag() : variant.getVersion());
                    ruleEngine.loadRules(spaceId, variantRs, "production:" + variant.getId());
                }
            }
            ruleEngine.loadAbTestConfig(spaceId, config);

            return ResponseEntity.ok("A/B Test Plan Deployed");
        } catch (Exception e) {
            log.error("Failed to deploy A/B test", e);
            return ResponseEntity.internalServerError().body("Failed: " + e.getMessage());
        }
    }

    @GetMapping("/ab-test")
    public ResponseEntity<?> getAbTest(@PathVariable String spaceId) {
        com.demo.common.AbTestConfig config = ruleSetService.getAbTestConfig(spaceId);
        if (config == null) {
             return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(config);
    }

    @GetMapping("/ab-test/history")
    public ResponseEntity<?> getAbTestHistory(@PathVariable String spaceId) {
        return ResponseEntity.ok(ruleSetService.getAbTestHistory(spaceId));
    }

    @DeleteMapping("/ab-test")
    public ResponseEntity<?> deleteAbTest(@PathVariable String spaceId) {
        try {
            com.demo.common.AbTestConfig oldConfig = ruleSetService.getAbTestConfig(spaceId);
            ruleSetService.deleteAbTestPlan(spaceId);
            ruleEngine.unloadAbTestConfig(spaceId);
            
            // Unload variants from engine
            if (oldConfig != null && oldConfig.getVariants() != null) {
                for (com.demo.common.AbTestConfig.Variant v : oldConfig.getVariants()) {
                    ruleEngine.loadRules(spaceId, null, "production:" + v.getId());
                }
            }
            return ResponseEntity.ok("A/B Test Plan Stopped");
        } catch (Exception e) {
             log.error("Failed to stop A/B test", e);
             return ResponseEntity.internalServerError().body("Failed: " + e.getMessage());
        }
    }
}
