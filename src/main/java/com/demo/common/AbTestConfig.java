package com.demo.common;

import lombok.Data;
import java.util.List;

@Data
public class AbTestConfig {
    private List<Variant> variants;
    private String expiration; // ISO DateTime
    private boolean active;

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
