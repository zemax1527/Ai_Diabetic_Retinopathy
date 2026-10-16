/**
 * One-time Administrative Seed Script for e-Netra AI
 *
 * Usage:
 *   ADMIN_EMAIL="admin@enetra.ai" ADMIN_PASSWORD="AdminSecure@2026" node scripts/seed_admin.js
 *
 * Requirements & Guarantees:
 * 1. Reads ADMIN_EMAIL and ADMIN_PASSWORD from process.env (or .env if defined).
 * 2. Never hardcodes credentials or prints passwords / password hashes in output.
 * 3. Relies on user.model.js pre-save hook for single bcrypt hashing (no double-hashing).
 * 4. Refuses to overwrite or silently promote an existing non-admin user account.
 * 5. Sets role: 'admin', verificationStatus: 'not_required', isActive: true, isProfileComplete: true.
 * 6. Safely closes MongoDB connection upon completion or failure.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const userModel = require('../models/user.model');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME?.trim() || 'System';
  const lastName = process.env.ADMIN_LAST_NAME?.trim() || 'Administrator';

  // 1. Validate required environment variables
  if (!email || !password) {
    console.error('\n[ERROR] Missing required environment variables.');
    console.error('Please specify ADMIN_EMAIL and ADMIN_PASSWORD before running this script.');
    console.error('Example:');
    console.error('  ADMIN_EMAIL="admin@enetra.ai" ADMIN_PASSWORD="Password@123" node scripts/seed_admin.js\n');
    process.exit(1);
  }

  // 2. Validate basic email format
  const normalizedEmail = email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    console.error(`\n[ERROR] Invalid email format: "${normalizedEmail}"\n`);
    process.exit(1);
  }

  // 3. Connect to database
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('\n[ERROR] MONGO_URI is not set in environment or .env file.\n');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 4. Check if account with this email already exists
    const existingUser = await userModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`[INFO] Admin account already exists for ${normalizedEmail}.`);
        console.log(`[INFO] Status: isActive=${existingUser.isActive}, verificationStatus=${existingUser.verificationStatus}`);
        console.log('[INFO] No changes were made.');
        return;
      } else {
        console.error(
          `\n[SECURITY ALERT] Email "${normalizedEmail}" is already registered with role "${existingUser.role}".`
        );
        console.error('This script will not automatically promote or modify existing user accounts.');
        console.error('Please use a dedicated administrative email address.\n');
        process.exit(1);
      }
    }

    // 5. Create new Admin account
    // Note: Do not pre-hash password here — user.model.js pre-save hook handles bcrypt hashing
    const adminUser = await userModel.create({
      fullName: {
        firstName,
        lastName
      },
      email: normalizedEmail,
      password, // user.model pre-save hook executes bcrypt.hash()
      role: 'admin',
      verificationStatus: 'not_required',
      isActive: true,
      isProfileComplete: true
    });

    console.log('\n[SUCCESS] Administrative account created successfully.');
    console.log(`User ID: ${adminUser._id}`);
    console.log(`Email:   ${adminUser.email}`);
    console.log(`Role:    ${adminUser.role}`);
    console.log(`Status:  isActive=${adminUser.isActive}, verificationStatus=${adminUser.verificationStatus}`);
    console.log('You can now log in at the common login portal (/login).\n');

  } catch (err) {
    console.error('\n[ERROR] Failed to seed administrative account:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

seedAdmin();
