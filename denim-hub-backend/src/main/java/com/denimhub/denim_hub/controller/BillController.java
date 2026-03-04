package com.denimhub.denim_hub.controller;

import com.denimhub.denim_hub.entity.Sale;
import com.denimhub.denim_hub.repository.SaleRepository;
import com.denimhub.denim_hub.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
    private final SaleRepository saleRepository;  // Add this line

    // Get all bills with optional date filtering
    @GetMapping
    public ResponseEntity<List<Sale>> getAllBills(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(billService.getAllBills(fromDate, toDate));
    }

    // Get bill by ID - FIXED with saleRepository
    @GetMapping("/{id}")
    public ResponseEntity<Sale> getBillById(@PathVariable Long id) {
        try {
            Sale sale = saleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Bill not found with id: " + id));

            // Force loading of customer data
            if (sale.getCustomer() != null) {
                sale.getCustomer().getName(); // This ensures customer data is loaded
            }

            return ResponseEntity.ok(sale);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }

    // Get bill by bill number
    @GetMapping("/number/{saleNo}")
    public ResponseEntity<Sale> getBillByNumber(@PathVariable String saleNo) {
        return ResponseEntity.ok(billService.getBillByNumber(saleNo));
    }

    // Get bill summary (totals, counts)
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getBillSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(billService.getBillSummary(fromDate, toDate));
    }

    // Get daily sales report
    @GetMapping("/daily")
    public ResponseEntity<List<Map<String, Object>>> getDailyReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(billService.getDailyReport(date));
    }

    // Get payment method breakdown
    @GetMapping("/payment-breakdown")
    public ResponseEntity<Map<String, Object>> getPaymentBreakdown(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(billService.getPaymentBreakdown(fromDate, toDate));
    }

    // Print bill (PDF generation)
    @GetMapping("/{id}/print")
    public ResponseEntity<byte[]> printBill(@PathVariable Long id) {
        byte[] pdfBytes = billService.generateBillPDF(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "bill-" + id + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    // Export bills report as PDF
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportBillsPDF(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        byte[] pdfBytes = billService.exportBillsReportPDF(fromDate, toDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "bills-report.pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    // Export bills report as CSV
    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportBillsCSV(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        byte[] csvBytes = billService.exportBillsReportCSV(fromDate, toDate);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.setContentDispositionFormData("filename", "bills-report.csv");
        headers.setContentLength(csvBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvBytes);
    }
}