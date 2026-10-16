const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema(
  {
    fullName: {
      firstName: {
        type: String,
        trim: true,
        required: [true, 'First name is required']
      },

      lastName: {
        type: String,
        trim: true,
        default: ''
      }
    },

    googleId: {
  type: String,
  unique: true,
  sparse: true
},

    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true
    },

    loginId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      sparse: true
    },

password: {
  type: String,
  required: function () {
    return !this.googleId
  },
  select: false,

  minlength: [8, 'Password must be at least 8 characters long'],

  validate: {
    validator: function (password) {
      if (!password) return true

      const hasLowercase = /[a-z]/.test(password)
      const hasUppercase = /[A-Z]/.test(password)
      const hasNumber = /\d/.test(password)
      const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password)

      return (
        hasLowercase &&
        hasUppercase &&
        hasNumber &&
        hasSpecialCharacter
      )
    },

    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  }
},

    role: {
      type: String,
      enum: ['patient', 'healthcare_worker', 'doctor', 'admin'],
      default: 'patient'
    },

    verificationStatus: {
      type: String,
      enum: ['not_required', 'pending', 'approved', 'rejected'],
      default: 'not_required'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isProfileComplete: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)


// ============================================
// HASH PASSWORD BEFORE SAVING
// ============================================

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return
  }

  this.password = await bcrypt.hash(this.password, 10)
})


// ============================================
// GENERATE JWT
// ============================================

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.JWT_KEY,
    {
      expiresIn: '7d'
    }
  )
}


// ============================================
// COMPARE PASSWORD
// ============================================

userSchema.methods.comparePassword = async function (password) {
  if (!this.password) {
    return false
  }

  return bcrypt.compare(password, this.password)
}


const userModel = mongoose.model('User', userSchema)

module.exports = userModel