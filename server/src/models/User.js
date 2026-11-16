const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_.]+$/, 'Username can only contain letters, numbers, underscores and dots'],
      index: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      index: true
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [50, 'Display name cannot exceed 50 characters']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: '',
      maxlength: [200, 'Bio cannot exceed 200 characters']
    },
    qrCode: {
      type: String,
      unique: true,
      sparse: true
    },
    publicKey: {
      type: String,
      default: null,
      comment: 'Client-generated public key for End-to-End Encryption (E2EE)'
    },
    isEmailVerified: {
      type: Boolean,
      default: true // Set to true for initial ease, verification token can still be tested
    },
    verificationToken: {
      type: String,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    // Privacy and presence settings
    isPrivateAccount: {
      type: Boolean,
      default: false
    },
    onlineStatusVisible: {
      type: Boolean,
      default: true
    },
    lastSeenVisible: {
      type: Boolean,
      default: true
    },
    messagePrivacy: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'friends'
    },
    storyPrivacy: {
      type: String,
      enum: ['everyone', 'friends', 'close_friends'],
      default: 'friends'
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    // Private Vault
    vaultPin: {
      type: String,
      select: false
    },
    vaultPinSet: {
      type: Boolean,
      default: false
    },
    closeFriends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    // UI preferences
    themePreference: {
      type: String,
      enum: ['dark', 'light', 'system'],
      default: 'dark'
    },
    accentColor: {
      type: String,
      default: '#8B5CF6'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Compare Vault PIN helper
userSchema.methods.compareVaultPin = async function (enteredPin) {
  if (!this.vaultPin) return false;
  return bcrypt.compare(enteredPin, this.vaultPin);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
