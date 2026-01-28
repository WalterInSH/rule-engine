package com.demo.common;

import lombok.Data;

import java.util.List;

@Data
public class RuleSet {
    private String name;
    private String description;
    private String version;
    private RuleRunType runType;
    private List<String> internalModels;
    private List<String> outputModels;
    private List<Rule> rules;
}
