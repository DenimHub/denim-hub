package com.denimhub.denim_hub.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
public class DefaultImageController {

    @GetMapping("/uploads/products/default.jpg")
    public ResponseEntity<Resource> getDefaultImage() throws IOException {
        // Try to load from file system first
        Path defaultPath = Paths.get(System.getProperty("user.dir") + "/uploads/products/default.jpg");
        Resource resource = new UrlResource(defaultPath.toUri());

        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(resource);
        }

        // If not found, try classpath
        Resource classpathResource = new ClassPathResource("static/default.jpg");
        if (classpathResource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(classpathResource);
        }

        return ResponseEntity.notFound().build();
    }
}