package app.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import app.entity.Product;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // find all products of a category (for filter)
    List<Product> findByCategory(String category);

    // search products by name (case-insensitive)
    List<Product> findByNameContainingIgnoreCase(String name);
}
