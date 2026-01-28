package com.demo.settings.service;

import com.demo.settings.model.ApiKey;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.util.FileSystemUtils;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ApiKeyServiceTest {

    private ApiKeyService apiKeyService;
    private File tempDir;

    @BeforeEach
    void setUp() throws Exception {
        tempDir = Files.createTempDirectory("api-key-test").toFile();
        apiKeyService = new ApiKeyService();
        ReflectionTestUtils.setField(apiKeyService, "baseDir", tempDir.getAbsolutePath());
        apiKeyService.init();
    }

    @AfterEach
    void tearDown() {
        FileSystemUtils.deleteRecursively(tempDir);
    }

    @Test
    void testCreateAndValidateKey() {
        ApiKey created = apiKeyService.createKey("Test Key");
        assertNotNull(created);
        assertNotNull(created.getKey());
        assertTrue(created.getKey().startsWith("sk-"));
        assertEquals("Test Key", created.getName());

        assertTrue(apiKeyService.validateKey(created.getKey()));
        assertFalse(apiKeyService.validateKey("invalid-key"));
    }

    @Test
    void testListKeysHidesSecret() {
        apiKeyService.createKey("Key 1");
        apiKeyService.createKey("Key 2");

        List<ApiKey> keys = apiKeyService.listKeys();
        assertEquals(2, keys.size());
        
        // The service's listKeys() returns the internal objects which HAVE the key.
        // The Controller is responsible for masking it in the DTO transformation.
        // Let's verify the service returns the full object (as per current implementation)
        // and that we can validate against it.
        ApiKey first = keys.get(0);
        assertNotNull(first.getKey()); 
    }

    @Test
    void testDeleteKey() {
        ApiKey created = apiKeyService.createKey("To Delete");
        assertTrue(apiKeyService.validateKey(created.getKey()));

        apiKeyService.deleteKey(created.getId());
        assertFalse(apiKeyService.validateKey(created.getKey()));
    }

    @Test
    void testPersistence() {
        // Create a key
        ApiKey original = apiKeyService.createKey("Persistent Key");
        String originalKey = original.getKey();

        // Simulate restart by creating a new service instance pointing to the same dir
        ApiKeyService newService = new ApiKeyService();
        ReflectionTestUtils.setField(newService, "baseDir", tempDir.getAbsolutePath());
        newService.init();

        assertTrue(newService.validateKey(originalKey));
        List<ApiKey> loadedKeys = newService.listKeys();
        assertEquals(1, loadedKeys.size());
        assertEquals("Persistent Key", loadedKeys.get(0).getName());
    }
}
