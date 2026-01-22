package com.demo.common;

import lombok.Data;
import java.util.List;

@Data
public class RuleSet {
    private String name;
    private String description;
    private RuleRunType runType;
    private List<Rule> rules;
}
