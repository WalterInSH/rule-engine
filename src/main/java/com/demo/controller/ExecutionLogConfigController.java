package com.demo.controller;

import com.demo.model.log.ExecutionLogConfig;
import com.demo.service.log.ExecutionLogManager;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/execution-logs/config")
@RequiredArgsConstructor
public class ExecutionLogConfigController {

    private final ExecutionLogManager executionLogManager;

    @GetMapping
    public ExecutionLogConfig getConfig() {
        return executionLogManager.getConfig();
    }

    @PostMapping
    public void updateConfig(@RequestBody ExecutionLogConfig config) {
        executionLogManager.saveConfig(config);
    }
}
