package com.denimhub.denim_hub.repository;

import com.denimhub.denim_hub.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findAllByOrderByBillDateDesc();

    List<Sale> findByBillDateBetweenOrderByBillDateDesc(LocalDateTime start, LocalDateTime end);

    Optional<Sale> findBySaleNo(String saleNo);

    // FIXED: Use "customer" instead of "customerId"
    List<Sale> findByCustomerIdOrderByBillDateDesc(Long customerId);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE DATE(s.billDate) = CURRENT_DATE")
    BigDecimal getTodayTotal();

    @Query("SELECT COALESCE(COUNT(s), 0) FROM Sale s WHERE DATE(s.billDate) = CURRENT_DATE")
    Long getTodayCount();

    @Query("SELECT s FROM Sale s WHERE DATE(s.billDate) = :date")
    List<Sale> findByBillDate(@Param("date") LocalDateTime date);
}