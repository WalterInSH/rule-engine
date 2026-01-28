package com.demo.common;

import lombok.Data;
import java.util.List;

@Data
public class AbTestConfig {
    private String id;
    private List<Variant> variants;
    private String expiration; // ISO DateTime
    private boolean active;
    
    private String startedAt; // ISO DateTime
    private String endedAt;   // ISO DateTime
    private String createdBy; // Username or "system"

    @Data
    public static class Variant {
        private String id;
        private String name;
        private String ruleSetName;
        private String version;
        private String tag;
        private int weight; // 0-100
    }
}
