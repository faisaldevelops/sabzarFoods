"""
Cart API Tests

Test cases for shopping cart operations.
"""

import pytest
from api_client import APIClient
from test_data import generate_user_data


class TestCartOperations:
    """Test suite for cart operations."""
    
    def setup_method(self):
        self.client = APIClient()
        
    def test_get_cart_authenticated(self):
        """Test getting cart for authenticated user."""
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        response = self.client.get_cart()
        
        assert response.status_code == 200, f"Get cart failed: {response.text}"
        
    def test_get_cart_unauthenticated(self):
        """Test getting cart for unauthenticated user."""
        response = self.client.get_cart()
        
        # Should return empty cart or guest mode response
        assert response.status_code in [200, 401], f"Get cart response: {response.text}"
        
    def test_add_to_cart(self):
        """Test adding product to cart."""
        # Get available products
        products_response = self.client.get_products()
        assert products_response.status_code == 200
        
        data = products_response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        if not products:
            pytest.skip("No products available for testing")
            
        # Create user and login
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        # Add product to cart
        product = products[0]
        response = self.client.add_to_cart(product['_id'])
        
        assert response.status_code in [200, 201], f"Add to cart failed: {response.text}"
        
    def test_add_to_cart_nonexistent_product(self):
        """Test adding non-existent product to cart."""
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        response = self.client.add_to_cart("nonexistent-product-id")
        
        # Should fail with appropriate error
        assert response.status_code in [400, 404], f"Should reject non-existent product: {response.text}"
        
    def test_update_cart_quantity(self):
        """Test updating cart item quantity."""
        # Get products
        products_response = self.client.get_products()
        assert products_response.status_code == 200
        
        data = products_response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        if not products:
            pytest.skip("No products available")
            
        # Create user
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        # Add product
        product = products[0]
        self.client.add_to_cart(product['_id'])
        
        # Update quantity
        response = self.client.update_cart_quantity(product['_id'], 3)
        
        assert response.status_code == 200, f"Update quantity failed: {response.text}"
        
    def test_update_cart_quantity_zero_removes_item(self):
        """Test that setting quantity to 0 removes item from cart."""
        products_response = self.client.get_products()
        assert products_response.status_code == 200
        
        data = products_response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        if not products:
            pytest.skip("No products available")
            
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        product = products[0]
        self.client.add_to_cart(product['_id'])
        
        # Set quantity to 0
        response = self.client.update_cart_quantity(product['_id'], 0)
        
        assert response.status_code in [200, 204], f"Set quantity to 0 failed: {response.text}"
        
        # Verify cart is empty
        cart_response = self.client.get_cart()
        cart_data = cart_response.json()
        cart_items = cart_data if isinstance(cart_data, list) else cart_data.get('items', [])
        
        # Item should be removed
        item_ids = [item.get('_id') or item.get('product') for item in cart_items]
        assert product['_id'] not in item_ids, "Item should be removed when quantity is 0"
        
    def test_remove_from_cart(self):
        """Test removing item from cart."""
        products_response = self.client.get_products()
        assert products_response.status_code == 200
        
        data = products_response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        if not products:
            pytest.skip("No products available")
            
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        product = products[0]
        self.client.add_to_cart(product['_id'])
        
        # Remove from cart
        response = self.client.remove_from_cart(product['_id'])
        
        assert response.status_code in [200, 204], f"Remove from cart failed: {response.text}"
        
    def test_clear_cart(self):
        """Test clearing entire cart."""
        products_response = self.client.get_products()
        assert products_response.status_code == 200
        
        data = products_response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        if len(products) < 2:
            pytest.skip("Need at least 2 products")
            
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        # Add multiple products
        for product in products[:2]:
            self.client.add_to_cart(product['_id'])
            
        # Clear cart
        response = self.client.clear_cart()
        
        assert response.status_code in [200, 204], f"Clear cart failed: {response.text}"
        
        # Verify cart is empty
        cart_response = self.client.get_cart()
        cart_data = cart_response.json()
        cart_items = cart_data if isinstance(cart_data, list) else cart_data.get('items', [])
        
        assert len(cart_items) == 0, "Cart should be empty after clearing"


class TestCartSync:
    """Test suite for cart synchronization after login."""
    
    def setup_method(self):
        self.client = APIClient()
        
    def test_sync_guest_cart(self):
        """Test syncing guest cart after login."""
        # Get products
        products_response = self.client.get_products()
        assert products_response.status_code == 200
        
        data = products_response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        if not products:
            pytest.skip("No products available")
            
        # Create user
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        # Simulate guest cart
        guest_cart = [
            {
                '_id': products[0]['_id'],
                'name': products[0].get('name', 'Product'),
                'price': products[0].get('price', 100),
                'quantity': 2,
                'image': products[0].get('image', '')
            }
        ]
        
        # Sync cart
        response = self.client.sync_cart(guest_cart)
        
        assert response.status_code == 200, f"Sync cart failed: {response.text}"
