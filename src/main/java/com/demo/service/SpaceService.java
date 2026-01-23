package com.demo.service;

import com.alibaba.fastjson.JSON;
import com.demo.common.Space;
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
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
public class SpaceService {

    private final String BASE_DIR;
    private final String SPACES_META_DIR;

    public SpaceService(@Value("${app.storage.base-dir}") String baseDir) {
        this.BASE_DIR = baseDir;
        this.SPACES_META_DIR = Paths.get(baseDir, "spaces_meta").toString();
    }

    @PostConstruct
    public void init() {
        File dir = new File(SPACES_META_DIR);
        if (!dir.exists()) {
            if (dir.mkdirs()) {
                log.info("Created spaces metadata directory: {}", SPACES_META_DIR);
            }
        } else {
            log.info("Using spaces metadata directory: {}", SPACES_META_DIR);
        }
        
        // Ensure default space exists
        if (getAllSpaces().isEmpty()) {
            saveSpace(new Space("default", "Default Space", "The default workspace"));
        }
    }

    public List<Space> getAllSpaces() {
        try (Stream<Path> paths = Files.walk(Paths.get(SPACES_META_DIR))) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".json"))
                    .map(this::readSpace)
                    .filter(s -> s != null)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.error("Failed to list spaces", e);
            return Collections.emptyList();
        }
    }

    public Space getSpace(String id) {
        Path path = Paths.get(SPACES_META_DIR, id + ".json");
        if (Files.exists(path)) {
            return readSpace(path);
        }
        return null;
    }

    public Space saveSpace(Space space) {
        if (space == null) {
            throw new IllegalArgumentException("Space cannot be null");
        }
        if (space.getId() == null || space.getId().trim().isEmpty()) {
            space.setId(UUID.randomUUID().toString());
        }
        
        Path path = Paths.get(SPACES_META_DIR, space.getId() + ".json");
        try {
            String json = JSON.toJSONString(space, true);
            Files.write(path, json.getBytes(StandardCharsets.UTF_8));
            log.info("Saved space: {}", space.getName());
            
            // Create data directories for the new space
            createSpaceDirectories(space.getId());
            
            return space;
        } catch (IOException e) {
            log.error("Failed to save space: " + space.getName(), e);
            throw new RuntimeException("Failed to save space", e);
        }
    }

    public void deleteSpace(String id) {
        Path path = Paths.get(SPACES_META_DIR, id + ".json");
        try {
            Files.deleteIfExists(path);
            log.info("Deleted space: {}", id);
            // We might want to delete the data folder too, but let's keep it safe for now or TODO
        } catch (IOException e) {
            log.error("Failed to delete space: " + id, e);
            throw new RuntimeException("Failed to delete space", e);
        }
    }

    private Space readSpace(Path path) {
        try {
            String content = new String(Files.readAllBytes(path), StandardCharsets.UTF_8);
            return JSON.parseObject(content, Space.class);
        } catch (Exception e) {
            log.error("Failed to read space from file: " + path, e);
            return null;
        }
    }
    
    private void createSpaceDirectories(String spaceId) {
        String[] dirs = {"rulesets", "datamodels", "enums"};
        for (String d : dirs) {
            File f = Paths.get(BASE_DIR, "spaces", spaceId, d).toFile();
            if (!f.exists()) {
                f.mkdirs();
            }
        }
    }
}
