package com.denimhub.denim_hub.controller;

import com.denimhub.denim_hub.entity.Product;
import com.denimhub.denim_hub.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:5173")
public class InventoryController {

    private final ProductService productService;

    public InventoryController(ProductService productService) {
        this.productService = productService;
    }

    // Get all inventory items
    @GetMapping
    public ResponseEntity<List<Product>> getInventory() {
        try {
            System.out.println("Fetching all products for inventory...");
            List<Product> products = productService.getAllProducts();
            System.out.println("Found " + products.size() + " products");

            // Log first product to see data
            if (!products.isEmpty()) {
                Product first = products.get(0);
                System.out.println("Sample product - Name: " + first.getName() +
                        ", Stock: " + first.getStockQty() +
                        ", MinStock: " + first.getMinStock());
            }

            return ResponseEntity.ok(products);
        } catch (Exception e) {
            System.err.println("Error fetching inventory: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get inventory summary
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getInventorySummary() {
        try {
            List<Product> products = productService.getAllProducts();

            int totalStock = products.stream()
                    .mapToInt(p -> p.getStockQty() != null ? p.getStockQty() : 0)
                    .sum();

            int lowStockCount = (int) products.stream()
                    .filter(p -> {
                        Integer stock = p.getStockQty() != null ? p.getStockQty() : 0;
                        Integer minStock = p.getMinStock() != null ? p.getMinStock() : 10;
                        return stock <= minStock;
                    })
                    .count();

            Map<String, Object> summary = new HashMap<>();
            summary.put("totalStock", totalStock);
            summary.put("lowStockCount", lowStockCount);
            summary.put("totalProducts", products.size());
            summary.put("avgStock", products.size() > 0 ? totalStock / products.size() : 0);

            return ResponseEntity.ok(summary);

        } catch (Exception e) {
            System.err.println("Error fetching summary: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Update min stock
    @PutMapping("/{id}/min-stock")
    public ResponseEntity<Product> updateMinStock(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request
    ) {
        try {
            Integer minStock = request.get("minStock");
            if (minStock == null) {
                minStock = 10; // Default value
            }

            Product product = productService.getProductById(id);
            product.setMinStock(minStock);
            Product updatedProduct = productService.updateProduct(id, product);

            return ResponseEntity.ok(updatedProduct);

        } catch (Exception e) {
            System.err.println("Error updating min stock: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // Update stock
    @PutMapping("/{id}/stock")
    public ResponseEntity<Product> updateStock(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request
    ) {
        try {
            Integer stockQty = request.get("stockQty");
            if (stockQty == null) {
                return ResponseEntity.badRequest().build();
            }

            Product product = productService.getProductById(id);
            product.setStockQty(stockQty);
            Product updatedProduct = productService.updateProduct(id, product);

            return ResponseEntity.ok(updatedProduct);

        } catch (Exception e) {
            System.err.println("Error updating stock: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}