package com.demo.common;

import lombok.Data;

@Data
public class RuleAction {
    private String modelName;
    private String fieldName;
    private String value;
    private String valueType; // STRING, NUMBER, BOOLEAN, ENUM
}
