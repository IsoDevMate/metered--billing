const admin = require('firebase-admin');

async function uploadFile(fileName, fileBuffer, contentType) {
  try {
    const fileRef = admin.storage().bucket().file(`uploads/${fileName}`);
    await fileRef.save(fileBuffer, { contentType });
    const fileUrl = await fileRef.getSignedUrl({ action: 'read', expires: '03-09-2491' });
    return fileUrl[0];
  } catch (error) {
    throw new Error('Failed to upload file');
  }
}

async function getFileDownloadLink(fileName) {
  try {
    const fileRef = admin.storage().bucket().file(`uploads/${fileName}`);
    const downloadLink = await fileRef.getSignedUrl({ action: 'read', expires: '03-09-2491' });
    return downloadLink[0];
  } catch (error) {
    throw new Error('Failed to retrieve download link');
  }
}

module.exports = {
  uploadFile,
  getFileDownloadLink,
};