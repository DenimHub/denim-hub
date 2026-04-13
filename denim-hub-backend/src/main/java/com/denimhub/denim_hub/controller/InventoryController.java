package com.denimhub.denim_hub.controller;

import com.denimhub.denim_hub.entity.Product;
import com.denimhub.denim_hub.entity.ProductSize;
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

    @GetMapping
    public ResponseEntity<List<Product>> getInventory() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getInventorySummary() {
        List<Product> products = productService.getAllProducts();

        int totalStock = products.stream()
                .mapToInt(p -> p.getSizes().stream().mapToInt(ProductSize::getStockQty).sum())
                .sum();

        int lowStockCount = (int) products.stream()
                .filter(p -> {
                    int total = p.getSizes().stream().mapToInt(ProductSize::getStockQty).sum();
                    return total <= (p.getMinStock() != null ? p.getMinStock() : 10);
                })
                .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalStock", totalStock);
        summary.put("lowStockCount", lowStockCount);
        summary.put("totalProducts", products.size());
        return ResponseEntity.ok(summary);
    }

    @PutMapping("/{id}/min-stock")
    public ResponseEntity<Product> updateMinStock(@PathVariable Long id, @RequestBody Map<String, Integer> request) {
        Product product = productService.updateMinStockOnly(id, request.get("minStock"));
        return ResponseEntity.ok(product);
    }

    @PutMapping("/{id}/stock")
    public ResponseEntity<Product> updateStock(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        String size = (String) request.get("size");
        Integer stockQty = (Integer) request.get("stockQty");
        Product product = productService.updateSizeStock(id, size, stockQty);
        return ResponseEntity.ok(product);
    }
}