package com.demo.engine;

import com.alibaba.fastjson.JSONObject;
import com.demo.builder.SimpleRuleBuilder;
import com.demo.common.Rule;
import com.demo.compiler.CompilerUtil;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class RuleEngine {

    @Data
    private static class EnvContext {
        private List<RunTimeRule> rules = new ArrayList<>();
        private List<String> internalModels = new ArrayList<>();
        private List<String> outputModels = new ArrayList<>();
        private String version = "unknown";
    }

    private final Map<String, EnvContext> contexts = new ConcurrentHashMap<>();
    private final Map<String, com.demo.common.AbTestConfig> abConfigs = new ConcurrentHashMap<>();

    private final com.demo.service.DataModelService dataModelService;
    private final List<com.demo.loader.DataLoader> dataLoaders;

    public RuleEngine(com.demo.service.DataModelService dataModelService, List<com.demo.loader.DataLoader> dataLoaders) {
        this.dataModelService = dataModelService;
        this.dataLoaders = dataLoaders;
    }

    public void loadAbTestConfig(String spaceId, com.demo.common.AbTestConfig config) {
        abConfigs.put(spaceId, config);
        // Load variant rules
        if (config != null && config.getVariants() != null) {
            // We expect the caller to have already loaded the rules for each variant into 
            // "production:variantId" using loadRules().
            // But if not, we can't do it here easily without the RuleSet objects.
            // So the loader/controller must handle loading the rules for variants.
        }
    }

    public void unloadAbTestConfig(String spaceId) {
        abConfigs.remove(spaceId);
        // We should also unload the variant rules to free memory? 
        // For now, let's keep it simple. The loader can handle unloading if needed.
    }

    public String getCurrentVersion(String spaceId, String env) {
        EnvContext ctx = contexts.get(getContextKey(spaceId, env));
        return ctx != null ? ctx.getVersion() : "unknown";
    }

    private String getContextKey(String spaceId, String env) {
        return spaceId + ":" + env;
    }

    public void loadRules(String spaceId, com.demo.common.RuleSet ruleSet, String env) {
        String key = getContextKey(spaceId, env);
        if (ruleSet == null) {
            contexts.remove(key);
            return;
        }

        EnvContext ctx = new EnvContext();
        ctx.setInternalModels(ruleSet.getInternalModels() != null ? ruleSet.getInternalModels() : new ArrayList<>());
        ctx.setOutputModels(ruleSet.getOutputModels() != null ? ruleSet.getOutputModels() : new ArrayList<>());
        ctx.setVersion(ruleSet.getVersion() != null ? ruleSet.getVersion() : "v" + System.currentTimeMillis());

        if (ruleSet.getRules() == null || ruleSet.getRules().isEmpty()) {
            contexts.put(key, ctx);
            return;
        }

        List<RunTimeRule> newRules = new ArrayList<>();
        for (Rule ruleDef : ruleSet.getRules()) {
            try {
                // 1. Generate Source
                String javaSource = SimpleRuleBuilder.buildJavaSource(ruleDef, ruleSet.getRunType(), env);
                log.debug("Generated source for rule {}:\n{}", ruleDef.getId(), javaSource);

                // 2. Compile
                Class<? extends RunTimeRule> ruleClass = CompilerUtil.compile(
                        SimpleRuleBuilder.PACKAGE_NAME,
                        "Rule_" + ruleDef.getId() + "_" + env.replace(":", "_"), // Sanitize env for class name
                        javaSource
                );

                // 3. Instantiate
                RunTimeRule ruleInstance = ruleClass.getDeclaredConstructor().newInstance();
                newRules.add(ruleInstance);

            } catch (Exception e) {
                log.error("Failed to load rule {}", ruleDef.getId(), e);
            }
        }
        ctx.setRules(newRules);
        contexts.put(key, ctx);
        log.info("Successfully loaded {} rules for space {} env {}.", newRules.size(), spaceId, env);
    }

    public RuleExecutionResult execute(String spaceId, JSONObject params, String env) {
        String targetEnv = env;
        String activeAbTestId = null;
        String selectedVariantId = null;
        
        // A/B Testing Logic for Production
        if ("production".equals(env)) {
            com.demo.common.AbTestConfig abConfig = abConfigs.get(spaceId);
            if (abConfig != null && abConfig.isActive()) {
                // Check expiration
                boolean expired = false;
                if (abConfig.getExpiration() != null) {
                    try {
                        java.time.LocalDateTime exp = java.time.LocalDateTime.parse(abConfig.getExpiration());
                        if (java.time.LocalDateTime.now().isAfter(exp)) {
                            expired = true;
                        }
                    } catch (Exception e) {
                        log.warn("Failed to parse expiration date", e);
                    }
                }
                
                if (!expired) {
                    activeAbTestId = abConfig.getId();
                    // Random selection
                    int random = java.util.concurrent.ThreadLocalRandom.current().nextInt(100);
                    int currentWeight = 0;
                    boolean variantSelected = false;
                    for (com.demo.common.AbTestConfig.Variant v : abConfig.getVariants()) {
                        currentWeight += v.getWeight();
                        if (random < currentWeight) {
                            targetEnv = "production:" + v.getId();
                            selectedVariantId = v.getId();
                            variantSelected = true;
                            break;
                        }
                    }
                    if (!variantSelected) {
                        selectedVariantId = "main";
                    }
                }
            }
        }

        String key = getContextKey(spaceId, targetEnv);
        EnvContext ctx = contexts.get(key);
        
        // Fallback to main production if variant context is missing
        if (ctx == null && !targetEnv.equals(env)) {
            log.warn("Variant context {} not found, falling back to {}", targetEnv, env);
            key = getContextKey(spaceId, env);
            ctx = contexts.get(key);
            // If fallback happens, should we still report it as variant execution? 
            // Probably not safe to report variant ID if we ran main rules.
            // But we are in an A/B test.
            // Let's keep abTestId but maybe clear variantId or set it to "fallback-main"
            selectedVariantId = "main"; 
        }

        if (ctx == null) {
            log.warn("No rules loaded for space {} env {}", spaceId, env);
            // Return empty result or throw?
            // Returning result with empty output seems safer
            RuleExecutionResult empty = new RuleExecutionResult();
            empty.setInput(JSONObject.parseObject(JSONObject.toJSONString(params)));
            empty.setOutput(new JSONObject());
            return empty;
        }

        // 1. Capture Original Input (Deep Copy)
        JSONObject input = JSONObject.parseObject(JSONObject.toJSONString(params));
        List<RuleExecutionResult.InternalModelEntry> internalModels = new ArrayList<>();

        // Load data from internal models
        for (String modelName : ctx.getInternalModels()) {
            try {
                com.demo.common.DataModel model = dataModelService.getAllDataModels(spaceId).stream()
                        .filter(m -> m.getName().equals(modelName))
                        .findFirst()
                        .orElse(null);

                if (model != null) {
                    boolean loaded = false;
                    for (com.demo.loader.DataLoader loader : dataLoaders) {
                        if (loader.supports(model)) {
                            JSONObject modelData = loader.load(model);
                            if (modelData != null) {
                                params.putAll(modelData);
                                internalModels.add(new RuleExecutionResult.InternalModelEntry(modelName, modelData));
                                loaded = true;
                                break;
                            }
                        }
                    }
                    if (!loaded) {
                        log.warn("No suitable data loader found or failed to load data for internal model '{}'", modelName);
                    }
                } else {
                    log.warn("Internal model definition not found for '{}'", modelName);
                }
            } catch (Exception e) {
                log.error("Failed to load internal model: " + modelName, e);
            }
        }

        // Create RuleContext
        RuleContext context = new RuleContext(params);

        ExecutePolicy policy = new ExecutePolicy(ctx.getRules());
        policy.execute(context);

        RuleExecutionResult result = new RuleExecutionResult();
        result.setInput(input);
        result.setInternalModels(internalModels);
        result.setOutput(context.getOutput());
        result.setExecutedVersion(ctx.getVersion());
        result.setAbTestId(activeAbTestId);
        result.setAbVariantId(selectedVariantId);
        return result;
    }
}
