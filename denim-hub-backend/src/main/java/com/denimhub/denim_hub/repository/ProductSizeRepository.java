package com.denimhub.denim_hub.repository;

import com.denimhub.denim_hub.entity.ProductSize;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface ProductSizeRepository extends JpaRepository<ProductSize, Long> {
    @Modifying
    @Transactional
    @Query("DELETE FROM ProductSize ps WHERE ps.product.id = :productId")
    void deleteByProductId(Long productId);
}