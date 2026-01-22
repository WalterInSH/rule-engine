package com.demo.controller;

import com.alibaba.fastjson.JSONObject;
import com.demo.common.Rule;
import com.demo.engine.RuleEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rules")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class RuleController {

    private final RuleEngine ruleEngine;

    @PostMapping("/execute")
    public JSONObject execute(@RequestBody JSONObject params) {
        long start = System.currentTimeMillis();
        ruleEngine.execute(params);
        long duration = System.currentTimeMillis() - start;
        
        params.put("_startTime", new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS").format(new java.util.Date(start)));
        params.put("_durationMs", duration);
        
        return params;
    }

    @PostMapping("/reload")
    public String reload(@RequestBody com.demo.common.RuleSet ruleSet) {
        ruleEngine.loadRules(ruleSet);
        return "Loaded " + (ruleSet.getRules() != null ? ruleSet.getRules().size() : 0) + " rules.";
    }
}
