package com.demo.controller;

import com.demo.common.EnumDefinition;
import com.demo.service.EnumService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enums")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class EnumController {

    private final EnumService enumService;

    @GetMapping
    public List<EnumDefinition> getAll() {
        return enumService.getAllEnums();
    }

    @PostMapping
    public EnumDefinition save(@RequestBody EnumDefinition enumDefinition) {
        enumService.saveEnum(enumDefinition);
        return enumDefinition;
    }

    @DeleteMapping("/{name}")
    public void delete(@PathVariable String name) {
        enumService.deleteEnum(name);
    }
}
