package com.denimhub.denim_hub.controller;

import com.denimhub.denim_hub.entity.Customer;
import com.denimhub.denim_hub.entity.Sale;
import com.denimhub.denim_hub.repository.CustomerRepository;
import com.denimhub.denim_hub.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerRepository customerRepository;
    private final SaleRepository saleRepository;

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id)));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Customer>> searchCustomers(@RequestParam String mobile) {
        return ResponseEntity.ok(customerRepository.findByMobileContaining(mobile));
    }

    @GetMapping("/{id}/orders")
    public ResponseEntity<List<Sale>> getCustomerOrders(@PathVariable Long id) {
        // Use the correct method name
        List<Sale> orders = saleRepository.findByCustomerIdOrderByBillDateDesc(id);
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @RequestBody Customer customer) {
        Customer existing = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        existing.setName(customer.getName());
        existing.setEmail(customer.getEmail());
        existing.setMobile(customer.getMobile());
        return ResponseEntity.ok(customerRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id) {
        if (!customerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        customerRepository.deleteById(id);
        return ResponseEntity.ok().body(Map.of("message", "Customer deleted successfully"));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCustomerStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCustomers", customerRepository.count());
        stats.put("totalSpent", customerRepository.getTotalCustomerSpending());

        List<Customer> topCustomers = customerRepository.findTop10ByOrderByTotalSpentDesc();
        if (!topCustomers.isEmpty()) {
            stats.put("topCustomer", topCustomers.get(0));
        }

        return ResponseEntity.ok(stats);
    }
}