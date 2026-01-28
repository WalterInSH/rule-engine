package com.demo.common;

import lombok.Data;

import java.util.List;

@Data
public class DataModel {
    private String name;
    private String description;
    private DataModelCategory category;
    private DataModelSourceType sourceType;
    private String source;
    private List<FieldDefinition> fields;
}
