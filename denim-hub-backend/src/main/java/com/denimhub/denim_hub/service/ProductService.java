package com.denimhub.denim_hub.service;

import com.denimhub.denim_hub.entity.Product;
import java.util.List;

public interface ProductService {
    Product addProduct(Product product);
    List<Product> getAllProducts(); // This will return only active products
    List<Product> getAllProductsIncludingInactive(); // Optional: get all
    Product getProductById(Long id);
    Product updateProduct(Long id, Product product);
    void deleteProduct(Long id); // This will now soft delete
    void hardDeleteProduct(Long id); // Optional: permanent delete
}