package com.denimhub.denim_hub.controller;

import com.denimhub.denim_hub.entity.Product;
import com.denimhub.denim_hub.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    private final ProductService productService;
    private final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/products/";

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // ✅ Get All Products (only active ones)
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    // ✅ Get Product by ID
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    // ✅ Add Product With Image
    @PostMapping(value = "/with-image", consumes = "multipart/form-data")
    public ResponseEntity<Product> addProductWithImage(
            @RequestParam("name") String name,
            @RequestParam("category") String category,
            @RequestParam("size") String size,
            @RequestParam("price") String price,
            @RequestParam("stockQty") Integer stockQty,
            @RequestParam(value = "minStock", required = false, defaultValue = "10") Integer minStock,
            @RequestParam("description") String description,
            @RequestParam("image") MultipartFile image
    ) {
        try {
            // Create upload directory if it doesn't exist
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // Generate unique filename
            String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
            String filePath = UPLOAD_DIR + fileName;

            // Save file
            image.transferTo(new File(filePath));

            // Create image URL for frontend
            String imageUrl = "/uploads/products/" + fileName;

            // Create product
            Product product = Product.builder()
                    .name(name)
                    .category(category)
                    .size(size)
                    .price(new BigDecimal(price))
                    .stockQty(stockQty)
                    .minStock(minStock)
                    .description(description)
                    .imageUrl(imageUrl)
                    .isActive(true) // Explicitly set active
                    .build();

            Product savedProduct = productService.addProduct(product);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ Update Product
    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("category") String category,
            @RequestParam("size") String size,
            @RequestParam("price") String price,
            @RequestParam("stockQty") Integer stockQty,
            @RequestParam("description") String description,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        try {
            Product existingProduct = productService.getProductById(id);

            existingProduct.setName(name);
            existingProduct.setCategory(category);
            existingProduct.setSize(size);
            existingProduct.setPrice(new BigDecimal(price));
            existingProduct.setStockQty(stockQty);
            existingProduct.setDescription(description);

            // If new image is provided
            if (image != null && !image.isEmpty()) {
                // Delete old image file
                if (existingProduct.getImageUrl() != null) {
                    String oldImagePath = System.getProperty("user.dir") + existingProduct.getImageUrl();
                    File oldFile = new File(oldImagePath);
                    if (oldFile.exists()) {
                        oldFile.delete();
                    }
                }

                // Save new image
                String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
                String filePath = UPLOAD_DIR + fileName;
                image.transferTo(new File(filePath));

                String imageUrl = "/uploads/products/" + fileName;
                existingProduct.setImageUrl(imageUrl);
            }

            Product updatedProduct = productService.updateProduct(id, existingProduct);
            return ResponseEntity.ok(updatedProduct);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ SOFT DELETE - Mark as inactive
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            System.out.println("Soft deleting product with ID: " + id);

            Product product = productService.getProductById(id);
            productService.deleteProduct(id); // This now does soft delete

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Product deactivated successfully");
            response.put("id", id);
            response.put("status", "inactive");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error deleting product: " + e.getMessage());
            e.printStackTrace();

            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete product: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ✅ Optional: HARD DELETE - Actually remove (use carefully)
    @DeleteMapping("/{id}/hard")
    public ResponseEntity<?> hardDeleteProduct(@PathVariable Long id) {
        try {
            System.out.println("Hard deleting product with ID: " + id);

            // First delete image if exists
            Product product = productService.getProductById(id);
            if (product.getImageUrl() != null) {
                String imagePath = System.getProperty("user.dir") + product.getImageUrl();
                File file = new File(imagePath);
                if (file.exists()) {
                    file.delete();
                }
            }

            // Hard delete from database
            productService.hardDeleteProduct(id);

            return ResponseEntity.ok().body("Product permanently deleted");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
}