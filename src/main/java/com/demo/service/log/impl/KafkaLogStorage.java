package com.demo.service.log.impl;

import com.alibaba.fastjson.JSONObject;
import com.demo.engine.RuleExecutionResult;
import com.demo.model.log.ExecutionLogConfig;
import com.demo.model.log.ExecutionLogSummary;
import com.demo.service.log.ExecutionLogStorage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class KafkaLogStorage implements ExecutionLogStorage {

    private boolean enabled = false;
    private KafkaTemplate<String, String> kafkaTemplate;
    private String topic;

    @Override
    public void init(ExecutionLogConfig config) {
        ExecutionLogConfig.KafkaConfig kafkaConfig = config.getKafka();
        this.enabled = kafkaConfig.isEnabled();
        this.topic = kafkaConfig.getTopic();

        if (this.enabled) {
            try {
                Map<String, Object> props = new HashMap<>();
                props.put("bootstrap.servers", kafkaConfig.getBrokers());
                props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
                props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

                ProducerFactory<String, String> producerFactory = new DefaultKafkaProducerFactory<>(props);
                this.kafkaTemplate = new KafkaTemplate<>(producerFactory);
            } catch (Exception e) {
                log.error("Failed to initialize Kafka producer", e);
                this.enabled = false;
            }
        }
    }

    @Override
    public String getType() {
        return "kafka";
    }

    @Override
    public boolean isReadable() {
        return false;
    }

    @Override
    public void save(String spaceId, String env, RuleExecutionResult result) {
        if (!enabled || kafkaTemplate == null) return;

        try {
            String jsonContent = JSONObject.toJSONString(result);
            // Key could be executionId or spaceId
            kafkaTemplate.send(topic, result.getExecutionId(), jsonContent);
        } catch (Exception e) {
            log.error("Failed to send log to Kafka", e);
        }
    }

    @Override
    public List<ExecutionLogSummary> fetch(String spaceId, String date) {
        return java.util.Collections.emptyList();
    }

    @Override
    public Object fetchDetail(String spaceId, String date, String fileNameOrId) {
        return null;
    }
}
