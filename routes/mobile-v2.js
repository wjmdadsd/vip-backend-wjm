const express = require('express');
const router = express.Router();
const store = require('../utils/memoryStore-v2');
const { completeTask, addGrowthValue, getVisibleTasks } = require('../utils/memberService-v2');

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

    user = store.users.create({ 
      phone, 
      nickname: nickname || '', 
      growthValue: 0, 
      memberLevel: 1 
    });
    res.json({ success: true, data: user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/tasks/:userId', async (req, res) => {
  try {
    const visibleTasks = await getVisibleTasks(req.params.userId);
    const progresses = store.progresses.find({ userId: req.params.userId });
    const groups = store.taskGroups.find();

    const result = groups.map(group => {
      const groupTasks = visibleTasks.filter(t => t.groupId === group._id);
      const tasksWithProgress = groupTasks.map(task => {
        const progress = progresses.find(p => p.taskId === task._id);
        return {
          ...task,
          progress: progress?.progress || 0,
          target: progress?.target || task.target || 1,
          isCompleted: progress?.isCompleted || false
        };
      });
      return {
        ...group,
        tasks: tasksWithProgress
      };
    }).filter(g => g.tasks.length > 0);

    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/task/complete', async (req, res) => {
  try {
    const { userId, taskId, eventData } = req.body;
    const result = await completeTask(userId, taskId, eventData);
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/growth/records/:userId', async (req, res) => {
  try {
    const records = store.records.find({ userId: req.params.userId });
    res.json({ success: true, data: records });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/rewards/:userId', async (req, res) => {
  try {
    const rewards = store.rewards.find({ userId: req.params.userId });
    res.json({ success: true, data: rewards });
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

module.exports = router;
