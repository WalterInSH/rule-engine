package com.demo.loader;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.demo.common.DataModel;
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
        // Current simple logic: If source is present, assume it is a local file path.
        // In the future, this can be refined (e.g., check for "file://" prefix or a specific type field).
        return model != null && model.getSource() != null && !model.getSource().isEmpty();
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
