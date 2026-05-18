const express = require('express');
const router = express.Router();
const MemberLevel = require('../models/MemberLevel');

router.get('/', async (req, res) => {
  try {
    const levels = await MemberLevel.find().sort({ level: 1 });
    res.json({ success: true, data: levels });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const level = await MemberLevel.findById(req.params.id);
    if (!level) return res.json({ success: false, message: '等级不存在' });
    res.json({ success: true, data: level });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { level, name, minGrowthValue, privileges } = req.body;
    const memberLevel = new MemberLevel({ level, name, minGrowthValue, privileges });
    await memberLevel.save();
    res.json({ success: true, data: memberLevel });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const level = await MemberLevel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!level) return res.json({ success: false, message: '等级不存在' });
    res.json({ success: true, data: level });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const level = await MemberLevel.findByIdAndDelete(req.params.id);
    if (!level) return res.json({ success: false, message: '等级不存在' });
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;