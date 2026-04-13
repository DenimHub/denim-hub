package com.denimhub.denim_hub.config;

import com.denimhub.denim_hub.entity.Users;
import com.denimhub.denim_hub.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class AdminDataLoader {

    @Bean
    CommandLineRunner createAdmin(UserRepository userRepository, BCryptPasswordEncoder encoder) {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                Users admin = Users.builder()
                        .username("admin")
                        .password(encoder.encode("admin123"))
                        .role("ADMIN")
                        .build();
                userRepository.save(admin);
                System.out.println("✅ ADMIN user created successfully");
            }
        };
    }
}