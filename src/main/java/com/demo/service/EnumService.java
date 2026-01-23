package com.demo.service;

import com.alibaba.fastjson.JSON;
import com.demo.common.EnumDefinition;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
public class EnumService {

    private final String STORAGE_DIR;

    public EnumService(@Value("${app.storage.base-dir}") String baseDir) {
        this.STORAGE_DIR = Paths.get(baseDir, "enums").toString();
    }

    @PostConstruct
    public void init() {
        File dir = new File(STORAGE_DIR);
        if (!dir.exists()) {
            if (dir.mkdirs()) {
                log.info("Created enum storage directory: {}", STORAGE_DIR);
            }
        } else {
            log.info("Using enum storage directory: {}", STORAGE_DIR);
        }
    }

    public List<EnumDefinition> getAllEnums() {
        try (Stream<Path> paths = Files.walk(Paths.get(STORAGE_DIR))) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".json"))
                    .map(this::readEnum)
                    .filter(model -> model != null)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.error("Failed to list enums", e);
            return Collections.emptyList();
        }
    }

    public void saveEnum(EnumDefinition enumDef) {
        if (enumDef == null || enumDef.getName() == null) {
            throw new IllegalArgumentException("Enum Definition or Name cannot be null");
        }
        Path path = Paths.get(STORAGE_DIR, enumDef.getName() + ".json");
        try {
            String json = JSON.toJSONString(enumDef, true);
            Files.write(path, json.getBytes(StandardCharsets.UTF_8));
            log.info("Saved enum: {}", enumDef.getName());
        } catch (IOException e) {
            log.error("Failed to save enum: " + enumDef.getName(), e);
            throw new RuntimeException("Failed to save enum", e);
        }
    }

    public void deleteEnum(String name) {
        Path path = Paths.get(STORAGE_DIR, name + ".json");
        try {
            Files.deleteIfExists(path);
            log.info("Deleted enum: {}", name);
        } catch (IOException e) {
            log.error("Failed to delete enum: " + name, e);
            throw new RuntimeException("Failed to delete enum", e);
        }
    }

    private EnumDefinition readEnum(Path path) {
        try {
            String content = new String(Files.readAllBytes(path), StandardCharsets.UTF_8);
            return JSON.parseObject(content, EnumDefinition.class);
        } catch (Exception e) {
            log.error("Failed to read enum from file: " + path, e);
            return null;
        }
    }
}
