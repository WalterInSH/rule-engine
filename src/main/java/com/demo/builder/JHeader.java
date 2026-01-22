package com.demo.builder;

import org.apache.commons.lang3.StringUtils;
import java.util.Set;

public class JHeader extends CodeComposite {
    private String packageName;
    private Set<String> imports;

    public JHeader(String packageName, Set<String> imports) {
        this.packageName = packageName;
        this.imports = imports;
    }

    public String getPackageName() {
        return packageName;
    }

    @Override
    protected void buildBefore(StringBuilder sb) {
        sb.append(PACKAGE).append(StringUtils.SPACE).append(packageName).append(SEMICOLON).append(StringUtils.LF);
        for (String anImport : imports) {
            sb.append(IMPORT).append(StringUtils.SPACE).append(anImport).append(SEMICOLON).append(StringUtils.LF);
        }
    }

    @Override
    protected void buildAfter(StringBuilder sb) {}
}
