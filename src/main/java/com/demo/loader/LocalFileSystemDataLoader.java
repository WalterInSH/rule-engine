package com.demo.loader;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.demo.common.DataModel;
import com.demo.common.DataModelSourceType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

@Component
@Slf4j
public class LocalFileSystemDataLoader implements DataLoader {

    @Override
    public boolean supports(DataModel model) {
        // Support explicit LOCAL_FILE or legacy/null (defaulting to local for backward compatibility if needed)
        // But for clarity, we should check type. If type is null, we can check if it looks like a path?
        // Let's enforce type or default to LOCAL if null for backward compat.
        return model != null && 
               (model.getSourceType() == DataModelSourceType.LOCAL_FILE || model.getSourceType() == null) &&
               model.getSource() != null && 
               !model.getSource().isEmpty();
    }

    @Override
    public JSONObject load(DataModel model) {
        String source = model.getSource();
        try {
            File file = new File(source);
            if (file.exists() && file.isFile()) {
                String content = new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8);
                JSONObject data = JSON.parseObject(content);
                log.debug("Loaded internal model '{}' data from local file: {}", model.getName(), source);
                return data;
            } else {
                log.warn("Internal model '{}' source file not found: {}", model.getName(), source);
            }
        } catch (Exception e) {
            log.error("Failed to load internal model '{}' from file: {}", model.getName(), source, e);
        }
        return null;
    }
}
