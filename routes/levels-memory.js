const express = require('express');
const router = express.Router();
const store = require('../utils/memoryStore');

router.get('/', async (req, res) => {
  try {
    const levels = store.levels.find();
    res.json({ success: true, data: levels });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const level = store.levels.findById(req.params.id);
    if (!level) return res.json({ success: false, message: '等级不存在' });
    res.json({ success: true, data: level });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { level, name, minGrowthValue, privileges } = req.body;
    const existing = store.levels.findOne({ level });
    if (existing) return res.json({ success: false, message: '等级编号已存在' });
    
    const memberLevel = store.levels.create({ level, name, minGrowthValue, privileges: privileges || [] });
    res.json({ success: true, data: memberLevel });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const level = store.levels.update(req.params.id, req.body);
    if (!level) return res.json({ success: false, message: '等级不存在' });
    res.json({ success: true, data: level });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const level = store.levels.delete(req.params.id);
    if (!level) return res.json({ success: false, message: '等级不存在' });
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;