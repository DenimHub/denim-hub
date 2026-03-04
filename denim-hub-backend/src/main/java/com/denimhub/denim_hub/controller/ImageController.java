package com.denimhub.denim_hub.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
public class ImageController {

    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/";

    @GetMapping("/uploads/products/{filename}")
    public ResponseEntity<Resource> serveProductImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR + "products/" + filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(resource);
            } else {
                // Return default image if requested image doesn't exist
                Path defaultPath = Paths.get(UPLOAD_DIR + "products/default.jpg");
                Resource defaultResource = new UrlResource(defaultPath.toUri());

                if (defaultResource.exists()) {
                    return ResponseEntity.ok()
                            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"default.jpg\"")
                            .contentType(MediaType.IMAGE_JPEG)
                            .body(defaultResource);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return ResponseEntity.notFound().build();
    }
}