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
    private final SaleRepository saleRepo;  // This was missing!
    private final SaleItemRepository saleItemRepo;

    @Transactional
    public Sale createSale(SaleRequestDTO dto) {

        // CUSTOMER CHECK
        Customer customer = customerRepo.findByMobile(dto.getMobile())
                .orElseGet(() -> Customer.builder()
                        .name(dto.getName())
                        .mobile(dto.getMobile())
                        .email(dto.getEmail())
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

        List<SaleItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItems = 0;

        for (SaleItemDTO itemDTO : dto.getItems()) {

            Product product = productRepo.findById(itemDTO.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + itemDTO.getProductId()));

            // Check stock
            if (product.getStockQty() < itemDTO.getQuantity()) {
                throw new RuntimeException("Not enough stock for product: " + product.getName() +
                        ". Available: " + product.getStockQty() + ", Requested: " + itemDTO.getQuantity());
            }

            // Update stock
            product.setStockQty(product.getStockQty() - itemDTO.getQuantity());
            productRepo.save(product);

            // Calculate item total
            BigDecimal itemTotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(itemDTO.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);

            // Create sale item
            SaleItem saleItem = SaleItem.builder()
                    .sale(sale)
                    .product(product)
                    .quantity(itemDTO.getQuantity())
                    .price(product.getPrice())
                    .total(itemTotal)
                    .build();

            subtotal = subtotal.add(itemTotal);
            totalItems += itemDTO.getQuantity();
            items.add(saleItem);
        }

        // Calculate discount
        BigDecimal discountPercent = dto.getDiscountPercent() != null ? dto.getDiscountPercent() : BigDecimal.ZERO;
        BigDecimal discountAmount = subtotal
                .multiply(discountPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal finalAmount = subtotal.subtract(discountAmount);

        // Set sale properties
        sale.setSubtotal(subtotal);
        sale.setDiscountAmount(discountAmount);
        sale.setTotalAmount(finalAmount);
        sale.setTotalItems(totalItems);

        // Save sale first
        Sale savedSale = saleRepo.save(sale);

        // Associate items with sale and save them
        for (SaleItem item : items) {
            item.setSale(savedSale);
            saleItemRepo.save(item);
        }

        savedSale.setItems(items);

        // Update customer total spent
        customer.setTotalSpent(customer.getTotalSpent().add(finalAmount));
        customerRepo.save(customer);

        return savedSale;
    }

    public Sale getSaleById(Long id) {
        return saleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Sale not found with id: " + id));
    }

    public List<Sale> getAllSales() {
        return saleRepo.findAllByOrderByBillDateDesc();
    }

    @Transactional
    public void deleteSale(Long id) {
        Sale sale = getSaleById(id);

        // Restore product stock
        for (SaleItem item : sale.getItems()) {
            Product product = item.getProduct();
            product.setStockQty(product.getStockQty() + item.getQuantity());
            productRepo.save(product);
        }

        saleRepo.delete(sale);
    }
}