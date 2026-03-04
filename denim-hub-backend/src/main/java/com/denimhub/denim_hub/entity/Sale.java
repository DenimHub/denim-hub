package com.denimhub.denim_hub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "sales")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String saleNo;

    @ManyToOne(fetch = FetchType.EAGER)  // Change to EAGER to load customer automatically
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "bill_date", updatable = false)
    private LocalDateTime billDate;

    @Column(name = "total_items")
    private Integer totalItems;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_percent", precision = 5, scale = 2)
    private BigDecimal discountPercent;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_status")
    private String paymentStatus = "Paid";

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<SaleItem> items;

    @PrePersist
    protected void onCreate() {
        this.billDate = LocalDateTime.now();
        if (this.paymentStatus == null) this.paymentStatus = "Paid";
    }
}