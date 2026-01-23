package com.demo.controller;

import com.demo.common.RuleSet;
import com.demo.service.RuleSetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spaces/{spaceId}/rulesets")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
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
}
