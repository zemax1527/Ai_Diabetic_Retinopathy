const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userModel = require('../models/user.model');
const generateLoginId = require('../utils/generateLoginId');
const PatientProfile = require('../models/patientProfile.model');
const DoctorProfile = require('../models/doctorProfile.model');
const HealthcareWorkerProfile = require('../models/healthCare.model');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value?.toLowerCase();

        const firstName =
          profile.name?.givenName ||
          profile.displayName?.split(' ')[0] ||
          'User';

        const lastName =
          profile.name?.familyName || '';

        if (!email) {
          return done(null, false);
        }

        // 1. Find user using Google ID
        let user = await userModel.findOne({ googleId });

        if (user) {
          return done(null, user);
        }

        // 2. Check whether email already exists
        user = await userModel.findOne({ email });

        if (user) {
          // Link Google account to existing user
          user.googleId = googleId;
          await user.save();
          return done(null, user);
        }

        // 3. Create new Google user — no loginId yet; role & profile chosen during completion flow
        user = await userModel.create({
          fullName: {
            firstName,
            lastName
          },
          googleId,
          email,
          role: 'patient',           // placeholder only — updated in completeProfile
          verificationStatus: 'not_required',
          isActive: false,           // inactive until profile completion
          isProfileComplete: false
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;