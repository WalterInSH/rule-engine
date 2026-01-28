package com.demo.common;

import lombok.Data;

import java.util.List;

@Data
public class ConditionNode {
    // "GROUP" or "LEAF"
    private String type;

    // For GROUP
    private String logicalOperator; // "AND" or "OR"
    private List<ConditionNode> children;

    // For LEAF
    private ConditionDefinition condition;
}
