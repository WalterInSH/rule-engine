package com.demo.controller;

import com.demo.common.DataModel;
import com.demo.service.DataModelService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/datamodels")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Allow frontend access
public class DataModelController {

    private final DataModelService dataModelService;

    @GetMapping
    public List<DataModel> getAll() {
        return dataModelService.getAllDataModels();
    }

    @PostMapping
    public DataModel save(@RequestBody DataModel dataModel) {
        dataModelService.saveDataModel(dataModel);
        return dataModel;
    }

    @DeleteMapping("/{name}")
    public void delete(@PathVariable String name) {
        dataModelService.deleteDataModel(name);
    }
}
