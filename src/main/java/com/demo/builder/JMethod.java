package com.demo.builder;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import java.util.List;

public class JMethod extends CodeComposite {
    private boolean isStatic;
    private String methodName;
    private String methodNote;
    private String outParamType;
    private String methodBody;
    private List<String> exceptions;

    public JMethod(String methodName, String methodNote, String outParamType, String methodBody, List<JMethodParam> jMethodParams, List<String> exceptions) {
        this.methodName = methodName;
        this.methodNote = methodNote;
        this.outParamType = outParamType;
        this.methodBody = methodBody;
        this.exceptions = exceptions;
        if (CollectionUtils.isNotEmpty(jMethodParams)) {
            for (JMethodParam jMethodParam : jMethodParams) {
                this.add(jMethodParam);
            }
        }
    }

    public void setStatic(boolean aStatic) {
        isStatic = aStatic;
    }

    @Override
    protected void buildBefore(StringBuilder sb) {
        if (StringUtils.isNotBlank(methodNote)) {
            sb.append(StringUtils.LF).append(RETRACT).append("/**").append(StringUtils.LF)
              .append(RETRACT).append(StringUtils.SPACE).append("*").append(StringUtils.SPACE).append(methodNote).append(StringUtils.LF)
              .append(RETRACT).append(StringUtils.SPACE).append("*/");
        }
        sb.append(StringUtils.LF);
        if (isStatic) sb.append(RETRACT).append(STATIC);
        sb.append(RETRACT).append(PUBLIC).append(StringUtils.SPACE).append(outParamType).append(StringUtils.SPACE)
          .append(methodName).append(LEFT_PARENTHESES);
    }

    @Override
    protected void buildAfter(StringBuilder sb) {
        int lastIndexOf = sb.lastIndexOf(COMMA);
        if (lastIndexOf == sb.length() - 2) sb.delete(lastIndexOf, sb.length());
        sb.append(RIGHT_PARENTHESES).append(StringUtils.SPACE);
        
        if (CollectionUtils.isNotEmpty(exceptions)) {
            sb.append("throws").append(StringUtils.SPACE);
            for (String exception : exceptions) {
                sb.append(exception).append(COMMA).append(StringUtils.SPACE);
            }
            sb.delete(sb.length() - 2, sb.length() - 1);
        }
        sb.append(LEFT_BRACE).append(StringUtils.LF)
          .append(RETRACT).append(RETRACT).append(methodBodyBeauty(methodBody)).append(StringUtils.LF)
          .append(RETRACT).append(RIGHT_BRACE).append(StringUtils.LF);
    }

    private static String methodBodyBeauty(String methodBody) {
        StringBuilder sb = new StringBuilder();
        String[] split = StringUtils.split(methodBody, StringUtils.LF);
        if (split.length > 1) {
            for (String s : split) {
                sb.append(s).append(StringUtils.LF).append(RETRACT).append(RETRACT);
            }
            return sb.toString();
        }
        return methodBody;
    }
}
