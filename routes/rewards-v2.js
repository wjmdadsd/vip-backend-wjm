const express = require('express');
const router = express.Router();
const store = require('../utils/memoryStore-v2');

router.get('/', async (req, res) => {
  try {
    const { userId, type, isUsed } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    if (type) query.type = type;
    if (isUsed !== undefined) query.isUsed = isUsed === 'true';
    
    const rewards = store.rewards.find(query);
    res.json({ success: true, data: rewards });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const reward = store.rewards.findById(req.params.id);
    if (!reward) return res.json({ success: false, message: '奖励不存在' });
    res.json({ success: true, data: reward });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.put('/:id/use', async (req, res) => {
  try {
    const reward = store.rewards.update(req.params.id, {
      isUsed: true,
      usedAt: new Date().toISOString()
    });
    if (!reward) return res.json({ success: false, message: '奖励不存在' });
    res.json({ success: true, data: reward });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
