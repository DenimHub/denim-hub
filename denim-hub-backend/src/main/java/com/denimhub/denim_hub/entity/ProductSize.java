package com.denimhub.denim_hub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "product_sizes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSize {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Column(nullable = false)
    private String size;

    @Column(nullable = false)
    private Integer stockQty = 0;

    @Column(nullable = false)
    private BigDecimal price;

    @PrePersist
    @PreUpdate
    protected void validate() {
        if (stockQty == null) stockQty = 0;
        if (price == null) price = BigDecimal.ZERO;
    }
}