"""
API Client Module

Provides a reusable HTTP client for making API requests with authentication support.
"""

import requests
from typing import Optional, Dict, Any
from config import API_BASE_URL, REQUEST_TIMEOUT


class APIClient:
    """HTTP client for making API requests to the e-commerce backend."""
    
    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.user: Optional[Dict] = None
        
    def _get_headers(self, custom_headers: Optional[Dict] = None) -> Dict:
        """Build request headers."""
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        # Authentication is handled via cookies in session
        if custom_headers:
            headers.update(custom_headers)
        return headers
    
    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        timeout: int = REQUEST_TIMEOUT
    ) -> requests.Response:
        """Make an HTTP request to the API."""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        request_headers = self._get_headers(headers)
        
        response = self.session.request(
            method=method,
            url=url,
            json=data,
            params=params,
            headers=request_headers,
            timeout=timeout
        )
        return response
    
    def get(self, endpoint: str, params: Optional[Dict] = None, **kwargs) -> requests.Response:
        """Make a GET request."""
        return self._make_request('GET', endpoint, params=params, **kwargs)
    
    def post(self, endpoint: str, data: Optional[Dict] = None, **kwargs) -> requests.Response:
        """Make a POST request."""
        return self._make_request('POST', endpoint, data=data, **kwargs)
    
    def put(self, endpoint: str, data: Optional[Dict] = None, **kwargs) -> requests.Response:
        """Make a PUT request."""
        return self._make_request('PUT', endpoint, data=data, **kwargs)
    
    def patch(self, endpoint: str, data: Optional[Dict] = None, **kwargs) -> requests.Response:
        """Make a PATCH request."""
        return self._make_request('PATCH', endpoint, data=data, **kwargs)
    
    def delete(self, endpoint: str, data: Optional[Dict] = None, **kwargs) -> requests.Response:
        """Make a DELETE request."""
        return self._make_request('DELETE', endpoint, data=data, **kwargs)

    # ============ Authentication Methods ============
    
    def signup(self, name: str, email: str, password: str) -> requests.Response:
        """Register a new user."""
        response = self.post('/auth/signup', {
            'name': name,
            'email': email,
            'password': password
        })
        if response.status_code == 201:
            data = response.json()
            # API returns user data directly, tokens are in cookies (handled by session)
            self.user = data
        return response
    
    def login(self, email: str, password: str) -> requests.Response:
        """Login with email and password."""
        response = self.post('/auth/login', {
            'email': email,
            'password': password
        })
        if response.status_code == 200:
            data = response.json()
            # API returns user data directly, tokens are in cookies (handled by session)
            self.user = data
        return response
    
    def logout(self) -> requests.Response:
        """Logout the current user."""
        response = self.post('/auth/logout')
        self.user = None
        return response
    
    def create_guest_user(self, name: str, phone_number: str) -> requests.Response:
        """Create a guest user account."""
        return self.post('/auth/guest', {
            'name': name,
            'phoneNumber': phone_number
        })
    
    def get_profile(self) -> requests.Response:
        """Get the current user's profile."""
        return self.get('/auth/profile')

    # ============ Product Methods ============
    
    def get_products(self) -> requests.Response:
        """Get all products."""
        return self.get('/products')
    
    def get_featured_products(self) -> requests.Response:
        """Get featured products."""
        return self.get('/products/featured')
    
    def get_products_by_category(self, category: str) -> requests.Response:
        """Get products by category."""
        return self.get(f'/products/category/{category}')
    
    def get_recommendations(self) -> requests.Response:
        """Get product recommendations."""
        return self.get('/products/recommendations')
    
    def create_product(self, product_data: Dict) -> requests.Response:
        """Create a new product (admin only)."""
        return self.post('/products', product_data)
    
    def update_product_stock(self, product_id: str, stock_quantity: int) -> requests.Response:
        """Update product stock (admin only)."""
        return self.patch(f'/products/{product_id}/stock', {
            'stockQuantity': stock_quantity
        })
    
    def delete_product(self, product_id: str) -> requests.Response:
        """Delete a product (admin only)."""
        return self.delete(f'/products/{product_id}')

    # ============ Cart Methods ============
    
    def get_cart(self) -> requests.Response:
        """Get cart items."""
        return self.get('/cart')
    
    def add_to_cart(self, product_id: str) -> requests.Response:
        """Add a product to cart."""
        return self.post('/cart', {'productId': product_id})
    
    def update_cart_quantity(self, product_id: str, quantity: int) -> requests.Response:
        """Update cart item quantity."""
        return self.put(f'/cart/{product_id}', {'quantity': quantity})
    
    def remove_from_cart(self, product_id: str) -> requests.Response:
        """Remove item from cart."""
        return self.delete('/cart', {'productId': product_id})
    
    def clear_cart(self) -> requests.Response:
        """Clear the entire cart."""
        return self.delete('/cart')
    
    def sync_cart(self, guest_cart: list) -> requests.Response:
        """Sync guest cart after login."""
        return self.post('/cart/sync', {'guestCart': guest_cart})

    # ============ Payment/Checkout Methods ============
    
    def create_razorpay_order(self, products: list, address: Dict) -> requests.Response:
        """Create a Razorpay order with stock hold."""
        return self.post('/payments/razorpay-create-order', {
            'products': products,
            'address': address
        })
    
    def verify_razorpay_payment(
        self, 
        razorpay_order_id: str, 
        razorpay_payment_id: str, 
        razorpay_signature: str,
        local_order_id: str
    ) -> requests.Response:
        """Verify Razorpay payment."""
        return self.post('/payments/razorpay-verify', {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature,
            'localOrderId': local_order_id
        })
    
    def get_hold_status(self, local_order_id: str) -> requests.Response:
        """Get the status of a hold order."""
        return self.get('/payments/hold-status', params={'localOrderId': local_order_id})
    
    def cancel_hold(self, local_order_id: str) -> requests.Response:
        """Cancel a hold order."""
        return self.post('/payments/cancel-hold', {'localOrderId': local_order_id})

    # ============ Order Methods ============
    
    def get_orders(self) -> requests.Response:
        """Get all orders (admin only)."""
        return self.get('/orders')
    
    def get_my_orders(self) -> requests.Response:
        """Get current user's orders."""
        return self.get('/orders/my-orders')
    
    def get_order_tracking(self, order_id: str) -> requests.Response:
        """Get order tracking info."""
        return self.get(f'/orders/{order_id}/tracking')
    
    def update_order_tracking(self, order_id: str, tracking_data: Dict) -> requests.Response:
        """Update order tracking (admin only)."""
        return self.patch(f'/orders/{order_id}/tracking', tracking_data)
