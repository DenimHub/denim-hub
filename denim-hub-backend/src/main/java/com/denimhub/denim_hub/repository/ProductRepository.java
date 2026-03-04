package com.denimhub.denim_hub.repository;

import com.denimhub.denim_hub.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    // Get only active products
    List<Product> findByIsActiveTrue();

    // Get inactive products
    List<Product> findByIsActiveFalse();

    // Get all products (both active and inactive)
    List<Product> findAll();

    // Search only in active products
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.category) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Product> searchActiveProducts(@Param("search") String search);
}