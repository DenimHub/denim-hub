package com.denimhub.denim_hub.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {
    private Long id;
    private String name;
    private String email;
    private String mobile;
    private Integer totalOrders;
    private BigDecimal totalSpent;
    private LocalDateTime createdAt;
}