package com.demo.model.log;

import lombok.Data;

@Data
public class ExecutionLogConfig {
    private LocalConfig local = new LocalConfig();
    private S3Config s3 = new S3Config();
    private KafkaConfig kafka = new KafkaConfig();
    private ElasticsearchConfig elasticsearch = new ElasticsearchConfig();

    @Data
    public static class LocalConfig {
        private boolean enabled = true; // Default enabled
    }

    @Data
    public static class S3Config {
        private boolean enabled = false;
        private String bucket;
        private String region;
        private String accessKey;
        private String secretKey;
        private String endpoint; // Optional
    }

    @Data
    public static class KafkaConfig {
        private boolean enabled = false;
        private String brokers;
        private String topic;
    }

    @Data
    public static class ElasticsearchConfig {
        private boolean enabled = false;
        private String hosts; // comma separated
        private String username;
        private String password;
        private String index;
    }
}
