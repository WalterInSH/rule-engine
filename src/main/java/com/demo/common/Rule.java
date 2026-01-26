package com.demo.common;

import lombok.Data;

@Data
public class Rule {
    private String id;
    private int priority;
    private RuleActionType actionType;
    private String condition;
    private String action;

    private ConditionNode conditionNode;
}
