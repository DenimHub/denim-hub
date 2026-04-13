package com.denimhub.denim_hub.controller;

import com.denimhub.denim_hub.entity.Product;
import com.denimhub.denim_hub.entity.ProductSize;
import com.denimhub.denim_hub.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    private final ProductService productService;
    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/products/";

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/check-name")
    public ResponseEntity<Map<String, Boolean>> checkProductName(@RequestParam String name) {
        boolean exists = productService.isProductNameExists(name);
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/suggest")
    public ResponseEntity<List<String>> suggestProductNames(@RequestParam String q) {
        List<String> suggestions = productService.suggestProductNames(q);
        return ResponseEntity.ok(suggestions);
    }

    @PostMapping(value = "/with-image", consumes = "multipart/form-data")
    public ResponseEntity<?> addProductWithImage(
            @RequestParam("name") String name,
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam("minStock") Integer minStock,
            @RequestParam(value = "discountPercent", required = false, defaultValue = "0") BigDecimal discountPercent,
            @RequestParam("image") MultipartFile image,
            @RequestParam("sizes") String sizesJson
    ) {
        try {
            if (productService.isProductNameExists(name)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Product with name '" + name + "' already exists!");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            }

            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) uploadDir.mkdirs();

            String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
            image.transferTo(new File(UPLOAD_DIR + fileName));
            String imageUrl = "/uploads/products/" + fileName;

            List<ProductSize> sizes = parseSizes(sizesJson);

            Product product = Product.builder()
                    .name(name)
                    .category(category)
                    .description(description)
                    .minStock(minStock)
                    .discountPercent(discountPercent)
                    .imageUrl(imageUrl)
                    .isActive(true)
                    .build();

            Product savedProduct = productService.addProduct(product, sizes);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam("minStock") Integer minStock,
            @RequestParam(value = "discountPercent", required = false, defaultValue = "0") BigDecimal discountPercent,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam("sizes") String sizesJson
    ) {
        try {
            if (productService.isProductNameExistsExcludingId(name, id)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Product with name '" + name + "' already exists!");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            }

            Product existingProduct = productService.getProductById(id);
            existingProduct.setName(name);
            existingProduct.setCategory(category);
            existingProduct.setDescription(description);
            existingProduct.setMinStock(minStock);
            existingProduct.setDiscountPercent(discountPercent);

            if (image != null && !image.isEmpty()) {
                if (existingProduct.getImageUrl() != null) {
                    File oldFile = new File(System.getProperty("user.dir") + existingProduct.getImageUrl());
                    if (oldFile.exists()) oldFile.delete();
                }
                String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
                image.transferTo(new File(UPLOAD_DIR + fileName));
                existingProduct.setImageUrl("/uploads/products/" + fileName);
            }

            List<ProductSize> sizes = parseSizes(sizesJson);
            Product updatedProduct = productService.updateProduct(id, existingProduct, sizes);
            return ResponseEntity.ok(updatedProduct);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Product deactivated successfully");
            response.put("id", id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private List<ProductSize> parseSizes(String sizesJson) throws com.fasterxml.jackson.core.JsonProcessingException {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        List<Map<String, Object>> sizeMaps = mapper.readValue(sizesJson, List.class);

        List<ProductSize> sizes = new ArrayList<>();
        for (Map<String, Object> sizeMap : sizeMaps) {
            ProductSize size = ProductSize.builder()
                    .size((String) sizeMap.get("size"))
                    .stockQty(Integer.parseInt(sizeMap.get("stockQty").toString()))
                    .price(new BigDecimal(sizeMap.get("price").toString()))
                    .build();
            sizes.add(size);
        }
        return sizes;
    }
}