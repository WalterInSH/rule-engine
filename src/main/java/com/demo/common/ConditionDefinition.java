package com.demo.common;

import lombok.Data;

@Data
public class ConditionDefinition {
    private String field;
    private String operator;
    private String value;
    private String type; // STRING, NUMBER, BOOLEAN
}
