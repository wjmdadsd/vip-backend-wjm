const express = require('express');
const router = express.Router();
const store = require('../utils/memoryStore');
const { completeTask, addGrowthValue } = require('../utils/memberService-memory');

router.get('/user/:phone', async (req, res) => {
  try {
    const user = store.users.findOne({ phone: req.params.phone });
    if (!user) return res.json({ success: false, message: '用户不存在' });
    
    const level = store.levels.findOne({ level: user.memberLevel });
    const nextLevel = store.levels.findOne({ level: user.memberLevel + 1 });
    
    res.json({
      success: true,
      data: {
        user,
        currentLevel: level,
        nextLevel,
        progress: nextLevel ? ((user.growthValue - level.minGrowthValue) / (nextLevel.minGrowthValue - level.minGrowthValue)) * 100 : 100
      }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/user/create', async (req, res) => {
  try {
    const { phone, nickname } = req.body;
    let user = store.users.findOne({ phone });
    if (user) return res.json({ success: true, data: user });
    
    user = store.users.create({ phone, nickname: nickname || '' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/tasks/:userId', async (req, res) => {
  try {
    const tasks = store.tasks.find({ isActive: true });
    const progresses = store.progresses.find({ userId: req.params.userId });
    
    const taskList = tasks.map(task => {
      const progress = progresses.find(p => p.taskId === task._id);
      return {
        ...task,
        progress: progress ? progress.progress : 0,
        target: progress ? progress.target : 1,
        isCompleted: progress ? progress.isCompleted : false
      };
    });
    
    const groupedTasks = {
      newbie: taskList.filter(t => t.type === 'newbie'),
      daily: taskList.filter(t => t.type === 'daily'),
      weekly: taskList.filter(t => t.type === 'weekly'),
      monthly: taskList.filter(t => t.type === 'monthly'),
      special: taskList.filter(t => t.type === 'special')
    };
    
    res.json({ success: true, data: groupedTasks });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/task/complete', async (req, res) => {
  try {
    const { userId, taskId } = req.body;
    const result = await completeTask(userId, taskId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/growth/records/:userId', async (req, res) => {
  try {
    const records = store.records.find({ userId: req.params.userId });
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

router.get('/levels', async (req, res) => {
  try {
    const levels = store.levels.find();
    res.json({ success: true, data: levels });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/growth/manual', async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    const result = await addGrowthValue(userId, amount, null, description);
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;