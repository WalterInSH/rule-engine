package com.demo.engine;

import com.alibaba.fastjson.JSONObject;
import lombok.Data;
import java.util.List;

@Data
public class RuleExecutionResult {
    private JSONObject input;
    private List<InternalModelEntry> internalModels;
    private JSONObject output;

    @Data
    public static class InternalModelEntry {
        private String name;
        private JSONObject model;
        
        public InternalModelEntry() {}
        
        public InternalModelEntry(String name, JSONObject model) {
            this.name = name;
            this.model = model;
        }
    }
}
