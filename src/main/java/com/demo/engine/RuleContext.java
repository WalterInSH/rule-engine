package com.demo.engine;

import com.alibaba.fastjson.JSONObject;
import lombok.Getter;

public class RuleContext {
    private final JSONObject source;
    @Getter
    private final JSONObject output;

    public RuleContext(JSONObject source) {
        this.source = source;
        this.output = new JSONObject();
    }

    public Object put(String key, Object value) {
        return output.put(key, value);
    }

    public String getString(String key) {
        if (output.containsKey(key)) {
            return output.getString(key);
        }
        return source.getString(key);
    }

    public int getIntValue(String key) {
        if (output.containsKey(key)) {
            return output.getIntValue(key);
        }
        return source.getIntValue(key);
    }

    public boolean containsKey(String key) {
        return output.containsKey(key) || source.containsKey(key);
    }
    
    public Object get(String key) {
        if (output.containsKey(key)) {
            return output.get(key);
        }
        return source.get(key);
    }
}
