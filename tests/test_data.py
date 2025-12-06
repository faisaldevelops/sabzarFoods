"""
Test Data Generators

Provides utilities for generating test data using Faker.
"""

from faker import Faker
from typing import Dict, List, Optional
import random
import string

fake = Faker('en_IN')  # Use Indian locale for phone numbers and addresses


def generate_user_data() -> Dict:
    """Generate random user registration data."""
    return {
        'name': fake.name(),
        'email': fake.email(),
        'password': ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    }


def generate_guest_data() -> Dict:
    """Generate random guest user data."""
    return {
        'name': fake.name(),
        'phoneNumber': fake.phone_number()[:10].replace(' ', '')
    }


def generate_phone_number() -> str:
    """Generate a random 10-digit phone number."""
    # Generate a valid 10-digit Indian phone number
    return ''.join([str(random.randint(0, 9)) for _ in range(10)])


def generate_address() -> Dict:
    """Generate a random shipping address."""
    return {
        'name': fake.name(),
        'phoneNumber': ''.join(filter(str.isdigit, fake.phone_number()))[:10],
        'email': fake.email(),
        'houseNumber': fake.building_number(),
        'streetAddress': fake.street_address(),
        'landmark': fake.street_name(),
        'city': fake.city(),
        'state': fake.state(),
        'pincode': str(fake.random_int(min=100000, max=999999))
    }


def generate_product_data(
    name: Optional[str] = None,
    price: Optional[float] = None,
    stock_quantity: Optional[int] = None,
    category: Optional[str] = None
) -> Dict:
    """Generate random product data."""
    categories = ['Electronics', 'Clothing', 'Books', 'Food', 'Home', 'Sports']
    
    return {
        'name': name or fake.catch_phrase(),
        'description': fake.paragraph(nb_sentences=3),
        'price': price or round(random.uniform(10, 1000), 2),
        'image': fake.image_url(),
        'category': category or random.choice(categories),
        'stockQuantity': stock_quantity if stock_quantity is not None else random.randint(1, 100),
        'isFeatured': random.choice([True, False])
    }


def generate_cart_items(products: List[Dict], count: int = 1, max_quantity: int = 3) -> List[Dict]:
    """Generate cart items from available products."""
    if not products:
        return []
    
    selected = random.sample(products, min(count, len(products)))
    return [
        {
            '_id': p['_id'],
            'name': p.get('name', 'Product'),
            'price': p.get('price', 100),
            'quantity': random.randint(1, min(max_quantity, p.get('stockQuantity', 1))),
            'image': p.get('image', '')
        }
        for p in selected
    ]


def generate_order_products(products: List[Dict], quantities: Optional[List[int]] = None) -> List[Dict]:
    """
    Generate order products with specific or random quantities.
    
    Args:
        products: List of product objects with _id, name, price, stockQuantity
        quantities: Optional list of quantities (same length as products)
    
    Returns:
        List of order product objects
    """
    order_products = []
    for i, p in enumerate(products):
        qty = quantities[i] if quantities and i < len(quantities) else 1
        order_products.append({
            '_id': p['_id'],
            'id': p['_id'],
            'name': p.get('name', 'Product'),
            'price': p.get('price', 100),
            'quantity': qty,
            'image': p.get('image', '')
        })
    return order_products


class TestDataManager:
    """Manager for generating and tracking test data."""
    
    def __init__(self):
        self.created_users: List[Dict] = []
        self.created_products: List[Dict] = []
        self.created_orders: List[Dict] = []
        
    def add_user(self, user: Dict):
        """Track a created user."""
        self.created_users.append(user)
        
    def add_product(self, product: Dict):
        """Track a created product."""
        self.created_products.append(product)
        
    def add_order(self, order: Dict):
        """Track a created order."""
        self.created_orders.append(order)
        
    def get_random_user(self) -> Optional[Dict]:
        """Get a random tracked user."""
        return random.choice(self.created_users) if self.created_users else None
    
    def get_random_product(self) -> Optional[Dict]:
        """Get a random tracked product."""
        return random.choice(self.created_products) if self.created_products else None
    
    def get_products_with_stock(self, min_stock: int = 1) -> List[Dict]:
        """Get products with at least min_stock quantity."""
        return [p for p in self.created_products if p.get('stockQuantity', 0) >= min_stock]
    
    def clear(self):
        """Clear all tracked data."""
        self.created_users.clear()
        self.created_products.clear()
        self.created_orders.clear()
