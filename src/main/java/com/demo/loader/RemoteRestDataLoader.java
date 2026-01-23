package com.demo.loader;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.demo.common.DataModel;
import com.demo.common.DataModelSourceType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
public class RemoteRestDataLoader implements DataLoader {

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean supports(DataModel model) {
        return model != null && 
               model.getSourceType() == DataModelSourceType.REMOTE_API &&
               model.getSource() != null && 
               !model.getSource().isEmpty();
    }

    @Override
    public JSONObject load(DataModel model) {
        String url = model.getSource();
        try {
            log.debug("Loading internal model '{}' from URL: {}", model.getName(), url);
            String response = restTemplate.getForObject(url, String.class);
            if (response != null) {
                return JSON.parseObject(response);
            }
        } catch (Exception e) {
            log.error("Failed to load internal model '{}' from remote API: {}", model.getName(), url, e);
        }
        return null;
    }
}
