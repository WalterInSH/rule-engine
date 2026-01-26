package com.demo.controller;

import com.demo.common.RuleSet;
import com.demo.service.RuleSetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/spaces/{spaceId}/rulesets")
@RequiredArgsConstructor
public class RuleSetController {

    private final RuleSetService ruleSetService;

    @GetMapping
    public List<RuleSet> getAll(@PathVariable String spaceId) {
        return ruleSetService.getAllRuleSets(spaceId);
    }

    @PostMapping
    public RuleSet save(@PathVariable String spaceId, @RequestBody RuleSet ruleSet) {
        ruleSetService.saveRuleSet(spaceId, ruleSet);
        return ruleSet;
    }

    @DeleteMapping("/{name}")
    public void delete(@PathVariable String spaceId, @PathVariable String name) {
        ruleSetService.deleteRuleSet(spaceId, name);
    }

    @PostMapping("/{name}/snapshot")
    public void snapshot(@PathVariable String spaceId, @PathVariable String name, @RequestParam String tag) {
        ruleSetService.snapshotRuleSet(spaceId, name, tag);
    }

    @GetMapping("/{name}/versions")
    public List<Map<String, String>> getVersions(@PathVariable String spaceId, @PathVariable String name) {
        return ruleSetService.getRuleSetVersions(spaceId, name);
    }

    @PostMapping("/{name}/restore")
    public void restore(@PathVariable String spaceId, @PathVariable String name, @RequestParam String version) {
        ruleSetService.restoreRuleSetVersion(spaceId, name, version);
    }
}
