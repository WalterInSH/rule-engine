package com.demo.engine;

import com.demo.common.RuleActionType;
import lombok.extern.slf4j.Slf4j;
import java.util.List;

@Slf4j
public class ExecutePolicy {
    private List<RunTimeRule> rules;

    public ExecutePolicy(List<RunTimeRule> rules) {
        this.rules = rules;
    }

    public void execute(RuleContext context) {
        for (RunTimeRule rule : rules) {
            try {
                if (rule.isFired(context)) {
                    log.info("Rule fired: {}", rule.getId());
                    rule.executeAction(context);
                    // For simplicity, we can stop if it's a specific type, or just continue.
                    // Emulating 'FIRST' policy if needed, but let's just run all.
                }
            } catch (Exception e) {
                log.error("Execute rule error, ruleId={}, context={}", rule.getId(), context, e);
            }
        }
    }
}
