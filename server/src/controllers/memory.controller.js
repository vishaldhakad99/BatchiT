const Memory = require('../models/Memory');
const User = require('../models/User');

// Save a memory
const saveMemory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      mediaUrl,
      mediaType = 'photo',
      title = '',
      tags = [],
      album = 'Snaps',
      isVault = false,
      fileSize = 0
    } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({ success: false, message: 'Media URL is required.' });
    }

    const memory = await Memory.create({
      user: userId,
      mediaUrl,
      mediaType,
      title,
      tags,
      album,
      isVault,
      fileSize
    });

    return res.status(201).json({
      success: true,
      message: isVault ? 'Saved to Private Vault.' : 'Saved to Memories.',
      data: memory
    });
  } catch (error) {
    next(error);
  }
};

// Get general memories (non-vault)
const getMemories = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { album, search } = req.query;

    const query = { user: userId, isVault: false };
    if (album) query.album = album;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const memories = await Memory.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: memories
    });
  } catch (error) {
    next(error);
  }
};

// Get Private Vault memories (requires verified PIN)
const getVaultMemories = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ success: false, message: 'Vault PIN is required.' });
    }

    const user = await User.findById(userId).select('+vaultPin');
    if (!user.vaultPin) {
      return res.status(400).json({ success: false, message: 'Vault PIN has not been configured.' });
    }

    const isMatch = await user.compareVaultPin(pin);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect PIN.' });
    }

    const vaultMemories = await Memory.find({ user: userId, isVault: true }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: vaultMemories
    });
  } catch (error) {
    next(error);
  }
};

// Delete a memory
const deleteMemory = async (req, res, next) => {
  try {
    const { memoryId } = req.params;
    const userId = req.user._id;

    const memory = await Memory.findOne({ _id: memoryId, user: userId });
    if (!memory) {
      return res.status(404).json({ success: false, message: 'Memory not found or unauthorized.' });
    }

    await Memory.findByIdAndDelete(memoryId);

    return res.status(200).json({
      success: true,
      message: 'Memory deleted.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveMemory,
  getMemories,
  getVaultMemories,
  deleteMemory
};
