package com.denimhub.denim_hub.service.impl;

import com.denimhub.denim_hub.entity.Product;
import com.denimhub.denim_hub.repository.ProductRepository;
import com.denimhub.denim_hub.service.ProductService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public Product addProduct(Product product) {
        product.setIsActive(true); // Ensure new products are active
        return productRepository.save(product);
    }

    @Override
    public List<Product> getAllProducts() {
        // Return ONLY active products (soft delete filter)
        return productRepository.findByIsActiveTrue();
    }

    @Override
    public List<Product> getAllProductsIncludingInactive() {
        // Return all products (including soft deleted ones)
        return productRepository.findAll();
    }

    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    @Override
    public Product updateProduct(Long id, Product updatedProduct) {
        Product existingProduct = getProductById(id);

        existingProduct.setName(updatedProduct.getName());
        existingProduct.setCategory(updatedProduct.getCategory());
        existingProduct.setSize(updatedProduct.getSize());
        existingProduct.setPrice(updatedProduct.getPrice());
        existingProduct.setStockQty(updatedProduct.getStockQty());
        existingProduct.setDescription(updatedProduct.getDescription());

        // Don't update isActive here - that's for delete operation

        return productRepository.save(existingProduct);
    }

    @Override
    public void deleteProduct(Long id) {
        // SOFT DELETE - just mark as inactive
        Product product = getProductById(id);
        product.setIsActive(false); // Mark as inactive instead of deleting
        productRepository.save(product);
        System.out.println("Product " + id + " soft deleted (marked inactive)");
    }

    @Override
    public void hardDeleteProduct(Long id) {
        // HARD DELETE - actually remove from database
        // Use this carefully - only if you're sure there are no foreign key constraints
        Product product = getProductById(id);
        productRepository.delete(product);
        System.out.println("Product " + id + " permanently deleted");
    }
}