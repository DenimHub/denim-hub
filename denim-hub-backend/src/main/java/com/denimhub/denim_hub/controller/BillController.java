package com.denimhub.denim_hub.controller;

import com.denimhub.denim_hub.entity.Sale;
import com.denimhub.denim_hub.repository.SaleRepository;
import com.denimhub.denim_hub.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;
    private final SaleRepository saleRepository;

    @GetMapping
    public ResponseEntity<List<Sale>> getAllBills(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(billService.getAllBills(fromDate, toDate));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sale> getBillById(@PathVariable Long id) {
        return ResponseEntity.ok(saleRepository.findById(id).orElseThrow());
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getBillSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(billService.getBillSummary(fromDate, toDate));
    }

    @GetMapping("/payment-breakdown")
    public ResponseEntity<Map<String, Object>> getPaymentBreakdown(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(billService.getPaymentBreakdown(fromDate, toDate));
    }
}