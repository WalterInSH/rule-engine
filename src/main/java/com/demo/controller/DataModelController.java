package com.demo.controller;

import com.demo.common.DataModel;
import com.demo.service.DataModelService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spaces/{spaceId}/datamodels")
@RequiredArgsConstructor
public class DataModelController {

    private final DataModelService dataModelService;

    @GetMapping
    public List<DataModel> getAll(@PathVariable String spaceId) {
        return dataModelService.getAllDataModels(spaceId);
    }

    @PostMapping
    public DataModel save(@PathVariable String spaceId, @RequestBody DataModel dataModel) {
        dataModelService.saveDataModel(spaceId, dataModel);
        return dataModel;
    }

    @DeleteMapping("/{name}")
    public void delete(@PathVariable String spaceId, @PathVariable String name) {
        dataModelService.deleteDataModel(spaceId, name);
    }
}
