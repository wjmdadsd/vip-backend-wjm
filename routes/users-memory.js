const express = require('express');
const router = express.Router();
const store = require('../utils/memoryStore');

router.get('/', async (req, res) => {
  try {
    const users = store.users.find().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: users });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = store.users.findById(req.params.id);
    if (!user) return res.json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { phone, nickname, avatar, growthValue, memberLevel } = req.body;
    const existing = store.users.findOne({ phone });
    if (existing) return res.json({ success: false, message: '手机号已存在' });
    
    const user = store.users.create({ 
      phone, 
      nickname: nickname || '', 
      avatar: avatar || '',
      growthValue: growthValue || 0,
      memberLevel: memberLevel || 1
    });
    res.json({ success: true, data: user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const user = store.users.update(req.params.id, req.body);
    if (!user) return res.json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = store.users.delete(req.params.id);
    if (!user) return res.json({ success: false, message: '用户不存在' });
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;