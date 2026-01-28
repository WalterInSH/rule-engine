package com.demo.service;

import com.alibaba.fastjson.JSON;
import com.demo.common.EnumDefinition;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
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

    private final String BASE_DIR;

    public EnumService(@Value("${app.storage.base-dir}") String baseDir) {
        this.BASE_DIR = baseDir;
    }

    @PostConstruct
    public void init() {
        // Migration logic
        Path legacyDir = Paths.get(BASE_DIR, "enums");
        Path defaultSpaceDir = Paths.get(BASE_DIR, "spaces", "default", "enums");

        if (Files.exists(legacyDir) && Files.isDirectory(legacyDir)) {
            try {
                if (!Files.exists(defaultSpaceDir)) {
                    Files.createDirectories(defaultSpaceDir);
                }

                try (Stream<Path> paths = Files.list(legacyDir)) {
                    paths.filter(Files::isRegularFile)
                            .filter(p -> p.toString().endsWith(".json"))
                            .forEach(p -> {
                                try {
                                    Files.move(p, defaultSpaceDir.resolve(p.getFileName()));
                                    log.info("Migrated legacy enum {} to default space", p.getFileName());
                                } catch (IOException e) {
                                    log.error("Failed to migrate " + p, e);
                                }
                            });
                }
            } catch (IOException e) {
                log.error("Migration failed", e);
            }
        }
    }

    private Path getStoragePath(String spaceId) {
        return Paths.get(BASE_DIR, "spaces", spaceId, "enums");
    }

    public List<EnumDefinition> getAllEnums(String spaceId) {
        Path dir = getStoragePath(spaceId);
        if (!Files.exists(dir)) return Collections.emptyList();

        try (Stream<Path> paths = Files.walk(dir)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".json"))
                    .map(this::readEnum)
                    .filter(model -> model != null)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.error("Failed to list enums for space " + spaceId, e);
            return Collections.emptyList();
        }
    }

    public void saveEnum(String spaceId, EnumDefinition enumDef) {
        if (enumDef == null || enumDef.getName() == null) {
            throw new IllegalArgumentException("Enum Definition or Name cannot be null");
        }
        Path dir = getStoragePath(spaceId);
        if (!Files.exists(dir)) {
            try {
                Files.createDirectories(dir);
            } catch (IOException e) {
                throw new RuntimeException("Failed to create directory " + dir, e);
            }
        }

        Path path = dir.resolve(enumDef.getName() + ".json");
        try {
            String json = JSON.toJSONString(enumDef, true);
            Files.write(path, json.getBytes(StandardCharsets.UTF_8));
            log.info("Saved enum: {} in space {}", enumDef.getName(), spaceId);
        } catch (IOException e) {
            log.error("Failed to save enum: " + enumDef.getName(), e);
            throw new RuntimeException("Failed to save enum", e);
        }
    }

    public void deleteEnum(String spaceId, String name) {
        Path path = getStoragePath(spaceId).resolve(name + ".json");
        try {
            Files.deleteIfExists(path);
            log.info("Deleted enum: {} from space {}", name, spaceId);
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
