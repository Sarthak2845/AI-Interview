package app.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.entity.Product;
import app.repository.ProductRepository;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "http://localhost:3000")  // allow React dev server
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    // GET /products
    // GET /products?category=Electronics
    // GET /products?q=watch
    @GetMapping
    public List<Product> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false, name = "q") String searchText) {

        if (category != null && !category.isEmpty()) {
            return productRepository.findByCategory(category);
        }

        if (searchText != null && !searchText.isEmpty()) {
            return productRepository.findByNameContainingIgnoreCase(searchText);
        }

        return productRepository.findAll();
    }

    // GET /products/{id}
    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        Optional<Product> product = productRepository.findById(id);
        return product.orElse(null); // simple for now (can improve later)
    }

    // LATER: Admin endpoints (create/update/delete) will be added here
}
