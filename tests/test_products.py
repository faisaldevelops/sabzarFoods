"""
Product API Tests

Test cases for product management, viewing, and stock operations.
"""

import pytest
from api_client import APIClient
from test_data import generate_user_data, generate_product_data


class TestProductViewing:
    """Test suite for product viewing endpoints (public)."""
    
    def setup_method(self):
        self.client = APIClient()
        
    def test_get_all_products(self):
        """Test fetching all products."""
        response = self.client.get_products()
        
        assert response.status_code == 200, f"Get products failed: {response.text}"
        data = response.json()
        # Should return a list or object with products
        assert data is not None
        
    def test_get_featured_products(self):
        """Test fetching featured products."""
        response = self.client.get_featured_products()
        
        assert response.status_code == 200, f"Get featured products failed: {response.text}"
        
    def test_get_products_by_category(self):
        """Test fetching products by category."""
        categories = ['Electronics', 'Clothing', 'Books', 'Food', 'Home', 'Sports']
        
        for category in categories:
            response = self.client.get_products_by_category(category)
            assert response.status_code == 200, f"Get {category} products failed: {response.text}"
            
    def test_get_recommendations(self):
        """Test fetching product recommendations."""
        response = self.client.get_recommendations()
        
        assert response.status_code == 200, f"Get recommendations failed: {response.text}"
        
    def test_products_have_required_fields(self):
        """Test that products have all required fields."""
        response = self.client.get_products()
        assert response.status_code == 200
        
        data = response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        if not products:
            pytest.skip("No products available for testing")
            
        required_fields = ['_id', 'name', 'price', 'stockQuantity']
        
        for product in products[:5]:  # Check first 5 products
            for field in required_fields:
                assert field in product, f"Product missing required field: {field}"
                

class TestProductManagement:
    """Test suite for product management (admin only)."""
    
    def setup_method(self):
        self.client = APIClient()
        
    def test_create_product_unauthorized(self):
        """Test that non-admin cannot create products."""
        product_data = generate_product_data()
        
        response = self.client.create_product(product_data)
        
        assert response.status_code in [401, 403], "Unauthorized user should not create products"
        
    def test_create_product_as_admin(self):
        """Test creating a product as admin."""
        # This test requires admin credentials
        # Login as admin first
        from config import TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD
        
        login_response = self.client.login(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
        
        if login_response.status_code != 200:
            pytest.skip("Admin login failed - skipping admin test")
            
        product_data = generate_product_data()
        response = self.client.create_product(product_data)
        
        assert response.status_code in [200, 201], f"Create product failed: {response.text}"
        
    def test_update_stock_unauthorized(self):
        """Test that non-admin cannot update stock."""
        response = self.client.update_product_stock("some-product-id", 100)
        
        assert response.status_code in [401, 403], "Unauthorized user should not update stock"
        
    def test_delete_product_unauthorized(self):
        """Test that non-admin cannot delete products."""
        response = self.client.delete_product("some-product-id")
        
        assert response.status_code in [401, 403], "Unauthorized user should not delete products"


class TestProductStock:
    """Test suite for product stock validation."""
    
    def setup_method(self):
        self.client = APIClient()
        
    def test_product_has_stock_quantity(self):
        """Test that products have stockQuantity field."""
        response = self.client.get_products()
        assert response.status_code == 200
        
        data = response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        if not products:
            pytest.skip("No products available")
            
        for product in products[:5]:
            assert 'stockQuantity' in product, "Product should have stockQuantity"
            assert isinstance(product['stockQuantity'], (int, float)), "stockQuantity should be numeric"
            assert product['stockQuantity'] >= 0, "stockQuantity should not be negative"
            
    def test_product_may_have_reserved_quantity(self):
        """Test that products may have reservedQuantity field (new field)."""
        response = self.client.get_products()
        assert response.status_code == 200
        
        data = response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        if not products:
            pytest.skip("No products available")
            
        # reservedQuantity is optional for backward compatibility
        for product in products[:5]:
            if 'reservedQuantity' in product:
                assert isinstance(product['reservedQuantity'], (int, float)), "reservedQuantity should be numeric"
                assert product['reservedQuantity'] >= 0, "reservedQuantity should not be negative"
