package com.denimhub.denim_hub.service;

import com.denimhub.denim_hub.entity.Sale;
import com.denimhub.denim_hub.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillService {

    private final SaleRepository saleRepository;

    public List<Sale> getAllBills(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null && toDate == null) {
            return saleRepository.findAllByOrderByBillDateDesc();
        }

        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDateTime.MIN;
        LocalDateTime end = toDate != null ? toDate.atTime(LocalTime.MAX) : LocalDateTime.MAX;

        return saleRepository.findByBillDateBetweenOrderByBillDateDesc(start, end);
    }

    public Sale getBillById(Long id) {
        return saleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found with id: " + id));
    }

    public Sale getBillByNumber(String saleNo) {
        return saleRepository.findBySaleNo(saleNo)
                .orElseThrow(() -> new RuntimeException("Bill not found with number: " + saleNo));
    }

    public Map<String, Object> getBillSummary(LocalDate fromDate, LocalDate toDate) {
        List<Sale> bills = getAllBills(fromDate, toDate);

        int totalBills = bills.size();
        BigDecimal totalAmount = bills.stream()
                .map(Sale::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDiscount = bills.stream()
                .map(s -> s.getDiscountAmount() != null ? s.getDiscountAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = bills.stream()
                .mapToInt(Sale::getTotalItems)
                .sum();

        BigDecimal averageBillValue = totalBills > 0
                ? totalAmount.divide(BigDecimal.valueOf(totalBills), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Payment method breakdown
        Map<String, Long> paymentMethodCount = bills.stream()
                .collect(Collectors.groupingBy(Sale::getPaymentMethod, Collectors.counting()));

        Map<String, BigDecimal> paymentMethodAmount = bills.stream()
                .collect(Collectors.groupingBy(
                        Sale::getPaymentMethod,
                        Collectors.mapping(Sale::getTotalAmount,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalBills", totalBills);
        summary.put("totalAmount", totalAmount);
        summary.put("totalDiscount", totalDiscount);
        summary.put("totalItems", totalItems);
        summary.put("averageBillValue", averageBillValue);
        summary.put("paymentMethodCount", paymentMethodCount);
        summary.put("paymentMethodAmount", paymentMethodAmount);

        return summary;
    }

    public List<Map<String, Object>> getDailyReport(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);

        List<Sale> bills = saleRepository.findByBillDateBetweenOrderByBillDateDesc(start, end);

        return bills.stream().map(bill -> {
            Map<String, Object> billData = new HashMap<>();
            billData.put("id", bill.getId());
            billData.put("saleNo", bill.getSaleNo());
            billData.put("time", bill.getBillDate().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
            billData.put("customer", bill.getCustomer().getName());
            billData.put("items", bill.getTotalItems());
            billData.put("subtotal", bill.getSubtotal());
            billData.put("discount", bill.getDiscountAmount());
            billData.put("total", bill.getTotalAmount());
            billData.put("paymentMethod", bill.getPaymentMethod());
            return billData;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getPaymentBreakdown(LocalDate fromDate, LocalDate toDate) {
        List<Sale> bills = getAllBills(fromDate, toDate);

        Map<String, BigDecimal> breakdown = new HashMap<>();
        Map<String, Integer> count = new HashMap<>();

        for (Sale bill : bills) {
            String method = bill.getPaymentMethod();
            breakdown.put(method, breakdown.getOrDefault(method, BigDecimal.ZERO).add(bill.getTotalAmount()));
            count.put(method, count.getOrDefault(method, 0) + 1);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("amounts", breakdown);
        result.put("counts", count);

        return result;
    }

    public byte[] generateBillPDF(Long id) {
        Sale bill = getBillById(id);
        // PDF generation logic will be implemented here
        // You can use iText or other PDF library
        return new byte[0]; // Placeholder
    }

    public byte[] exportBillsReportPDF(LocalDate fromDate, LocalDate toDate) {
        List<Sale> bills = getAllBills(fromDate, toDate);
        // PDF generation logic
        return new byte[0]; // Placeholder
    }

    public byte[] exportBillsReportCSV(LocalDate fromDate, LocalDate toDate) {
        List<Sale> bills = getAllBills(fromDate, toDate);

        StringBuilder csv = new StringBuilder();
        csv.append("Bill No,Date,Customer,Items,Subtotal,Discount,Total,Payment Method\n");

        for (Sale bill : bills) {
            csv.append(String.format("%s,%s,%s,%d,%.2f,%.2f,%.2f,%s\n",
                    bill.getSaleNo(),
                    bill.getBillDate().format(DateTimeFormatter.ISO_DATE),
                    bill.getCustomer().getName(),
                    bill.getTotalItems(),
                    bill.getSubtotal(),
                    bill.getDiscountAmount() != null ? bill.getDiscountAmount() : BigDecimal.ZERO,
                    bill.getTotalAmount(),
                    bill.getPaymentMethod()
            ));
        }

        return csv.toString().getBytes();
    }
}