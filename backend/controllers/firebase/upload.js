const multer = require('multer');
exports.upload = upload.single('image'), async (req, res) => {
   
        if (!req.file) {
          return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }
      
        const file = req.file;
        const fileExtension = path.extname(file.originalname);
        const fileName = `${Date.now()}${fileExtension}`;
      
        try {
          const fileRef = storage.bucket().file(`uploads/${fileName}`);
          await fileRef.save(file.buffer, { contentType: file.mimetype });
          const imageUrl = await fileRef.getSignedUrl({ action: 'read', expires: '03-09-2491' });
          res.json({ success: true, image_url: imageUrl[0] });
        } catch (error) {
          console.error(error);
          res.status(500).json({ success: false, message: 'Failed to upload file.' });
        }
      }
