const { deleteStripeCustomer } = require('../stripe/deleteuser');

exports.deleteusers = async (req, res) => {
    try {
        const userId = req.params.userId;
        await deleteStripeCustomer(userId);
        res.json({ message: 'User deleted successfully' });
      } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user' });
      }

 }