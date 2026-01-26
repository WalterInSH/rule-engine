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
            @RequestParam String version) {
        
        try {
            // 1. Persist deployment
            ruleSetService.deploySnapshotToProduction(spaceId, ruleSetName, version);
            
            // 2. Load into Engine
            RuleSet prodRuleSet = ruleSetService.readProductionRuleSet(spaceId);
            if (prodRuleSet != null) {
                ruleEngine.loadRules(spaceId, prodRuleSet, "production");
                return ResponseEntity.ok("Deployed " + version + " to production for space " + spaceId);
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
}
