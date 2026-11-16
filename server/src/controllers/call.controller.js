const Call = require('../models/Call');
const Notification = require('../models/Notification');

// Initiate call record
const initiateCall = async (req, res, next) => {
  try {
    const callerId = req.user._id;
    const { recipientId, type, isGroupCall = false, groupId = null } = req.body;

    const call = await Call.create({
      caller: callerId,
      recipient: recipientId || null,
      type,
      isGroupCall,
      group: groupId,
      status: 'initiated',
      startedAt: new Date()
    });

    const populatedCall = await Call.findById(call._id)
      .populate('caller', 'username displayName avatar')
      .populate('recipient', 'username displayName avatar');

    return res.status(201).json({
      success: true,
      data: populatedCall
    });
  } catch (error) {
    next(error);
  }
};

// Update call status (accepted, rejected, ended, missed)
const updateCallStatus = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const { status, duration } = req.body;

    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found.' });
    }

    call.status = status;
    if (status === 'ended' || status === 'rejected' || status === 'missed') {
      call.endedAt = new Date();
      if (duration) call.duration = duration;
    }

    await call.save();

    // If missed, send notification to recipient
    if (status === 'missed' && call.recipient) {
      await Notification.create({
        recipient: call.recipient,
        sender: call.caller,
        type: 'missed_call',
        title: 'Missed Call',
        body: `You missed a ${call.type} call from ${req.user.displayName}`,
        link: '/calls'
      });
    }

    return res.status(200).json({
      success: true,
      data: call
    });
  } catch (error) {
    next(error);
  }
};

// Get call logs for current user
const getCallHistory = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const calls = await Call.find({
      $or: [{ caller: currentUserId }, { recipient: currentUserId }]
    })
      .populate('caller', 'username displayName avatar')
      .populate('recipient', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: calls
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateCall,
  updateCallStatus,
  getCallHistory
};
