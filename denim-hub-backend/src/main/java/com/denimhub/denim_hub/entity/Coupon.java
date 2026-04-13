package com.denimhub.denim_hub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private String companyName;

    private String contactPerson;

    private String email;

    @Column(nullable = false)
    private BigDecimal discountPercent;

    @Column(nullable = false)
    private LocalDateTime validFrom;

    @Column(nullable = false)
    private LocalDateTime validUntil;

    @Column(nullable = false)
    private Boolean isActive = true;

    private Integer usageLimit;

    private Integer usedCount = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.usedCount == null) this.usedCount = 0;
        if (this.isActive == null) this.isActive = true;
    }

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return isActive && now.isAfter(validFrom) && now.isBefore(validUntil) &&
                (usageLimit == null || usedCount < usageLimit);
    }
}