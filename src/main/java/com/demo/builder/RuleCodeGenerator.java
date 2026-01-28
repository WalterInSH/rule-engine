package com.demo.builder;

import com.demo.common.ConditionDefinition;
import com.demo.common.ConditionNode;
import com.demo.common.RuleAction;
import org.apache.commons.lang3.StringUtils;
import java.util.List;
import java.util.stream.Collectors;

public class RuleCodeGenerator {

    public static String generateCondition(ConditionNode node) {
        if (node == null) return "true";
        
        if ("LEAF".equalsIgnoreCase(node.getType())) {
            return generateLeafCondition(node.getCondition());
        } else if ("GROUP".equalsIgnoreCase(node.getType())) {
            return generateGroupCondition(node);
        }
        return "true";
    }

    private static String generateLeafCondition(ConditionDefinition def) {
        if (def == null) return "true";
        
        String field = def.getField();
        if (field == null || !field.contains(".")) return "true"; 
        
        // Extract simple field name "Model.Field" -> "Field"
        String paramName = field.substring(field.lastIndexOf(".") + 1); 
        
        String operator = def.getOperator();
        String value = def.getValue();
        String type = def.getType();

        // Safe String Utilities
        String stringUtils = "org.apache.commons.lang3.StringUtils";

        if ("STRING".equalsIgnoreCase(type) || "ENUM".equalsIgnoreCase(type)) {
             String safeVal = "\"" + escapeJavaString(value) + "\"";
             String param = "params.getString(\"" + escapeJavaString(paramName) + "\")";
             
             if ("EQUALS".equalsIgnoreCase(operator)) return stringUtils + ".equals(" + param + ", " + safeVal + ")";
             if ("IS_BLANK".equalsIgnoreCase(operator)) return stringUtils + ".isBlank(" + param + ")";
             if ("IS_NOT_BLANK".equalsIgnoreCase(operator)) return stringUtils + ".isNotBlank(" + param + ")";
             if ("STARTS_WITH".equalsIgnoreCase(operator)) return stringUtils + ".startsWith(" + param + ", " + safeVal + ")";
             if ("ENDS_WITH".equalsIgnoreCase(operator)) return stringUtils + ".endsWith(" + param + ", " + safeVal + ")";
             
        } else if ("NUMBER".equalsIgnoreCase(type)) {
             if (!isNumeric(value)) value = "0";
             
             String param = "params.getIntValue(\"" + escapeJavaString(paramName) + "\")";
             
             if ("EQUALS".equalsIgnoreCase(operator)) return param + " == " + value;
             if ("GT".equalsIgnoreCase(operator)) return param + " > " + value;
             if ("LT".equalsIgnoreCase(operator)) return param + " < " + value;
        }

        return "true";
    }

    private static String generateGroupCondition(ConditionNode node) {
        if (node.getChildren() == null || node.getChildren().isEmpty()) return "true";
        
        String logicalOp = "AND".equalsIgnoreCase(node.getLogicalOperator()) ? " && " : " || ";
        
        return node.getChildren().stream()
                .map(RuleCodeGenerator::generateCondition)
                .collect(Collectors.joining(logicalOp, "(", ")"));
    }

    public static String generateAction(List<RuleAction> actions) {
        if (actions == null || actions.isEmpty()) return "";
        
        StringBuilder sb = new StringBuilder();
        for (RuleAction action : actions) {
            if (StringUtils.isBlank(action.getFieldName())) continue;
            
            String key = escapeJavaString(action.getFieldName());
            String val = action.getValue();
            String type = action.getValueType();
            
            String valueStr;
            if ("STRING".equalsIgnoreCase(type) || "ENUM".equalsIgnoreCase(type)) {
                valueStr = "\"" + escapeJavaString(val) + "\"";
            } else if ("NUMBER".equalsIgnoreCase(type)) {
                valueStr = isNumeric(val) ? val : "0";
            } else if ("BOOLEAN".equalsIgnoreCase(type)) {
                valueStr = "true".equalsIgnoreCase(val) ? "true" : "false";
            } else {
                 valueStr = "\"" + escapeJavaString(val) + "\"";
            }
            
            sb.append("params.getOutput().put(\"" + key + "\", ").append(valueStr).append("); ");
        }
        return sb.toString();
    }
    
    private static String escapeJavaString(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("\"", "\\\"");
    }
    
    private static boolean isNumeric(String str) {
        if (str == null) return false;
        return str.matches("-?\\d+(\\.\\d+)?");
    }
}
