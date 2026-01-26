package com.demo.controller;

import com.demo.common.EnumDefinition;
import com.demo.service.EnumService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spaces/{spaceId}/enums")
@RequiredArgsConstructor
public class EnumController {

    private final EnumService enumService;

    @GetMapping
    public List<EnumDefinition> getAll(@PathVariable String spaceId) {
        return enumService.getAllEnums(spaceId);
    }

    @PostMapping
    public EnumDefinition save(@PathVariable String spaceId, @RequestBody EnumDefinition enumDefinition) {
        enumService.saveEnum(spaceId, enumDefinition);
        return enumDefinition;
    }

    @DeleteMapping("/{name}")
    public void delete(@PathVariable String spaceId, @PathVariable String name) {
        enumService.deleteEnum(spaceId, name);
    }
}
