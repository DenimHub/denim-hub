package com.denimhub.denim_hub.repository;

import com.denimhub.denim_hub.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCode(String code);
    List<Coupon> findAllByOrderByCreatedAtDesc();
}