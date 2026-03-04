//package com.denimhub.denim_hub.service;
//
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//import org.springframework.web.client.RestTemplate;
//
//import jakarta.annotation.PostConstruct;
//import java.util.HashMap;
//import java.util.Map;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//
//@Service
//public class Fast2SMSService {
//
//    private static final Logger logger = LoggerFactory.getLogger(Fast2SMSService.class);
//
//    @Value("${fast2sms.api.key:}")
//    private String apiKey;
//
//    private boolean isConfigured = false;
//
//    @PostConstruct
//    public void init() {
//        if (apiKey != null && !apiKey.isEmpty() && !apiKey.equals("YOUR_API_KEY_HERE")) {
//            isConfigured = true;
//            logger.info("Fast2SMS service configured successfully");
//        } else {
//            logger.warn("Fast2SMS service is not configured. SMS functionality will be disabled.");
//        }
//    }
//
//    public void sendSMS(String mobile, String message) {
//        if (!isConfigured) {
//            logger.warn("SMS not sent: Fast2SMS service is not configured");
//            logger.info("Would send SMS to: {} with message: {}", mobile, message);
//            return;
//        }
//
//        try {
//            String url = "https://www.fast2sms.com/dev/bulkV2";
//
//            RestTemplate restTemplate = new RestTemplate();
//
//            Map<String, String> request = new HashMap<>();
//            request.put("route", "v3");
//            request.put("sender_id", "FTWSMS");
//            request.put("message", message);
//            request.put("language", "english");
//            request.put("flash", "0");
//            request.put("numbers", mobile);
//
//            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
//            headers.set("authorization", apiKey);
//
//            org.springframework.http.HttpEntity<Map<String, String>> entity =
//                new org.springframework.http.HttpEntity<>(request, headers);
//
//            var response = restTemplate.postForEntity(url, entity, String.class);
//            logger.info("SMS Response: " + response.getBody());
//
//        } catch (Exception e) {
//            logger.error("Failed to send SMS: " + e.getMessage());
//        }
//    }
//}