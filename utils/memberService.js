const User = require('../models/User');
const MemberLevel = require('../models/MemberLevel');
const GrowthRecord = require('../models/GrowthRecord');
const Task = require('../models/Task');
const UserTaskProgress = require('../models/UserTaskProgress');

async function checkLevelUp(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('用户不存在');

  const levels = await MemberLevel.find().sort({ level: 1 });
  let newLevel = user.memberLevel;

  for (const level of levels) {
    if (user.growthValue >= level.minGrowthValue && level.level > newLevel) {
      newLevel = level.level;
    }
  }

  if (newLevel !== user.memberLevel) {
    user.memberLevel = newLevel;
    user.updatedAt = Date.now();
    await user.save();
    return { levelUp: true, newLevel, oldLevel: user.memberLevel };
  }

  return { levelUp: false, newLevel: user.memberLevel };
}

async function addGrowthValue(userId, amount, taskId = null, description = '') {
  const user = await User.findById(userId);
  if (!user) throw new Error('用户不存在');

  user.growthValue += amount;
  user.updatedAt = Date.now();
  await user.save();

  const record = new GrowthRecord({
    userId,
    changeType: 'earn',
    amount,
    taskId,
    description
  });
  await record.save();

  const levelResult = await checkLevelUp(userId);
  return { user, record, levelResult };
}

async function completeTask(userId, taskId) {
  const task = await Task.findById(taskId);
  if (!task || !task.isActive) throw new Error('任务不存在或已禁用');

  let progress = await UserTaskProgress.findOne({ userId, taskId });
  if (!progress) {
    progress = new UserTaskProgress({
      userId,
      taskId,
      target: 1,
      progress: 0
    });
  }

  if (progress.isCompleted) {
    if (task.type === 'daily' || task.type === 'weekly' || task.type === 'monthly') {
      const now = new Date();
      const lastReset = progress.resetAt || progress.createdAt;
      
      if (task.type === 'daily' && now.getDate() !== lastReset.getDate()) {
        progress.progress = 0;
        progress.isCompleted = false;
        progress.resetAt = now;
      } else if (task.type === 'weekly' && getWeekNumber(now) !== getWeekNumber(lastReset)) {
        progress.progress = 0;
        progress.isCompleted = false;
        progress.resetAt = now;
      } else if (task.type === 'monthly' && now.getMonth() !== lastReset.getMonth()) {
        progress.progress = 0;
        progress.isCompleted = false;
        progress.resetAt = now;
      } else {
        throw new Error('今日任务已完成');
      }
    } else {
      throw new Error('任务已完成');
    }
  }

  progress.progress += 1;
  if (progress.progress >= progress.target) {
    progress.isCompleted = true;
    progress.completedAt = Date.now();
  }
  progress.updatedAt = Date.now();
  await progress.save();

  if (progress.isCompleted) {
    const result = await addGrowthValue(userId, task.growthValue, taskId, `完成任务：${task.name}`);
    return { progress, growthResult: result };
  }

  return { progress, growthResult: null };
}

function getWeekNumber(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date - startOfYear;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

async function initializeSystem() {
  const existingLevels = await MemberLevel.countDocuments();
  if (existingLevels === 0) {
    const levels = [
      { level: 1, name: '萌新会员', minGrowthValue: 0, privileges: ['基础权益'] },
      { level: 2, name: '白银会员', minGrowthValue: 500, privileges: ['基础权益', '专属折扣'] },
      { level: 3, name: '黄金会员', minGrowthValue: 1500, privileges: ['基础权益', '专属折扣', '优先服务'] },
      { level: 4, name: '铂金会员', minGrowthValue: 3000, privileges: ['基础权益', '专属折扣', '优先服务', '生日礼包'] },
      { level: 5, name: '钻石会员', minGrowthValue: 5000, privileges: ['全部权益'] }
    ];
    await MemberLevel.insertMany(levels);
  }

  const existingTasks = await Task.countDocuments();
  if (existingTasks === 0) {
    const tasks = [
      { name: '完成首单打车', type: 'newbie', growthValue: 50, description: '完成首次打车订单' },
      { name: '完成首单评价', type: 'newbie', growthValue: 20, description: '完成首次订单评价' },
      { name: '完成首单支付', type: 'newbie', growthValue: 30, description: '完成首次在线支付' },
      { name: '邀请好友5人', type: 'newbie', growthValue: 100, description: '成功邀请5位好友注册' },
      { name: '完善个人资料', type: 'newbie', growthValue: 10, description: '填写昵称、头像等信息' },
      { name: '每日打车', type: 'daily', growthValue: 10, description: '每天完成一次打车' },
      { name: '每日评价', type: 'daily', growthValue: 5, description: '每天完成一次评价' },
      { name: '分享到朋友圈', type: 'daily', growthValue: 10, description: '分享活动到朋友圈' },
      { name: '累计完成3单评价', type: 'weekly', growthValue: 30, description: '一周内完成3次评价' },
      { name: '累计打车满5单', type: 'weekly', growthValue: 50, description: '一周内完成5次打车' },
      { name: '累计打车满20单', type: 'monthly', growthValue: 150, description: '一月内完成20次打车' },
      { name: '连续签到7天', type: 'special', growthValue: 70, description: '连续签到7天' },
      { name: '节日活动', type: 'special', growthValue: 100, description: '参与节日活动' }
    ];
    await Task.insertMany(tasks);
  }
}

module.exports = {
  checkLevelUp,
  addGrowthValue,
  completeTask,
  initializeSystem
};