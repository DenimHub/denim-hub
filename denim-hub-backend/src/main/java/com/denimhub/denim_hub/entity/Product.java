package com.denimhub.denim_hub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    private String size;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "stock_qty", nullable = false)
    private Integer stockQty;

    @Column(name = "min_stock")
    private Integer minStock = 10; // Default value

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.minStock == null) {
            this.minStock = 10;
        }
        if (this.stockQty == null) {
            this.stockQty = 0;
        }
    }

    // Helper method to safely get minStock
    public Integer getMinStock() {
        return minStock != null ? minStock : 10;
    }

    // Helper method to safely get stockQty
    public Integer getStockQty() {
        return stockQty != null ? stockQty : 0;
    }

    // Helper method to safely get isActive
    public Boolean getIsActive() {
        return isActive != null ? isActive : true;
    }
}