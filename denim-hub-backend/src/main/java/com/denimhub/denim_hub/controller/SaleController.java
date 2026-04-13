package com.denimhub.denim_hub.controller;

import com.denimhub.denim_hub.DTO.SaleRequestDTO;
import com.denimhub.denim_hub.entity.Sale;
import com.denimhub.denim_hub.service.SaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
public class SaleController {

    private final SaleService saleService;
    // Remove BillCommunicationService - comment this line
    // private final BillCommunicationService communicationService;

    @PostMapping
    public ResponseEntity<?> createSale(@RequestBody SaleRequestDTO dto) {
        try {
            Sale sale = saleService.createSale(dto);

            // Remove all communication code
            // if (dto.getSendSMS() != null && dto.getSendSMS()) {
            //     communicationService.sendBillViaSMS(dto.getMobile(), sale);
            // }
            // if (dto.getSendEmail() != null && dto.getSendEmail()) {
            //     communicationService.sendBillViaEmail(dto.getEmail(), sale);
            // }
            // if (dto.getSendWhatsApp() != null && dto.getSendWhatsApp()) {
            //     communicationService.sendBillViaWhatsApp(dto.getMobile(), sale);
            // }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bill generated successfully");
            response.put("sale", sale);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sale> getSale(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.getSaleById(id));
    }
}