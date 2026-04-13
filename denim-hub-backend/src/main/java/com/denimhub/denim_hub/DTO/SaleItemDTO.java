package com.denimhub.denim_hub.DTO;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SaleItemDTO {
    private Long productId;
    private String size;
    private Integer quantity;
}