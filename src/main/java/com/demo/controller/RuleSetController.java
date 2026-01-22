package com.demo.controller;

import com.demo.common.RuleSet;
import com.demo.service.RuleSetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rulesets")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class RuleSetController {

    private final RuleSetService ruleSetService;

    @GetMapping
    public List<RuleSet> getAll() {
        return ruleSetService.getAllRuleSets();
    }

    @PostMapping
    public RuleSet save(@RequestBody RuleSet ruleSet) {
        ruleSetService.saveRuleSet(ruleSet);
        return ruleSet;
    }

    @DeleteMapping("/{name}")
    public void delete(@PathVariable String name) {
        ruleSetService.deleteRuleSet(name);
    }
}
