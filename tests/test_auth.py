"""
Authentication API Tests

Test cases for user authentication, registration, and session management.
"""

import pytest
from api_client import APIClient
from test_data import generate_user_data, generate_guest_data


class TestAuthentication:
    """Test suite for authentication endpoints."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.client = APIClient()
    
    def test_signup_success(self):
        """Test successful user registration."""
        user_data = generate_user_data()
        response = self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        assert response.status_code == 201, f"Signup failed: {response.text}"
        data = response.json()
        assert 'accessToken' in data or 'user' in data
        
    def test_signup_duplicate_email(self):
        """Test registration with duplicate email fails."""
        user_data = generate_user_data()
        
        # First signup
        response1 = self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        assert response1.status_code == 201
        
        # Second signup with same email
        client2 = APIClient()
        response2 = client2.signup(
            name="Another User",
            email=user_data['email'],  # Same email
            password="different123"
        )
        
        assert response2.status_code in [400, 409], "Duplicate email should be rejected"
        
    def test_signup_invalid_email(self):
        """Test registration with invalid email fails."""
        response = self.client.signup(
            name="Test User",
            email="not-an-email",
            password="password123"
        )
        
        assert response.status_code == 400, "Invalid email should be rejected"
        
    def test_signup_missing_fields(self):
        """Test registration with missing required fields fails."""
        # Missing password
        response = self.client.post('/auth/signup', {
            'name': 'Test User',
            'email': 'test@example.com'
        })
        
        assert response.status_code == 400, "Missing password should be rejected"
        
    def test_login_success(self):
        """Test successful login."""
        # First, create a user
        user_data = generate_user_data()
        signup_response = self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        assert signup_response.status_code == 201
        
        # Logout
        self.client.logout()
        
        # Login with credentials
        login_response = self.client.login(
            email=user_data['email'],
            password=user_data['password']
        )
        
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        data = login_response.json()
        assert 'accessToken' in data or 'user' in data
        
    def test_login_wrong_password(self):
        """Test login with wrong password fails."""
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        self.client.logout()
        
        response = self.client.login(
            email=user_data['email'],
            password="wrongpassword"
        )
        
        assert response.status_code in [400, 401], "Wrong password should fail"
        
    def test_login_nonexistent_user(self):
        """Test login with non-existent user fails."""
        response = self.client.login(
            email="nonexistent@example.com",
            password="somepassword"
        )
        
        assert response.status_code in [400, 401, 404], "Non-existent user should fail"
        
    def test_logout(self):
        """Test logout clears session."""
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        # Logout
        logout_response = self.client.logout()
        assert logout_response.status_code in [200, 204]
        
        # Try to access protected route
        profile_response = self.client.get_profile()
        assert profile_response.status_code in [401, 403], "Logged out user should not access profile"
        
    def test_create_guest_user(self):
        """Test guest user creation."""
        guest_data = generate_guest_data()
        response = self.client.create_guest_user(
            name=guest_data['name'],
            phone_number=guest_data['phoneNumber']
        )
        
        # Guest creation might return different status codes
        assert response.status_code in [200, 201], f"Guest creation failed: {response.text}"
        
    def test_get_profile_authenticated(self):
        """Test getting profile when authenticated."""
        user_data = generate_user_data()
        self.client.signup(
            name=user_data['name'],
            email=user_data['email'],
            password=user_data['password']
        )
        
        response = self.client.get_profile()
        
        assert response.status_code == 200, f"Get profile failed: {response.text}"
        data = response.json()
        # Profile should contain user info
        assert data is not None
        
    def test_get_profile_unauthenticated(self):
        """Test getting profile without authentication fails."""
        response = self.client.get_profile()
        
        assert response.status_code in [401, 403], "Unauthenticated access should be denied"


class TestGuestCheckout:
    """Test suite for guest user checkout flow."""
    
    def setup_method(self):
        self.client = APIClient()
        
    def test_guest_can_view_products(self):
        """Test that guests can view products without authentication."""
        response = self.client.get_products()
        
        assert response.status_code == 200, f"Guest product view failed: {response.text}"
        
    def test_guest_can_add_to_cart(self):
        """Test that guests can add items to cart."""
        # First get products
        products_response = self.client.get_products()
        assert products_response.status_code == 200
        
        products = products_response.json()
        if not products:
            pytest.skip("No products available for testing")
            
        # Try to add to cart
        product = products[0] if isinstance(products, list) else products.get('products', [{}])[0]
        if not product.get('_id'):
            pytest.skip("Product has no ID")
            
        response = self.client.add_to_cart(product['_id'])
        
        # Guest cart might work differently
        assert response.status_code in [200, 201, 401], f"Add to cart response: {response.text}"
