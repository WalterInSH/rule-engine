package com.demo.common;

import lombok.Data;

@Data
public class Rule {
    private String id;
    private int priority;
    private RuleActionType actionType;
    // Java boolean expression, e.g., "params.getIntValue(\"amount\") > 1000"
    private String condition; 
    // Java statement, e.g., "params.put(\"result\", \"high_risk\");"
    private String action;
    
    private ConditionNode conditionNode;
}
