package com.demo.controller;

import com.demo.common.Space;
import com.demo.service.SpaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spaces")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class SpaceController {

    private final SpaceService spaceService;

    @GetMapping
    public List<Space> getAll() {
        return spaceService.getAllSpaces();
    }

    @GetMapping("/{id}")
    public Space get(@PathVariable String id) {
        return spaceService.getSpace(id);
    }

    @PostMapping
    public Space save(@RequestBody Space space) {
        return spaceService.saveSpace(space);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        spaceService.deleteSpace(id);
    }
}
