package com.demo.builder;

import com.demo.common.Rule;
import com.demo.engine.RunTimeRule;
import com.google.common.collect.Sets;
import java.util.Collections;
import java.util.List;
import java.util.Set;

public class SimpleRuleBuilder {
    public static final String PACKAGE_NAME = "com.demo.rules";

    public static String buildJavaSource(Rule rule, com.demo.common.RuleRunType runType) {
        // Ensure class name is valid
        String className = "Rule_" + rule.getId();
        JClass jClass = new JClass(className);
        jClass.setImplement(new String[]{RunTimeRule.class.getName()});
        
        // Header
        Set<String> imports = Sets.newTreeSet();
        imports.add("com.alibaba.fastjson.JSONObject");
        imports.add("com.demo.engine.RunTimeRule");
        imports.add("com.demo.common.RuleActionType");
        imports.add("com.demo.common.RuleRunType");
        jClass.setHeader(new JHeader(PACKAGE_NAME, imports));

        // Methods
        jClass.addMethod(new JMethod("getId", null, "String", "return \"" + rule.getId() + "\";", null, null));
        jClass.addMethod(new JMethod("getPriority", null, "int", "return " + rule.getPriority() + ";", null, null));
        jClass.addMethod(new JMethod("getActionType", null, "RuleActionType", "return RuleActionType." + rule.getActionType() + ";", null, null));
        jClass.addMethod(new JMethod("getRunType", null, "RuleRunType", "return RuleRunType." + runType + ";", null, null));

        // isFired
        List<JMethodParam> params = Collections.singletonList(new JMethodParam("params", "JSONObject"));
        List<String> exceptions = Collections.singletonList("Exception");
        
        jClass.addMethod(new JMethod("isFired", null, "boolean", "return " + rule.getCondition() + ";", params, exceptions));
        
        // executeAction
        jClass.addMethod(new JMethod("executeAction", null, "void", rule.getAction(), params, exceptions));

        return jClass.build();
    }
}
