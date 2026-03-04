package com.denimhub.denim_hub.DTO;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SaleRequestDTO {
    private String name;
    private String mobile;
    private String email;
    private BigDecimal discountPercent;
    private String paymentMethod;
    private List<SaleItemDTO> items;

    // Communication options
    private Boolean sendSMS = false;
    private Boolean sendEmail = false;
    private Boolean sendWhatsApp = false;
}