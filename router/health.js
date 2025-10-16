const express = require('express');
const router = express.Router({mergeParams:true});

router.get('/health', async (req, res) => {
  return res.status(200).json({ status: 'ok' });
});


module.exports=router;