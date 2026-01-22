package com.demo.builder;

import org.apache.commons.lang3.StringUtils;

public class JMethodParam extends CodeComposite {
    private String paramName;
    private String paramType;

    public JMethodParam(String paramName, String paramType) {
        this.paramName = paramName;
        this.paramType = paramType;
    }

    @Override
    protected void buildBefore(StringBuilder sb) {
        sb.append(paramType).append(StringUtils.SPACE).append(paramName).append(COMMA);
    }

    @Override
    protected void buildAfter(StringBuilder sb) {
        sb.append(StringUtils.SPACE);
    }
}
