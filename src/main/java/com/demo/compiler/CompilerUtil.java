package com.demo.compiler;

import com.google.common.collect.Lists;
import com.taobao.arthas.compiler.DynamicCompiler;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.Map;

@Slf4j
public class CompilerUtil {

    @SneakyThrows
    public static <T> Class<? extends T> compile(String packageName, String classSimpleName, String source) {
        DynamicCompiler dynamicCompiler = buildDynamicCompiler();

        String className = packageName + "." + classSimpleName;
        dynamicCompiler.addSource(className, source);

        Map<String, Class<?>> classMap = dynamicCompiler.build();

        if (CollectionUtils.isEmpty(dynamicCompiler.getErrors())) {
            return (Class<? extends T>) classMap.get(className);
        }

        log.error("Compile class: {} error, error info: {}", className, Arrays.toString(dynamicCompiler.getErrors().toArray()));

        throw new IllegalStateException("Compile error: " + dynamicCompiler.getErrors());
    }

    private static DynamicCompiler buildDynamicCompiler() throws Exception {
        DynamicCompiler dynamicCompiler = new DynamicCompiler(Thread.currentThread().getContextClassLoader());
        // Reflection to set options if needed, but standard usage might not need it if defaults work.
        // Keeping it to match original behavior.
        try {
            Class<?> dynamicCompilerClass = Class.forName("com.taobao.arthas.compiler.DynamicCompiler");
            Field field = dynamicCompilerClass.getDeclaredField("options");
            field.setAccessible(true);
            field.set(dynamicCompiler, Lists.newArrayList("-Xlint:unchecked", "-proc:none"));
        } catch (Exception e) {
            log.warn("Failed to set compiler options via reflection", e);
        }
        return dynamicCompiler;
    }
}
