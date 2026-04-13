package com.denimhub.denim_hub.controller;

import com.denimhub.denim_hub.entity.Coupon;
import com.denimhub.denim_hub.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/coupons")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class CouponController {

    private final CouponRepository couponRepository;

    @GetMapping
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/validate/{code}")
    public ResponseEntity<?> validateCoupon(@PathVariable String code) {
        Coupon coupon = couponRepository.findByCode(code.toUpperCase()).orElse(null);

        Map<String, Object> response = new HashMap<>();

        if (coupon == null) {
            response.put("valid", false);
            response.put("message", "Invalid coupon code");
            return ResponseEntity.ok(response);
        }

        if (!coupon.isValid()) {
            response.put("valid", false);
            response.put("message", "Coupon has expired");
            return ResponseEntity.ok(response);
        }

        response.put("valid", true);
        response.put("discountPercent", coupon.getDiscountPercent());
        response.put("message", "Coupon applied successfully");
        response.put("coupon", coupon);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> createCoupon(@RequestBody Map<String, Object> requestData) {
        try {
            System.out.println("Received coupon data: " + requestData);

            // Extract fields
            String code = (String) requestData.get("code");
            String companyName = (String) requestData.get("companyName");
            String contactPerson = (String) requestData.get("contactPerson");
            String email = (String) requestData.get("email");

            // Handle discount percent
            Number discountNum = (Number) requestData.get("discountPercent");
            BigDecimal discountPercent = BigDecimal.valueOf(discountNum.doubleValue());

            // Handle dates
            String validFromStr = (String) requestData.get("validFrom");
            String validUntilStr = (String) requestData.get("validUntil");

            LocalDateTime validFrom;
            LocalDateTime validUntil;

            // Parse dates (handle both YYYY-MM-DD and YYYY-MM-DDTHH:MM:SS formats)
            if (validFromStr.length() == 10) {
                validFrom = LocalDate.parse(validFromStr).atStartOfDay();
            } else {
                validFrom = LocalDateTime.parse(validFromStr);
            }

            if (validUntilStr.length() == 10) {
                validUntil = LocalDate.parse(validUntilStr).atTime(23, 59, 59);
            } else {
                validUntil = LocalDateTime.parse(validUntilStr);
            }

            // Handle usage limit
            Integer usageLimit = null;
            if (requestData.get("usageLimit") != null && !requestData.get("usageLimit").toString().isEmpty()) {
                usageLimit = ((Number) requestData.get("usageLimit")).intValue();
            }

            // Check if coupon already exists
            if (couponRepository.findByCode(code.toUpperCase()).isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Coupon code already exists");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            }

            // Create coupon
            Coupon coupon = Coupon.builder()
                    .code(code.toUpperCase())
                    .companyName(companyName)
                    .contactPerson(contactPerson)
                    .email(email)
                    .discountPercent(discountPercent)
                    .validFrom(validFrom)
                    .validUntil(validUntil)
                    .isActive(true)
                    .usageLimit(usageLimit)
                    .usedCount(0)
                    .createdAt(LocalDateTime.now())
                    .build();

            Coupon saved = couponRepository.save(coupon);
            System.out.println("Coupon saved: " + saved);

            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create coupon: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCoupon(@PathVariable Long id) {
        if (!couponRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        couponRepository.deleteById(id);
        return ResponseEntity.ok().body(Map.of("message", "Coupon deleted successfully"));
    }
}