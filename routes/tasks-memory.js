const express = require('express');
const router = express.Router();
const store = require('../utils/memoryStore');

router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = { isActive: true };
    if (type) query.type = type;
    const tasks = store.tasks.find(query);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const task = store.tasks.findById(req.params.id);
    if (!task) return res.json({ success: false, message: '任务不存在' });
    res.json({ success: true, data: task });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, growthValue, description } = req.body;
    const task = store.tasks.create({ name, type, growthValue, description: description || '' });
    res.json({ success: true, data: task });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const task = store.tasks.update(req.params.id, req.body);
    if (!task) return res.json({ success: false, message: '任务不存在' });
    res.json({ success: true, data: task });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = store.tasks.delete(req.params.id);
    if (!task) return res.json({ success: false, message: '任务不存在' });
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;