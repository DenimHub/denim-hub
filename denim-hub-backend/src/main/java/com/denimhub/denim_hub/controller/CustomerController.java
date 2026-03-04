package com.denimhub.denim_hub.controller;

import com.denimhub.denim_hub.entity.Customer;
import com.denimhub.denim_hub.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerRepository customerRepository;

    // Get all customers
    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        try {
            List<Customer> customers = customerRepository.findAllByOrderByCreatedAtDesc();
            return ResponseEntity.ok(customers);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get customer by ID
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomer(@PathVariable Long id) {
        try {
            Customer customer = customerRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
            return ResponseEntity.ok(customer);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }

    // Get customer by mobile
    @GetMapping("/mobile/{mobile}")
    public ResponseEntity<Customer> getCustomerByMobile(@PathVariable String mobile) {
        try {
            Customer customer = customerRepository.findByMobile(mobile)
                    .orElseThrow(() -> new RuntimeException("Customer not found with mobile: " + mobile));
            return ResponseEntity.ok(customer);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }

    // Update customer
    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @RequestBody Customer customer) {
        try {
            Customer existing = customerRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

            existing.setName(customer.getName());
            existing.setEmail(customer.getEmail());
            existing.setMobile(customer.getMobile());

            Customer updated = customerRepository.save(existing);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Delete customer
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id) {
        try {
            if (!customerRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            customerRepository.deleteById(id);
            return ResponseEntity.ok().body("Customer deleted successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to delete customer: " + e.getMessage());
        }
    }

    // Get customer statistics
    @GetMapping("/stats")
    public ResponseEntity<?> getCustomerStats() {
        try {
            long totalCustomers = customerRepository.count();
            double totalSpent = customerRepository.getTotalCustomerSpending();
            Customer topCustomer = customerRepository.findTopByOrderByTotalSpentDesc();

            return ResponseEntity.ok(new CustomerStats(totalCustomers, totalSpent, topCustomer));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Inner class for stats response
    static class CustomerStats {
        public long totalCustomers;
        public double totalSpent;
        public Customer topCustomer;

        public CustomerStats(long totalCustomers, double totalSpent, Customer topCustomer) {
            this.totalCustomers = totalCustomers;
            this.totalSpent = totalSpent;
            this.topCustomer = topCustomer;
        }
    }
}