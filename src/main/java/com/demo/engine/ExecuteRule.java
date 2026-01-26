package com.demo.engine;

import com.demo.common.RuleActionType;
import com.demo.common.RuleRunType;

public interface ExecuteRule {
    String getId();

    default RuleActionType getActionType() {
        return RuleActionType.PARAM;
    }

    RuleRunType getRunType();

    int getPriority();

    boolean isFired(RuleContext context) throws Exception;

    void executeAction(RuleContext context) throws Exception;
}
