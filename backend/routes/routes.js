const express = require('express')
const router = express.Router()
const { registerusers } = require("../controllers/firebase/registercontroller")
const { uploads  } = require("../controllers/firebase/uploadcontroller")
const { deleteusers } = require("../controllers/stripe/deleteusercontroller")
const { downloadpaidfile } = require("../controllers/firebase/downloadcontroller")
router.post('/upload', uploads)
router.delete('/users/:userId', deleteusers)
router.get('/download', downloadpaidfile)
router.post('/users', registerusers)

module.exports= router;