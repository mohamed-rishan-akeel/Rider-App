-- Sample Data for Testing

-- Sample Delivery Partners
-- Password for all test accounts: "password123"
-- Hash generated with bcrypt, salt rounds: 10
INSERT INTO delivery_partners (email, password_hash, full_name, phone, vehicle_type, vehicle_number, status) VALUES
('john.doe@example.com', '$2b$10$rKJ5VqZ8YvZ5YvZ5YvZ5YeO5YvZ5YvZ5YvZ5YvZ5YvZ5YvZ5YvZ5Y', 'John Doe', '+1234567890', 'Motorcycle', 'ABC-1234', 'online'),
('jane.smith@example.com', '$2b$10$rKJ5VqZ8YvZ5YvZ5YvZ5YeO5YvZ5YvZ5YvZ5YvZ5YvZ5YvZ5YvZ5Y', 'Jane Smith', '+1234567891', 'Car', 'XYZ-5678', 'offline'),
('mike.wilson@example.com', '$2b$10$rKJ5VqZ8YvZ5YvZ5YvZ5YeO5YvZ5YvZ5YvZ5YvZ5YvZ5YvZ5YvZ5Y', 'Mike Wilson', '+1234567892', 'Motorcycle', 'DEF-9012', 'online');

-- Sample Delivery Jobs
INSERT INTO delivery_jobs (
    order_number, customer_name, customer_phone,
    pickup_address, pickup_latitude, pickup_longitude, pickup_contact_name, pickup_contact_phone,
    dropoff_address, dropoff_latitude, dropoff_longitude,
    distance_km, payment_amount, items_description, special_instructions, status
) VALUES
(
    'ORD-2024-001', 'Alice Johnson', '+1234567893',
    '123 Main St, Downtown', 40.7128, -74.0060, 'Auto Parts Store', '+1234567894',
    '456 Oak Ave, Uptown', 40.7589, -73.9851,
    8.5, 15.00, 'Brake pads and oil filter', 'Handle with care', 'available'
),
(
    'ORD-2024-002', 'Bob Martinez', '+1234567895',
    '789 Elm St, Midtown', 40.7489, -73.9680, 'Warehouse A', '+1234567896',
    '321 Pine Rd, Suburb', 40.7831, -73.9712,
    12.3, 22.50, 'Engine parts - fragile', 'Call customer on arrival', 'available'
),
(
    'ORD-2024-003', 'Carol Davis', '+1234567897',
    '555 Market St, Business District', 40.7614, -73.9776, 'Parts Depot', '+1234567898',
    '888 River Rd, Riverside', 40.7282, -74.0776,
    6.2, 12.00, 'Windshield wipers and battery', NULL, 'available'
);

-- Note: In production, you would use actual bcrypt hashes
-- The hash above is a placeholder. Run the application to create real users.
