// userController.js
const User = require('../../models/schema');

exports.getUserData = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Retrieve and send the user data
    const userData = {
      totalUsage: user.totalUsage,
      outstandingInvoices: user.outstandingInvoices,
      uploadedFiles: user.uploadedFiles,
      usageRecords: user.usageRecords,
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};