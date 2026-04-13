package com.denimhub.denim_hub.service;

import com.denimhub.denim_hub.entity.Product;
import com.denimhub.denim_hub.entity.ProductSize;
import java.util.List;

public interface ProductService {
    Product addProduct(Product product, List<ProductSize> sizes);
    List<Product> getAllProducts();
    Product getProductById(Long id);
    Product updateProduct(Long id, Product product, List<ProductSize> sizes);
    void deleteProduct(Long id);
    void hardDeleteProduct(Long id);
    boolean isProductNameExists(String name);
    boolean isProductNameExistsExcludingId(String name, Long id);
    Product updateMinStockOnly(Long id, Integer minStock);
    Product updateSizeStock(Long id, String size, Integer stockQty);
    List<String> suggestProductNames(String query);
}