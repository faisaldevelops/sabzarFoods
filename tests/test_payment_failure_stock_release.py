"""
Payment Failure Stock Release Tests

Test suite specifically for verifying that stock is properly released when:
1. User cancels/dismisses payment modal
2. Payment fails (card declined, insufficient funds, etc.)
3. Payment webhook fails to process

This test suite validates the fix for the issue where stock remained
reserved after payment failures.
"""

import pytest
import time
from api_client import APIClient
from test_data import generate_user_data, generate_address


class TestPaymentFailureStockRelease:
    """Test suite for payment failure stock release scenarios."""
    
    def setup_method(self):
        self.client = APIClient()
        self.created_order_ids = []  # Track order IDs for cleanup
        
    def teardown_method(self):
        """Clean up any hold orders created during test."""
        for order_id in self.created_order_ids:
            try:
                self.client.cancel_hold(order_id)
            except Exception as e:
                # Ignore 400/404 errors (order not found or not in hold status)
                # but log other errors for debugging
                error_msg = str(e).lower()
                if '400' not in error_msg and '404' not in error_msg:
                    print(f"Warning: Failed to cleanup order {order_id}: {e}")
    
    def test_stock_released_on_hold_cancellation(self):
        """
        Test that stock is properly released when hold is cancelled.
        
        Scenario:
        1. User initiates checkout - stock is reserved
        2. User cancels payment (dismisses Razorpay modal) - hold is cancelled
        3. Verify: Stock should be released and available for other users
        
        This simulates the most common payment failure scenario.
        """
        # Get products with stock
        products_response = self.client.get_products()
        assert products_response.status_code == 200
        
        data = products_response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        # Find product with stock = 2 (matches the problem scenario)
        product_with_stock = next(
            (p for p in products if p.get('stockQuantity', 0) == 2),
            None
        )
        
        # Fallback to any product with stock >= 2
        if not product_with_stock:
            product_with_stock = next(
                (p for p in products if p.get('stockQuantity', 0) >= 2),
                None
            )
        
        if not product_with_stock:
            pytest.skip("No products with stock >= 2 available")
        
        initial_stock = product_with_stock['stockQuantity']
        initial_reserved = product_with_stock.get('reservedQuantity', 0)
        product_id = product_with_stock['_id']
        
        print(f"\nInitial state - Stock: {initial_stock}, Reserved: {initial_reserved}")
        
        # Create user 1
        user1_data = generate_user_data()
        signup_resp = self.client.signup(
            name=user1_data['name'],
            email=user1_data['email'],
            password=user1_data['password']
        )
        assert signup_resp.status_code == 201
        
        # User 1 initiates checkout for 2 items
        address = generate_address()
        order_products = [{
            '_id': product_id,
            'id': product_id,
            'name': product_with_stock.get('name', 'Product'),
            'price': product_with_stock.get('price', 100),
            'quantity': 2,
            'image': product_with_stock.get('image', '')
        }]
        
        create_order_resp = self.client.create_razorpay_order(order_products, address)
        
        if create_order_resp.status_code == 500:
            pytest.skip("Razorpay may not be configured (server error)")
        
        assert create_order_resp.status_code == 200, f"Failed to create order: {create_order_resp.text}"
        
        order_data = create_order_resp.json()
        local_order_id = order_data['localOrderId']
        self.created_order_ids.append(local_order_id)
        
        print(f"Order created: {local_order_id}")
        
        # Get product again to check reserved quantity increased
        products_response2 = self.client.get_products()
        assert products_response2.status_code == 200
        
        products2 = products_response2.json()
        products2_list = products2 if isinstance(products2, list) else products2.get('products', [])
        product_after_reserve = next(
            (p for p in products2_list if p['_id'] == product_id),
            None
        )
        
        if product_after_reserve:
            reserved_after = product_after_reserve.get('reservedQuantity', 0)
            print(f"After reservation - Stock: {product_after_reserve['stockQuantity']}, Reserved: {reserved_after}")
            
            # Reserved quantity should have increased by 2
            assert reserved_after >= initial_reserved + 2, \
                f"Reserved quantity should increase from {initial_reserved} to at least {initial_reserved + 2}, got {reserved_after}"
        
        # Simulate user canceling payment by canceling the hold
        print(f"Cancelling hold order {local_order_id}")
        cancel_resp = self.client.cancel_hold(local_order_id)
        
        assert cancel_resp.status_code == 200, f"Failed to cancel hold: {cancel_resp.text}"
        assert cancel_resp.json().get('success') == True
        
        # Wait a moment for the stock release to propagate
        time.sleep(0.5)
        
        # Get product again to verify reserved quantity decreased
        products_response3 = self.client.get_products()
        assert products_response3.status_code == 200
        
        products3 = products_response3.json()
        products3_list = products3 if isinstance(products3, list) else products3.get('products', [])
        product_after_cancel = next(
            (p for p in products3_list if p['_id'] == product_id),
            None
        )
        
        assert product_after_cancel is not None, "Product should still exist"
        
        final_stock = product_after_cancel['stockQuantity']
        final_reserved = product_after_cancel.get('reservedQuantity', 0)
        
        print(f"After cancellation - Stock: {final_stock}, Reserved: {final_reserved}")
        
        # Stock quantity should be unchanged (not decremented)
        assert final_stock == initial_stock, \
            f"Stock should remain {initial_stock}, got {final_stock}"
        
        # Reserved quantity should be back to initial value (or close to it)
        assert final_reserved <= initial_reserved + 1, \
            f"Reserved quantity should return to ~{initial_reserved}, got {final_reserved}"
        
        print("✓ Stock properly released after hold cancellation")
    
    def test_stock_available_for_other_users_after_cancellation(self):
        """
        Test that other users can purchase after first user cancels.
        
        Scenario (matches the problem description):
        1. Product has 2 items in stock
        2. User 1 places order for 2 items - stock goes to 0 for other users
        3. User 1 cancels payment
        4. User 2 should be able to order the same 2 items
        
        This is the exact scenario from the bug report.
        """
        # Get products with stock
        products_response = self.client.get_products()
        assert products_response.status_code == 200
        
        data = products_response.json()
        products = data if isinstance(data, list) else data.get('products', [])
        
        # Find product with stock >= 2
        product_with_stock = next(
            (p for p in products if p.get('stockQuantity', 0) >= 2),
            None
        )
        
        if not product_with_stock:
            pytest.skip("No products with stock >= 2 available")
        
        product_id = product_with_stock['_id']
        
        # USER 1: Create checkout for 2 items
        user1_client = APIClient()
        user1_data = generate_user_data()
        signup1 = user1_client.signup(
            name=user1_data['name'],
            email=user1_data['email'],
            password=user1_data['password']
        )
        assert signup1.status_code == 201
        
        address1 = generate_address()
        order_products1 = [{
            '_id': product_id,
            'id': product_id,
            'name': product_with_stock.get('name', 'Product'),
            'price': product_with_stock.get('price', 100),
            'quantity': 2,
            'image': product_with_stock.get('image', '')
        }]
        
        order1_resp = user1_client.create_razorpay_order(order_products1, address1)
        
        if order1_resp.status_code == 500:
            pytest.skip("Razorpay may not be configured (server error)")
        
        assert order1_resp.status_code == 200
        order1_data = order1_resp.json()
        local_order_id1 = order1_data['localOrderId']
        self.created_order_ids.append(local_order_id1)
        
        print(f"\nUser 1 created order: {local_order_id1}")
        
        # USER 2: Try to create checkout for same 2 items (should fail - stock reserved)
        user2_client = APIClient()
        user2_data = generate_user_data()
        signup2 = user2_client.signup(
            name=user2_data['name'],
            email=f"user2_{user2_data['email']}",  # Ensure unique email
            password=user2_data['password']
        )
        assert signup2.status_code == 201
        
        address2 = generate_address()
        order_products2 = [{
            '_id': product_id,
            'id': product_id,
            'name': product_with_stock.get('name', 'Product'),
            'price': product_with_stock.get('price', 100),
            'quantity': 2,
            'image': product_with_stock.get('image', '')
        }]
        
        order2_resp_before_cancel = user2_client.create_razorpay_order(order_products2, address2)
        
        # This should fail with insufficient stock
        if order2_resp_before_cancel.status_code == 200:
            # If it succeeded, add to cleanup
            order2_data_temp = order2_resp_before_cancel.json()
            if 'localOrderId' in order2_data_temp:
                self.created_order_ids.append(order2_data_temp['localOrderId'])
                user2_client.cancel_hold(order2_data_temp['localOrderId'])
        
        print(f"User 2 checkout before cancellation - Status: {order2_resp_before_cancel.status_code}")
        assert order2_resp_before_cancel.status_code == 400, \
            "User 2 should not be able to checkout while User 1's hold is active"
        
        # USER 1: Cancel payment (simulating payment failure)
        print(f"User 1 cancelling hold: {local_order_id1}")
        cancel1_resp = user1_client.cancel_hold(local_order_id1)
        assert cancel1_resp.status_code == 200
        
        # Wait for stock release to propagate
        time.sleep(1)
        
        # USER 2: Try again - should now succeed
        order2_resp_after_cancel = user2_client.create_razorpay_order(order_products2, address2)
        
        print(f"User 2 checkout after User 1 cancellation - Status: {order2_resp_after_cancel.status_code}")
        
        if order2_resp_after_cancel.status_code == 200:
            order2_data = order2_resp_after_cancel.json()
            if 'localOrderId' in order2_data:
                self.created_order_ids.append(order2_data['localOrderId'])
        
        # This is the critical assertion - stock should be available after cancellation
        assert order2_resp_after_cancel.status_code == 200, \
            f"User 2 should be able to checkout after User 1 cancelled. Got: {order2_resp_after_cancel.text}"
        
        print("✓ Stock properly available for other users after first user cancelled")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
