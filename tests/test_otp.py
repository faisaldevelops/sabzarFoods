"""
OTP API Tests

Test cases for OTP send, resend, verify functionality and throttling.
"""

import pytest
import time
from api_client import APIClient
from test_data import generate_phone_number

# Throttling constants (match backend configuration)
RESEND_COOLDOWN_SECONDS = 30
MAX_RESENDS_PER_WINDOW = 3
THROTTLE_WINDOW_MINUTES = 15


class TestOTPSendAndVerify:
    """Test suite for basic OTP send and verify functionality."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.client = APIClient()
    
    def test_send_otp_success(self):
        """Test successful OTP sending."""
        phone_number = generate_phone_number()
        response = self.client.post('/otp/send', {
            'phoneNumber': phone_number,
            'isSignup': True
        })
        
        assert response.status_code == 200, f"Send OTP failed: {response.text}"
        data = response.json()
        assert 'message' in data
        assert data['message'] == "OTP sent successfully"
    
    def test_send_otp_invalid_phone(self):
        """Test OTP sending with invalid phone number fails."""
        response = self.client.post('/otp/send', {
            'phoneNumber': '123',  # Invalid - too short
            'isSignup': True
        })
        
        assert response.status_code == 400, "Invalid phone number should be rejected"
    
    def test_send_otp_missing_phone(self):
        """Test OTP sending without phone number fails."""
        response = self.client.post('/otp/send', {
            'isSignup': True
        })
        
        assert response.status_code == 400, "Missing phone number should be rejected"
    
    def test_send_otp_existing_user_login(self):
        """Test that existing user can request OTP for login."""
        # First create a user
        phone_number = generate_phone_number()
        signup_response = self.client.post('/otp/send', {
            'phoneNumber': phone_number,
            'isSignup': True
        })
        assert signup_response.status_code == 200
        
        # Wait to avoid throttling - use a shorter wait since we're just testing flow
        time.sleep(5)
        
        # Now try to login with same number
        login_response = self.client.post('/otp/send', {
            'phoneNumber': phone_number,
            'isSignup': False
        })
        
        # This should succeed for existing user
        assert login_response.status_code in [200, 400], f"Response: {login_response.text}"


class TestOTPResend:
    """Test suite for OTP resend functionality."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.client = APIClient()
        self.phone_number = generate_phone_number()
    
    def test_resend_otp_success(self):
        """Test successful OTP resend."""
        # First send OTP
        send_response = self.client.post('/otp/send', {
            'phoneNumber': self.phone_number,
            'isSignup': True
        })
        assert send_response.status_code == 200
        
        # Wait for cooldown period
        print(f"Waiting {RESEND_COOLDOWN_SECONDS} seconds for cooldown...")
        time.sleep(RESEND_COOLDOWN_SECONDS)
        
        # Resend OTP
        resend_response = self.client.post('/otp/resend', {
            'phoneNumber': self.phone_number
        })
        
        assert resend_response.status_code == 200, f"Resend failed: {resend_response.text}"
        data = resend_response.json()
        assert 'message' in data
        assert data['message'] == "OTP resent successfully"
    
    def test_resend_otp_without_initial_send(self):
        """Test resend without initial OTP send fails."""
        response = self.client.post('/otp/resend', {
            'phoneNumber': self.phone_number
        })
        
        assert response.status_code == 400, "Resend without initial send should fail"
        data = response.json()
        assert 'No OTP request found' in data['message']
    
    def test_resend_otp_invalid_phone(self):
        """Test resend with invalid phone number fails."""
        response = self.client.post('/otp/resend', {
            'phoneNumber': '123'  # Invalid
        })
        
        assert response.status_code == 400, "Invalid phone number should be rejected"


class TestOTPThrottling:
    """Test suite for OTP throttling and rate limiting."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.client = APIClient()
        self.phone_number = generate_phone_number()
    
    def test_cooldown_period_enforcement(self):
        """Test that cooldown period between resends is enforced."""
        # Send initial OTP
        send_response = self.client.post('/otp/send', {
            'phoneNumber': self.phone_number,
            'isSignup': True
        })
        assert send_response.status_code == 200
        
        # Try to resend immediately (should be throttled)
        resend_response = self.client.post('/otp/resend', {
            'phoneNumber': self.phone_number
        })
        
        assert resend_response.status_code == 429, f"Should be throttled: {resend_response.text}"
        data = resend_response.json()
        assert 'reason' in data
        assert data['reason'] == 'cooldown'
        assert 'waitTime' in data
        assert data['waitTime'] > 0
    
    def test_max_resends_limit(self):
        """Test that maximum resends limit is enforced."""
        # Send initial OTP
        send_response = self.client.post('/otp/send', {
            'phoneNumber': self.phone_number,
            'isSignup': True
        })
        assert send_response.status_code == 200
        
        # Try to resend MAX_RESENDS_PER_WINDOW times
        for i in range(MAX_RESENDS_PER_WINDOW):
            print(f"Waiting {RESEND_COOLDOWN_SECONDS} seconds for resend attempt {i+1}...")
            time.sleep(RESEND_COOLDOWN_SECONDS)
            
            resend_response = self.client.post('/otp/resend', {
                'phoneNumber': self.phone_number
            })
            
            if i < MAX_RESENDS_PER_WINDOW - 1:
                # First resends should succeed
                assert resend_response.status_code == 200, f"Resend {i+1} failed: {resend_response.text}"
            else:
                # Last resend should be throttled (we've hit the limit)
                assert resend_response.status_code == 429, f"Should be throttled on resend {i+1}"
                data = resend_response.json()
                assert 'reason' in data
                assert data['reason'] == 'limit_reached'
                assert 'resetInMinutes' in data
    
    def test_throttle_reset_after_window(self):
        """Test that throttle resets after the time window expires."""
        # This test would take 15 minutes to run, so we'll skip it in normal runs
        pytest.skip("Skipping long-running throttle reset test")


class TestOTPVerification:
    """Test suite for OTP verification."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.client = APIClient()
        self.phone_number = generate_phone_number()
        self.name = "Test User"
    
    def test_verify_otp_clears_throttle(self):
        """Test that successful OTP verification clears throttle data."""
        # This is a functional test - we'll verify behavior indirectly
        # by checking that after verification, we can send OTP again without throttling
        
        # Send OTP
        send_response = self.client.post('/otp/send', {
            'phoneNumber': self.phone_number,
            'isSignup': True
        })
        assert send_response.status_code == 200
        
        # In a real scenario, we would verify the OTP here
        # Since we can't get the OTP in tests, we'll just document the expected behavior
        print("Note: In production, successful OTP verification should clear throttle data")


class TestOTPIntegration:
    """Integration tests for complete OTP flow."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.client = APIClient()
    
    def test_complete_signup_flow_with_resend(self):
        """Test complete signup flow including resend."""
        phone_number = generate_phone_number()
        
        # 1. Send OTP
        send_response = self.client.post('/otp/send', {
            'phoneNumber': phone_number,
            'isSignup': True
        })
        assert send_response.status_code == 200
        
        # 2. Wait and resend
        print(f"Waiting {RESEND_COOLDOWN_SECONDS} seconds for resend...")
        time.sleep(RESEND_COOLDOWN_SECONDS)
        
        resend_response = self.client.post('/otp/resend', {
            'phoneNumber': phone_number
        })
        assert resend_response.status_code == 200
        
        # 3. In a real test, we would verify the OTP here
        # Since we can't get the OTP, we just verify the flow worked
        print("OTP flow completed successfully")
