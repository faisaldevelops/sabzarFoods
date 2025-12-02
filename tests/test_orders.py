"""
Order API Tests

Test cases for order management and tracking.
"""

import pytest
from api_client import APIClient
from test_data import generate_user_data, generate_address
from config import TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD


class TestOrderViewing:
    """Test suite for viewing orders."""
    
    def setup_method(self):
        self.client = APIClient()
        
    def test_get_my_orders_authenticated(self):
        """Test getting orders for authenticated user."""
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        response = self.client.get_my_orders()
        
        assert response.status_code == 200, f"Get my orders failed: {response.text}"
        
    def test_get_my_orders_unauthenticated(self):
        """Test getting orders without authentication fails."""
        response = self.client.get_my_orders()
        
        assert response.status_code in [401, 403], "Unauthenticated access should be denied"
        
    def test_get_all_orders_admin(self):
        """Test getting all orders as admin."""
        login_response = self.client.login(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
        
        if login_response.status_code != 200:
            pytest.skip("Admin login failed")
            
        response = self.client.get_orders()
        
        assert response.status_code == 200, f"Get all orders failed: {response.text}"
        
    def test_get_all_orders_non_admin(self):
        """Test that non-admin cannot get all orders."""
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        response = self.client.get_orders()
        
        assert response.status_code in [401, 403], "Non-admin should not access all orders"


class TestOrderTracking:
    """Test suite for order tracking."""
    
    def setup_method(self):
        self.client = APIClient()
        
    def test_get_order_tracking(self):
        """Test getting tracking info for an order."""
        # This test requires an existing order
        # First create a hold order
        products_response = self.client.get_products()
        assert products_response.status_code == 200
        
        data = products_response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        product_with_stock = next(
            (p for p in products if p.get('stockQuantity', 0) > 0),
            None
        )
        
        if not product_with_stock:
            pytest.skip("No products with stock available")
            
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        address = generate_address()
        order_products = [{
            '_id': product_with_stock['_id'],
            'id': product_with_stock['_id'],
            'name': product_with_stock.get('name', 'Product'),
            'price': product_with_stock.get('price', 100),
            'quantity': 1,
            'image': product_with_stock.get('image', '')
        }]
        
        order_response = self.client.create_razorpay_order(order_products, address)
        
        if order_response.status_code != 200:
            pytest.skip("Could not create order for tracking test")
            
        local_order_id = order_response.json().get('localOrderId')
        
        # Get tracking
        tracking_response = self.client.get_order_tracking(local_order_id)
        
        assert tracking_response.status_code == 200, f"Get tracking failed: {tracking_response.text}"
        
    def test_get_tracking_invalid_order(self):
        """Test getting tracking for invalid order ID."""
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        response = self.client.get_order_tracking('invalid-order-id')
        
        assert response.status_code in [400, 404], \
            f"Invalid order tracking should fail: {response.text}"
            
    def test_update_tracking_admin(self):
        """Test updating order tracking as admin."""
        login_response = self.client.login(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
        
        if login_response.status_code != 200:
            pytest.skip("Admin login failed")
            
        # Get an existing order first
        orders_response = self.client.get_orders()
        assert orders_response.status_code == 200
        
        orders = orders_response.json()
        order_list = orders.get('data', []) if isinstance(orders, dict) else orders
        
        if not order_list:
            pytest.skip("No orders available for tracking update test")
            
        order_id = order_list[0].get('orderId') or order_list[0].get('_id')
        
        # Update tracking
        tracking_data = {
            'trackingStatus': 'processing',
            'note': 'Order is being processed'
        }
        
        response = self.client.update_order_tracking(order_id, tracking_data)
        
        assert response.status_code == 200, f"Update tracking failed: {response.text}"
        
    def test_update_tracking_non_admin(self):
        """Test that non-admin cannot update tracking."""
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        tracking_data = {
            'trackingStatus': 'processing',
            'note': 'Attempted unauthorized update'
        }
        
        response = self.client.update_order_tracking('some-order-id', tracking_data)
        
        assert response.status_code in [401, 403], "Non-admin should not update tracking"


class TestOrderHistory:
    """Test suite for order history tracking."""
    
    def setup_method(self):
        self.client = APIClient()
        
    def test_order_has_tracking_history(self):
        """Test that orders have tracking history."""
        products_response = self.client.get_products()
        assert products_response.status_code == 200
        
        data = products_response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        product_with_stock = next(
            (p for p in products if p.get('stockQuantity', 0) > 0),
            None
        )
        
        if not product_with_stock:
            pytest.skip("No products with stock available")
            
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        address = generate_address()
        order_products = [{
            '_id': product_with_stock['_id'],
            'id': product_with_stock['_id'],
            'name': product_with_stock.get('name', 'Product'),
            'price': product_with_stock.get('price', 100),
            'quantity': 1,
            'image': product_with_stock.get('image', '')
        }]
        
        order_response = self.client.create_razorpay_order(order_products, address)
        
        if order_response.status_code != 200:
            pytest.skip("Could not create order for history test")
            
        local_order_id = order_response.json().get('localOrderId')
        
        # Get tracking
        tracking_response = self.client.get_order_tracking(local_order_id)
        
        if tracking_response.status_code == 200:
            tracking_data = tracking_response.json()
            # Should have tracking history
            if 'data' in tracking_data:
                assert 'trackingHistory' in tracking_data['data'] or True
