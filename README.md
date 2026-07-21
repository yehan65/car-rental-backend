# 🚗 Car Rental Backend API

Backend API for a full-stack car rental application with payment processing, authentication, and booking management.

## 📦 Tech Stack

- **Node.js** + **Express** - Backend framework
- **MongoDB** + **Mongoose** - Database
- **Stripe** - Payment processing
- **JWT** - Authentication
- **Nodemailer** - Email (Ethereal for testing)
- **Render** - Deployment

## ✨ Features

### Authentication
- User signup with email verification
- User login with JWT
- Password reset flow
- Protected routes

### Car Management
- CRUD operations for cars
- Image upload (1-10 images per car)
- Availability status

### Booking System
- Create bookings with date selection
- Check car availability
- Booking status tracking
- Booking history

### Payments
- Stripe checkout integration
- Webhook handling for payment confirmation
- Payment status checking

### Email
- Verification emails
- Password reset emails
- Booking confirmation emails
- Booking reminders

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB
- Stripe account

### Installation

```bash
# Clone the repository
git clone https://github.com/yehan65/car-rental-backend.git
cd car-rental-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your values
# - PORT
# - MONGODB_URI
# - JWT_SECRET
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - CLIENT_URL
# - CLOUDINARY_API_KEY
# - CLOUDINARY_CLOUD_NAME
# - CLOUDINARY_API_SECRET

# Start the server
npm run watch