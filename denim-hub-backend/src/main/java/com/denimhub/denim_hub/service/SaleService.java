package com.denimhub.denim_hub.service;

import com.denimhub.denim_hub.DTO.*;
import com.denimhub.denim_hub.entity.*;
import com.denimhub.denim_hub.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final CustomerRepository customerRepo;
    private final ProductRepository productRepo;
    private final SaleRepository saleRepo;
    private final SaleItemRepository saleItemRepo;
    private final ProductSizeRepository productSizeRepo;
    private final CouponRepository couponRepository;

    @Transactional
    public Sale createSale(SaleRequestDTO dto) {

        // Find or create customer
        Customer customer = customerRepo.findByMobile(dto.getMobile())
                .orElseGet(() -> Customer.builder()
                        .name(dto.getName())
                        .mobile(dto.getMobile())
                        .email(dto.getEmail() != null ? dto.getEmail() : "")
                        .totalOrders(0)
                        .totalSpent(BigDecimal.ZERO)
                        .build());

        customer.setTotalOrders(customer.getTotalOrders() + 1);
        customer = customerRepo.save(customer);

        // Create Sale
        Sale sale = new Sale();
        sale.setSaleNo("DH-" + System.currentTimeMillis());
        sale.setCustomer(customer);
        sale.setPaymentMethod(dto.getPaymentMethod());
        sale.setDiscountPercent(dto.getDiscountPercent());

        // Apply coupon if provided
        BigDecimal couponDiscountAmount = BigDecimal.ZERO;
        if (dto.getCouponCode() != null && !dto.getCouponCode().isEmpty()) {
            Coupon coupon = couponRepository.findByCode(dto.getCouponCode().toUpperCase()).orElse(null);
            if (coupon != null && coupon.isValid()) {
                coupon.setUsedCount(coupon.getUsedCount() + 1);
                couponRepository.save(coupon);
                sale.setCouponCode(coupon.getCode());
                couponDiscountAmount = dto.getSubtotalBeforeDiscount()
                        .multiply(coupon.getDiscountPercent())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                sale.setCouponDiscount(couponDiscountAmount);
            }
        }

        List<SaleItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItems = 0;

        for (SaleItemDTO itemDTO : dto.getItems()) {

            Product product = productRepo.findById(itemDTO.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            List<ProductSize> sizes = product.getSizes();
            ProductSize selectedSize = sizes.stream()
                    .filter(s -> s.getSize().equals(itemDTO.getSize()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Size not found"));

            if (selectedSize.getStockQty() < itemDTO.getQuantity()) {
                throw new RuntimeException("Not enough stock");
            }

            selectedSize.setStockQty(selectedSize.getStockQty() - itemDTO.getQuantity());
            productSizeRepo.save(selectedSize);

            // Calculate price with product discount
            BigDecimal originalPrice = selectedSize.getPrice();
            BigDecimal finalPrice = originalPrice;
            BigDecimal productDiscountPercent = BigDecimal.ZERO;

            if (product.getDiscountPercent() != null &&
                    product.getDiscountPercent().compareTo(BigDecimal.valueOf(50)) <= 0 &&
                    product.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0) {
                productDiscountPercent = product.getDiscountPercent();
                finalPrice = originalPrice
                        .multiply(BigDecimal.valueOf(100).subtract(productDiscountPercent))
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }

            BigDecimal itemTotal = finalPrice.multiply(BigDecimal.valueOf(itemDTO.getQuantity()));

            SaleItem saleItem = SaleItem.builder()
                    .sale(sale)
                    .product(product)
                    .size(itemDTO.getSize())
                    .quantity(itemDTO.getQuantity())
                    .price(finalPrice)
                    .originalPrice(originalPrice)
                    .productDiscountPercent(productDiscountPercent)
                    .total(itemTotal)
                    .build();

            subtotal = subtotal.add(itemTotal);
            totalItems += itemDTO.getQuantity();
            items.add(saleItem);
        }

        // Calculate discounts
        BigDecimal discountPercent = dto.getDiscountPercent() != null ? dto.getDiscountPercent() : BigDecimal.ZERO;
        BigDecimal discountAmount = subtotal.multiply(discountPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal finalAmount = subtotal.subtract(discountAmount).subtract(couponDiscountAmount);

        sale.setSubtotal(subtotal);
        sale.setDiscountAmount(discountAmount);
        sale.setTotalAmount(finalAmount);
        sale.setTotalItems(totalItems);

        Sale savedSale = saleRepo.save(sale);

        for (SaleItem item : items) {
            item.setSale(savedSale);
            saleItemRepo.save(item);
        }

        savedSale.setItems(items);

        customer.setTotalSpent(customer.getTotalSpent().add(finalAmount));
        customerRepo.save(customer);

        return savedSale;
    }

    public Sale getSaleById(Long id) {
        return saleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Sale not found"));
    }
}