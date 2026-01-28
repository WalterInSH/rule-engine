package com.demo.settings.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiKey {
    private String id;
    private String name;
    private String key; // The actual secret key (e.g., sk-...)
    private String maskedKey; // For display purposes (e.g., sk-****1234)
    private Long createdAt;
    private Long lastUsedAt;
}
