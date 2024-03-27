const router =require("express").Router()
const { upload  } = require("../controllers/firebase/upload")
router.post('/upload',upload )
module.exports=router