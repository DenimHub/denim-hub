package com.denimhub.denim_hub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Content-Disposition"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        // Allow authentication endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        // Allow product API endpoints
                        .requestMatchers("/api/products/**").permitAll()
                        // Allow inventory API endpoints
                        .requestMatchers("/api/inventory/**").permitAll()
                        // Allow sales/billing endpoints
                        .requestMatchers("/api/sales/**").permitAll()
                        .requestMatchers("/api/sales").permitAll()
                        // Allow bills report endpoints
                        .requestMatchers("/api/bills/**").permitAll()
                        // Allow customers endpoints - ADD THIS
                        .requestMatchers("/api/customers/**").permitAll()
                        // Allow access to uploads folder
                        .requestMatchers("/uploads/**").permitAll()
                        // All other requests need authentication
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}