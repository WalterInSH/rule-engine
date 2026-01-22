package com.demo.engine;

import com.alibaba.fastjson.JSONObject;
import com.demo.common.RuleActionType;
import com.demo.common.RuleRunType;

public interface ExecuteRule {
    String getId();

    default RuleActionType getActionType() {
        return RuleActionType.PARAM;
    }

    RuleRunType getRunType();

    int getPriority();

    boolean isFired(JSONObject params) throws Exception;

    void executeAction(JSONObject params) throws Exception;
}
