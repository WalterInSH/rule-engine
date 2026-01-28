package com.demo.settings.controller;

import com.demo.settings.model.ApiKey;
import com.demo.settings.service.ApiKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/settings/keys")
@RequiredArgsConstructor
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @GetMapping
    public List<ApiKey> listKeys() {
        return apiKeyService.listKeys().stream()
                .map(k -> {
                    // Return a copy or modify a transient view to hide the secret key
                    ApiKey view = new ApiKey(
                        k.getId(), 
                        k.getName(), 
                        null, // Hide secret key
                        k.getMaskedKey(), 
                        k.getCreatedAt(), 
                        k.getLastUsedAt()
                    );
                    return view;
                })
                .collect(Collectors.toList());
    }

    @PostMapping
    public ApiKey createKey(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }
        return apiKeyService.createKey(name);
    }

    @DeleteMapping("/{id}")
    public void deleteKey(@PathVariable String id) {
        apiKeyService.deleteKey(id);
    }
}
