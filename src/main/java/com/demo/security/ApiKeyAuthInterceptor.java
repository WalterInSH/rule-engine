package com.demo.security;

import com.demo.settings.service.ApiKeyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApiKeyAuthInterceptor implements HandlerInterceptor {

    private final ApiKeyService apiKeyService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // We only protect the execute endpoint
        // The path matching is handled by WebConfig, but we double check here if needed or if mapped globally.
        // Assuming this interceptor is mapped to /api/spaces/*/rules/execute
        
        String env = request.getParameter("env");
        if ("production".equalsIgnoreCase(env)) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Missing or invalid Authorization header");
                return false;
            }

            String key = authHeader.substring(7); // Remove "Bearer "
            if (!apiKeyService.validateKey(key)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Invalid API Key");
                return false;
            }
        }
        
        return true;
    }
}
