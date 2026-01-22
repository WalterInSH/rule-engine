package com.demo.common;

import lombok.Data;
import java.util.List;

@Data
public class DataModel {
    private String name;
    private String description;
    private List<FieldDefinition> fields;
}
