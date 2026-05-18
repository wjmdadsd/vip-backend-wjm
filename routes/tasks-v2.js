const express = require('express');
const router = express.Router();
const store = require('../utils/memoryStore-v2');
const { completeTask, getVisibleTasks, conditionEngine, rewardSystem } = require('../utils/memberService-v2');

router.get('/', async (req, res) => {
  try {
    const { type, groupId, isActive } = req.query;
    const query = {};
    if (type) query.type = type;
    if (groupId) query.groupId = groupId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const tasks = store.tasks.find(query);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/groups', async (req, res) => {
  try {
    const groups = store.taskGroups.find();
    const groupsWithTasks = groups.map(group => ({
      ...group,
      tasks: store.tasks.find().filter(t => t.groupId === group._id)
    }));
    res.json({ success: true, data: groupsWithTasks });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/visible/:userId', async (req, res) => {
  try {
    const tasks = await getVisibleTasks(req.params.userId);
    const groups = store.taskGroups.find();
    
    const groupedTasks = groups.map(group => ({
      ...group,
      tasks: tasks.filter(t => t.groupId === group._id)
    })).filter(g => g.tasks.length > 0);
    
    res.json({ success: true, data: groupedTasks });
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
    const task = store.tasks.create(req.body);
    res.json({ success: true, data: task });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/groups', async (req, res) => {
  try {
    const group = store.taskGroups.create(req.body);
    res.json({ success: true, data: group });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/complete', async (req, res) => {
  try {
    const { userId, taskId, eventData } = req.body;
    const result = await completeTask(userId, taskId, eventData);
    res.json({ success: true, data: result });
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

router.put('/groups/:id', async (req, res) => {
  try {
    const group = store.taskGroups.update(req.params.id, req.body);
    if (!group) return res.json({ success: false, message: '任务组不存在' });
    res.json({ success: true, data: group });
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

router.delete('/groups/:id', async (req, res) => {
  try {
    const group = store.taskGroups.delete(req.params.id);
    if (!group) return res.json({ success: false, message: '任务组不存在' });
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/system/condition-types', (req, res) => {
  res.json({
    success: true,
    data: {
      conditions: Object.keys(conditionEngine.conditions),
      dataProviders: Object.keys(conditionEngine.dataProviders)
    }
  });
});

router.get('/system/reward-types', (req, res) => {
  res.json({
    success: true,
    data: Object.keys(rewardSystem.rewardHandlers)
  });
});

module.exports = router;
