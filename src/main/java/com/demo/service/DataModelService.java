package com.demo.service;

import com.alibaba.fastjson.JSON;
import com.demo.common.DataModel;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
public class DataModelService {

    private final String STORAGE_DIR;

    public DataModelService(@Value("${app.storage.base-dir}") String baseDir) {
        this.STORAGE_DIR = Paths.get(baseDir, "datamodels").toString();
    }

    @PostConstruct
    public void init() {
        File dir = new File(STORAGE_DIR);
        if (!dir.exists()) {
            if (dir.mkdirs()) {
                log.info("Created data model storage directory: {}", STORAGE_DIR);
            }
        } else {
            log.info("Using data model storage directory: {}", STORAGE_DIR);
        }
    }

    public List<DataModel> getAllDataModels() {
        try (Stream<Path> paths = Files.walk(Paths.get(STORAGE_DIR))) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".json"))
                    .map(this::readDataModel)
                    .filter(model -> model != null)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.error("Failed to list data models", e);
            return Collections.emptyList();
        }
    }

    public void saveDataModel(DataModel dataModel) {
        if (dataModel == null || dataModel.getName() == null) {
            throw new IllegalArgumentException("Data Model or Name cannot be null");
        }
        Path path = Paths.get(STORAGE_DIR, dataModel.getName() + ".json");
        try {
            String json = JSON.toJSONString(dataModel, true);
            Files.write(path, json.getBytes(StandardCharsets.UTF_8));
            log.info("Saved data model: {}", dataModel.getName());
        } catch (IOException e) {
            log.error("Failed to save data model: " + dataModel.getName(), e);
            throw new RuntimeException("Failed to save data model", e);
        }
    }

    public void deleteDataModel(String name) {
        Path path = Paths.get(STORAGE_DIR, name + ".json");
        try {
            Files.deleteIfExists(path);
            log.info("Deleted data model: {}", name);
        } catch (IOException e) {
            log.error("Failed to delete data model: " + name, e);
            throw new RuntimeException("Failed to delete data model", e);
        }
    }

    private DataModel readDataModel(Path path) {
        try {
            String content = new String(Files.readAllBytes(path), StandardCharsets.UTF_8);
            return JSON.parseObject(content, DataModel.class);
        } catch (Exception e) {
            log.error("Failed to read data model from file: " + path, e);
            return null;
        }
    }
}
