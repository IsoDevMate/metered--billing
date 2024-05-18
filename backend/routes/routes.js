const express = require('express')
const router = express.Router()
const { registerusers } = require("../controllers/firebase/registercontroller")
const { uploads  } = require("../controllers/firebase/uploadcontroller")
const { deleteusers } = require("../controllers/stripe/deleteusercontroller")
const { downloadpaidfile } = require("../controllers/firebase/downloadcontroller")

router.post('/users', registerusers)
router.delete('/users/:userId', deleteusers)
router.post('/upload', uploads)
router.get('/download', downloadpaidfile)

module.exports= router;