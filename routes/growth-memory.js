const express = require('express');
const router = express.Router();
const store = require('../utils/memoryStore');
const { addGrowthValue, completeTask } = require('../utils/memberService-memory');

router.get('/records', async (req, res) => {
  try {
    const { userId, type } = req.query;
    let query = {};
    if (userId) query.userId = userId;
    if (type) query.changeType = type;
    const records = store.records.find(query);
    const tasks = store.tasks.find();
    const enrichedRecords = records.map(r => ({
      ...r,
      taskId: r.taskId ? tasks.find(t => t._id === r.taskId) : null
    }));
    res.json({ success: true, data: enrichedRecords });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { userId, amount, taskId, description } = req.body;
    const result = await addGrowthValue(userId, amount, taskId, description);
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/complete-task', async (req, res) => {
  try {
    const { userId, taskId } = req.body;
    const result = await completeTask(userId, taskId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;