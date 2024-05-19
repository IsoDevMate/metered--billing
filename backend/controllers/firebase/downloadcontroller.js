const User = require('../../models/schema');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getFileDownloadLink } = require('../../services/storageservice');
const {
    listOutstandingInvoices,
    retrieveUpcomingInvoice,
    createInvoice,
    createCheckoutSession,
  } = require('../../services/stripedownloadsevice');
exports.downloadpaidfile = async (req, res) => {
  try {
    const fileId = req.query.fileId;
    const fileName = req.query.fileName;
    const firebaseUid = req.query.firebaseUid;

    const user = await User.findOne({ firebaseUid: firebaseUid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let outstandingInvoices = await listOutstandingInvoices(user.stripeCustomerId);
    const upcomingInvoice = await retrieveUpcomingInvoice(user.stripeCustomerId);
    console.log("upcomingInvoice", upcomingInvoice);

    if (upcomingInvoice.total > 0) {
      const newInvoice = await createInvoice(user.stripeCustomerId);
      outstandingInvoices.data.push(newInvoice);
    }

    if (outstandingInvoices.data.length > 0) {
      const session = await createCheckoutSession(user.stripeCustomerId, outstandingInvoices);
      res.json({ outstandingInvoices: outstandingInvoices.data, checkoutUrl: session.url });
    } else {
      try {
        const downloadLink = await getFileDownloadLink(fileName);
        res.json({ downloadLink });
        console.log('downloadLink', downloadLink);
      } catch (error) {
        console.error('Error initiating download:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  } catch (error) {
    console.error('Error initiating download:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};