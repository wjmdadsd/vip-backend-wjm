const store = require('./memoryStore');

async function checkLevelUp(userId) {
  const user = store.users.findById(userId);
  if (!user) throw new Error('用户不存在');

  const levels = store.levels.find();
  let newLevel = user.memberLevel;

  for (const level of levels) {
    if (user.growthValue >= level.minGrowthValue && level.level > newLevel) {
      newLevel = level.level;
    }
  }

  if (newLevel !== user.memberLevel) {
    const oldLevel = user.memberLevel;
    store.users.update(userId, { memberLevel: newLevel });
    return { levelUp: true, newLevel, oldLevel };
  }

  return { levelUp: false, newLevel: user.memberLevel };
}

async function addGrowthValue(userId, amount, taskId = null, description = '') {
  const user = store.users.findById(userId);
  if (!user) throw new Error('用户不存在');

  const newGrowthValue = user.growthValue + amount;
  store.users.update(userId, { growthValue: newGrowthValue });

  const record = store.records.create({
    userId,
    changeType: 'earn',
    amount,
    taskId,
    description
  });

  const levelResult = await checkLevelUp(userId);
  const updatedUser = store.users.findById(userId);
  return { user: updatedUser, record, levelResult };
}

async function completeTask(userId, taskId) {
  const task = store.tasks.findById(taskId);
  if (!task || !task.isActive) throw new Error('任务不存在或已禁用');

  let progress = store.progresses.findOne({ userId, taskId });
  if (!progress) {
    progress = store.progresses.create({
      userId,
      taskId,
      target: 1,
      progress: 0
    });
  }

  if (progress.isCompleted) {
    if (task.type === 'daily' || task.type === 'weekly' || task.type === 'monthly') {
      const now = new Date();
      const lastReset = progress.resetAt ? new Date(progress.resetAt) : new Date(progress.createdAt);
      
      if (task.type === 'daily' && now.getDate() !== lastReset.getDate()) {
        progress = store.progresses.update(progress._id, {
          progress: 0,
          isCompleted: false,
          resetAt: now.toISOString()
        });
      } else if (task.type === 'weekly' && getWeekNumber(now) !== getWeekNumber(lastReset)) {
        progress = store.progresses.update(progress._id, {
          progress: 0,
          isCompleted: false,
          resetAt: now.toISOString()
        });
      } else if (task.type === 'monthly' && now.getMonth() !== lastReset.getMonth()) {
        progress = store.progresses.update(progress._id, {
          progress: 0,
          isCompleted: false,
          resetAt: now.toISOString()
        });
      } else {
        throw new Error('今日任务已完成');
      }
    } else {
      throw new Error('任务已完成');
    }
  }

  const newProgress = progress.progress + 1;
  const isCompleted = newProgress >= progress.target;
  
  progress = store.progresses.update(progress._id, {
    progress: newProgress,
    isCompleted,
    completedAt: isCompleted ? new Date().toISOString() : null
  });

  if (isCompleted) {
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
  const existingLevels = store.levels.count();
  if (existingLevels === 0) {
    const levels = [
      { level: 1, name: '萌新会员', minGrowthValue: 0, privileges: ['基础权益'] },
      { level: 2, name: '白银会员', minGrowthValue: 500, privileges: ['基础权益', '专属折扣'] },
      { level: 3, name: '黄金会员', minGrowthValue: 1500, privileges: ['基础权益', '专属折扣', '优先服务'] },
      { level: 4, name: '铂金会员', minGrowthValue: 3000, privileges: ['基础权益', '专属折扣', '优先服务', '生日礼包'] },
      { level: 5, name: '钻石会员', minGrowthValue: 5000, privileges: ['全部权益'] }
    ];
    levels.forEach(l => store.levels.create(l));
  }

  const existingTasks = store.tasks.count();
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
    tasks.forEach(t => store.tasks.create(t));
  }
}

module.exports = {
  checkLevelUp,
  addGrowthValue,
  completeTask,
  initializeSystem
};