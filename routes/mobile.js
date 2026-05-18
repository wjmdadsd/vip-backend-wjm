const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MemberLevel = require('../models/MemberLevel');
const Task = require('../models/Task');
const GrowthRecord = require('../models/GrowthRecord');
const UserTaskProgress = require('../models/UserTaskProgress');
const { completeTask, addGrowthValue } = require('../utils/memberService');

router.get('/user/:phone', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) return res.json({ success: false, message: '用户不存在' });
    
    const level = await MemberLevel.findOne({ level: user.memberLevel });
    const nextLevel = await MemberLevel.findOne({ level: user.memberLevel + 1 });
    
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
    let user = await User.findOne({ phone });
    if (user) return res.json({ success: true, data: user });
    
    user = new User({ phone, nickname });
    await user.save();
    res.json({ success: true, data: user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/tasks/:userId', async (req, res) => {
  try {
    const tasks = await Task.find({ isActive: true });
    const progresses = await UserTaskProgress.find({ userId: req.params.userId });
    
    const taskList = tasks.map(task => {
      const progress = progresses.find(p => p.taskId.toString() === task._id.toString());
      return {
        ...task.toObject(),
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
    const records = await GrowthRecord.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('taskId');
    res.json({ success: true, data: records });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/levels', async (req, res) => {
  try {
    const levels = await MemberLevel.find().sort({ level: 1 });
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