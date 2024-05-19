const User = require('../../models/schema');
const DataUsage = require('../../models/datausageschema');
const multer = require('multer');
const { uploadFile } = require('../../services/storageservice')

const upload = multer({
  storage: multer.memoryStorage(),
});

exports.uploads = upload.single('image'), async (req, res) => {
  const firebaseUid = req.body.userId;
  console.log(" firebase userid", firebaseUid);

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  if (!firebaseUid) {
    return res.status(400).json({ success: false, message: 'User ID is required.' });
  }

  const user = await User.findOne({ firebaseUid: firebaseUid });

  if (!user) {
    console.log(user);
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  try {
    const fileUrl = await uploadFile(req.file.originalname, req.file.buffer, req.file.mimetype);

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: firebaseUid },
      { $push: { uploadedFiles: fileUrl } },
      { new: true }
    );

    // Update the user's data usage
    let dataUsage = await DataUsage.findOne({ userId: user._id });
    if (!dataUsage) {
      dataUsage = new DataUsage({ userId: user._id });
    }

    dataUsage.totalUsage += req.file.size;
    dataUsage.usageRecords.push({ fileSize: req.file.size, timestamp: Date.now(), fileName: req.file.originalname });
    await dataUsage.save();

    user.totalUsage = dataUsage.totalUsage;
    await user.save();

    res.status(200).json({ message: 'File uploaded successfully', fileUrl: fileUrl, fileName: req.file.originalname, userId: user.firebaseUid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload file.' });
  }
};