package com.demo.builder;

import com.google.common.collect.Lists;

import java.util.List;

public abstract class CodeComposite {
    public static final String RETRACT = "    ";
    public static final String EQUAL = "=";
    public static final String SEMICOLON = ";";
    public static final String LEFT_BRACE = "{";
    public static final String RIGHT_BRACE = "}";
    public static final String PACKAGE = "package";
    public static final String IMPORT = "import";
    public static final String PUBLIC = "public";
    public static final String STATIC = "static";
    public static final String PRIVATE = "private";
    public static final String LEFT_PARENTHESES = "(";
    public static final String RIGHT_PARENTHESES = ")";
    public static final String COMMA = ",";
    public static final String CLASS = "class";

    private List<CodeComposite> children = Lists.newArrayList();

    public void add(CodeComposite composite) {
        children.add(composite);
    }

    protected abstract void buildBefore(StringBuilder sb);

    protected abstract void buildAfter(StringBuilder sb);

    public void build(StringBuilder sb) {
        buildBefore(sb);
        for (CodeComposite child : children) {
            child.build(sb);
        }
        buildAfter(sb);
    }
}
