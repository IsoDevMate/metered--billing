const express = require('express')
const router = express.Router()
const { registerusers } = require("../controllers/firebase/registercontroller")
const { uploads  } = require("../controllers/firebase/uploadcontroller")
const { deleteusers } = require("../controllers/stripe/deleteusercontroller")
const { downloadpaidfile } = require("../controllers/firebase/downloadcontroller")
const { getUserData } = require('../controllers/mongo/usercontroller')

router.post('/users', registerusers)
router.delete('/users/:userId', deleteusers)
router.get('/users/:userId',getUserData)
//router.post('/uploads', uploads)
router.get('/download', downloadpaidfile)

module.exports= router;