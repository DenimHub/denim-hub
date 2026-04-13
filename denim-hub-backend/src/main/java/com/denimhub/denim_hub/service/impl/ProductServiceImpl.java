package com.denimhub.denim_hub.service.impl;

import com.denimhub.denim_hub.entity.Product;
import com.denimhub.denim_hub.entity.ProductSize;
import com.denimhub.denim_hub.repository.ProductRepository;
import com.denimhub.denim_hub.repository.ProductSizeRepository;
import com.denimhub.denim_hub.service.ProductService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductSizeRepository productSizeRepository;

    public ProductServiceImpl(ProductRepository productRepository, ProductSizeRepository productSizeRepository) {
        this.productRepository = productRepository;
        this.productSizeRepository = productSizeRepository;
    }

    @Override
    @Transactional
    public Product addProduct(Product product, List<ProductSize> sizes) {
        if (productRepository.existsByNameIgnoreCase(product.getName())) {
            throw new RuntimeException("Product with name '" + product.getName() + "' already exists!");
        }
        // Save product first (now without price)
        Product savedProduct = productRepository.save(product);

        // Save all sizes with prices
        for (ProductSize size : sizes) {
            size.setProduct(savedProduct);
            if (size.getPrice() == null) {
                throw new RuntimeException("Price is required for size: " + size.getSize());
            }
            productSizeRepository.save(size);
        }
        savedProduct.setSizes(sizes);
        return savedProduct;
    }
    @Override
    public List<Product> getAllProducts() {
        return productRepository.findByIsActiveTrue();
    }

    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }


    @Override
    @Transactional
    public Product updateProduct(Long id, Product updatedProduct, List<ProductSize> newSizes) {
        Product existingProduct = getProductById(id);

        // Check duplicate name
        if (!existingProduct.getName().equalsIgnoreCase(updatedProduct.getName()) &&
                productRepository.existsByNameIgnoreCase(updatedProduct.getName())) {
            throw new RuntimeException("Product with name '" + updatedProduct.getName() + "' already exists!");
        }

        // Update basic info
        existingProduct.setName(updatedProduct.getName());
        existingProduct.setCategory(updatedProduct.getCategory());
        existingProduct.setDescription(updatedProduct.getDescription());
        existingProduct.setMinStock(updatedProduct.getMinStock());
        existingProduct.setDiscountPercent(updatedProduct.getDiscountPercent());

        if (updatedProduct.getImageUrl() != null) {
            existingProduct.setImageUrl(updatedProduct.getImageUrl());
        }

        // IMPORTANT: Clear existing sizes properly
        if (existingProduct.getSizes() != null) {
            existingProduct.getSizes().clear();
        } else {
            existingProduct.setSizes(new ArrayList<>());
        }

        // Save the product first to avoid orphan deletion issues
        productRepository.save(existingProduct);

        // Add new sizes
        for (ProductSize size : newSizes) {
            size.setProduct(existingProduct);
            productSizeRepository.save(size);
            existingProduct.getSizes().add(size);
        }

        return productRepository.save(existingProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        product.setIsActive(false);
        productRepository.save(product);
    }

    @Override
    @Transactional
    public void hardDeleteProduct(Long id) {
        productSizeRepository.deleteByProductId(id);
        productRepository.deleteById(id);
    }

    @Override
    public boolean isProductNameExists(String name) {
        return productRepository.existsByNameIgnoreCase(name);
    }

    @Override
    public boolean isProductNameExistsExcludingId(String name, Long id) {
        Product existing = productRepository.findByNameIgnoreCase(name).orElse(null);
        return existing != null && !existing.getId().equals(id);
    }

    @Override
    @Transactional
    public Product updateMinStockOnly(Long id, Integer minStock) {
        Product product = getProductById(id);
        product.setMinStock(minStock);
        return productRepository.save(product);
    }

    @Override
    @Transactional
    public Product updateSizeStock(Long id, String size, Integer stockQty) {
        Product product = getProductById(id);
        for (ProductSize ps : product.getSizes()) {
            if (ps.getSize().equals(size)) {
                ps.setStockQty(stockQty);
                productSizeRepository.save(ps);
                break;
            }
        }
        return product;
    }



    @Override
    public List<String> suggestProductNames(String query) {
        return productRepository.findByIsActiveTrue().stream()
                .map(Product::getName)
                .filter(name -> name.toLowerCase().contains(query.toLowerCase()))
                .limit(5)
                .collect(Collectors.toList());
    }
}