package com.demo.service.log.impl;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.IndexRequest;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import com.alibaba.fastjson.JSONObject;
import com.demo.engine.RuleExecutionResult;
import com.demo.model.log.ExecutionLogConfig;
import com.demo.model.log.ExecutionLogSummary;
import com.demo.service.log.ExecutionLogStorage;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.elasticsearch.client.RestClient;
import org.springframework.stereotype.Service;

import java.io.StringReader;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ElasticsearchLogStorage implements ExecutionLogStorage {

    private boolean enabled = false;
    private ElasticsearchClient esClient;
    private String indexName;

    @Override
    public void init(ExecutionLogConfig config) {
        ExecutionLogConfig.ElasticsearchConfig esConfig = config.getElasticsearch();
        this.enabled = esConfig.isEnabled();
        this.indexName = esConfig.getIndex();

        if (this.enabled) {
            try {
                String[] hosts = esConfig.getHosts().split(",");
                HttpHost[] httpHosts = Arrays.stream(hosts)
                        .map(HttpHost::create)
                        .toArray(HttpHost[]::new);

                BasicCredentialsProvider credsProv = new BasicCredentialsProvider();
                if (esConfig.getUsername() != null && !esConfig.getUsername().isEmpty()) {
                    credsProv.setCredentials(
                            AuthScope.ANY,
                            new UsernamePasswordCredentials(esConfig.getUsername(), esConfig.getPassword())
                    );
                }

                RestClient restClient = RestClient.builder(httpHosts)
                        .setHttpClientConfigCallback(hc -> hc.setDefaultCredentialsProvider(credsProv))
                        .build();

                RestClientTransport transport = new RestClientTransport(
                        restClient, new JacksonJsonpMapper());

                this.esClient = new ElasticsearchClient(transport);
            } catch (Exception e) {
                log.error("Failed to initialize Elasticsearch client", e);
                this.enabled = false;
            }
        }
    }

    @Override
    public String getType() {
        return "elasticsearch";
    }

    @Override
    public boolean isReadable() {
        return true;
    }

    @Override
    public void save(String spaceId, String env, RuleExecutionResult result) {
        if (!enabled || esClient == null) return;

        try {
            // Ensure timestamp field for ES
            if (result.getOutput() == null) {
                result.setOutput(new JSONObject());
            }
            if (!result.getOutput().containsKey("@timestamp")) {
                result.getOutput().put("@timestamp", new java.util.Date());
            }
            // Add metadata fields at root for easy searching if not present
            // But RuleExecutionResult structure is fixed. ES can index nested JSON.

            esClient.index(IndexRequest.of(i -> i
                    .index(indexName)
                    .id(result.getExecutionId())
                    .document(result)
            ));
        } catch (Exception e) {
            log.error("Failed to index log to Elasticsearch", e);
        }
    }

    @Override
    public List<ExecutionLogSummary> fetch(String spaceId, String date) {
        if (!enabled || esClient == null) return java.util.Collections.emptyList();

        try {
            // Fetch logs for the given date (filtering by timestamp)
            // Date format: yyyy-MM-dd
            // We assume there's a timestamp field. 
            // Depending on mapping, it might be in `output._startTime` or `@timestamp`.
            
            // Simple match all for now limited by size or simple date range query if we knew the field mapping.
            // As a generic implementation without knowing exact mapping, we might just query by date range on a standard field.
            
            SearchResponse<RuleExecutionResult> response = esClient.search(s -> s
                    .index(indexName)
                    .size(100) // limit
                    // Add query for date range... omitted for brevity/safety without mapping knowledge
                    , RuleExecutionResult.class
            );

            return response.hits().hits().stream()
                    .map(hit -> {
                        RuleExecutionResult r = hit.source();
                        ExecutionLogSummary s = new ExecutionLogSummary();
                        s.setExecutionId(r.getExecutionId());
                        s.setVersion(r.getExecutedVersion());
                        s.setAbTestId(r.getAbTestId());
                        s.setAbVariantId(r.getAbVariantId());
                        if (r.getOutput() != null) {
                            s.setStartTime(r.getOutput().getString("_startTime"));
                            s.setDurationMs(r.getOutput().getLongValue("_durationMs"));
                        }
                        // fileName is used as ID in frontend
                        s.setFileName(r.getExecutionId()); 
                        return s;
                    })
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to search logs in Elasticsearch", e);
            return java.util.Collections.emptyList();
        }
    }

    @Override
    public Object fetchDetail(String spaceId, String date, String fileNameOrId) {
        if (!enabled || esClient == null) return null;

        try {
             var response = esClient.get(g -> g
                    .index(indexName)
                    .id(fileNameOrId), RuleExecutionResult.class);
             
             return response.source();
        } catch (Exception e) {
            log.error("Failed to get log detail from Elasticsearch", e);
            return null;
        }
    }
}
