package com.demo.builder;

import com.google.common.collect.Lists;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import java.util.List;

public class JClass extends CodeComposite {
    private String className;
    private String extend;
    private String[] implement;
    private JHeader header;
    private List<JMethod> methods;

    public JClass(String className) {
        this.className = className;
    }

    public void setImplement(String[] implement) { this.implement = implement; }
    public void setHeader(JHeader header) { this.header = header; }
    public String getClassName() { return className; }

    public void addMethod(JMethod jMethod) {
        if (methods == null) methods = Lists.newArrayList();
        methods.add(jMethod);
    }

    @Override
    public void build(StringBuilder sb) {
        buildBefore(sb);
        if (CollectionUtils.isNotEmpty(methods)) {
            for (JMethod method : methods) method.build(sb);
        }
        buildAfter(sb);
    }

    public String build() {
        StringBuilder sb = new StringBuilder(1024);
        build(sb);
        return sb.toString();
    }

    @Override
    protected void buildBefore(StringBuilder sb) {
        if (header != null) header.build(sb);
        sb.append(PUBLIC).append(StringUtils.SPACE).append(CLASS).append(StringUtils.SPACE).append(className).append(StringUtils.SPACE);
        if (ArrayUtils.isNotEmpty(implement)) {
            sb.append("implements");
            for (String aInterface : implement) {
                sb.append(StringUtils.SPACE).append(aInterface).append(COMMA);
            }
            sb.delete(sb.lastIndexOf(COMMA), sb.length()).append(StringUtils.SPACE);
        }
        sb.append(LEFT_BRACE).append(StringUtils.LF);
    }

    @Override
    protected void buildAfter(StringBuilder sb) {
        sb.append(RIGHT_BRACE);
    }
}
