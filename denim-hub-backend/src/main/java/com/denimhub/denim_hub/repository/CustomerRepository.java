package com.denimhub.denim_hub.repository;

import com.denimhub.denim_hub.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByMobile(String mobile);

    Optional<Customer> findByEmail(String email);

    List<Customer> findAllByOrderByCreatedAtDesc();

    @Query("SELECT SUM(c.totalSpent) FROM Customer c")
    Double getTotalCustomerSpending();

    Customer findTopByOrderByTotalSpentDesc();

    List<Customer> findTop10ByOrderByTotalSpentDesc();

    @Query("SELECT c FROM Customer c WHERE " +
            "LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "c.mobile LIKE CONCAT('%', :search, '%')")
    List<Customer> searchCustomers(String search);
}