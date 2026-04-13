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

    public Map<String, Object> getBillSummary(LocalDate fromDate, LocalDate toDate) {
        List<Sale> bills = getAllBills(fromDate, toDate);

        int totalBills = bills.size();
        BigDecimal totalAmount = bills.stream().map(Sale::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDiscount = bills.stream().map(s -> s.getDiscountAmount() != null ? s.getDiscountAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalItems = bills.stream().mapToInt(Sale::getTotalItems).sum();
        BigDecimal averageBillValue = totalBills > 0 ? totalAmount.divide(BigDecimal.valueOf(totalBills), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        Map<String, Long> paymentMethodCount = bills.stream().collect(Collectors.groupingBy(Sale::getPaymentMethod, Collectors.counting()));
        Map<String, BigDecimal> paymentMethodAmount = bills.stream().collect(Collectors.groupingBy(Sale::getPaymentMethod, Collectors.mapping(Sale::getTotalAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));

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

    public Map<String, Object> getPaymentBreakdown(LocalDate fromDate, LocalDate toDate) {
        List<Sale> bills = getAllBills(fromDate, toDate);
        Map<String, BigDecimal> breakdown = new HashMap<>();
        for (Sale bill : bills) {
            breakdown.put(bill.getPaymentMethod(), breakdown.getOrDefault(bill.getPaymentMethod(), BigDecimal.ZERO).add(bill.getTotalAmount()));
        }
        Map<String, Object> result = new HashMap<>();
        result.put("amounts", breakdown);
        return result;
    }
}