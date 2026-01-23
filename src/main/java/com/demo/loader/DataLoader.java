package com.demo.loader;

import com.alibaba.fastjson.JSONObject;
import com.demo.common.DataModel;

public interface DataLoader {
    /**
     * Checks if this loader supports loading data for the given model.
     * @param model The data model definition.
     * @return true if supported, false otherwise.
     */
    boolean supports(DataModel model);

    /**
     * Loads data for the given model.
     * @param model The data model definition.
     * @return The loaded data as a JSONObject, or null/empty if no data found.
     */
    JSONObject load(DataModel model);
}
