const store = require('./memoryStore-v2');

/**
 * 任务条件引擎 - 高度可扩展的条件判断系统
 */
class TaskConditionEngine {
  constructor() {
    this.conditions = {
      // 基础条件
      'equals': (actual, expected) => actual === expected,
      'not_equals': (actual, expected) => actual !== expected,
      'greater_than': (actual, expected) => actual > expected,
      'less_than': (actual, expected) => actual < expected,
      'in': (actual, list) => list.includes(actual),
      'not_in': (actual, list) => !list.includes(actual),
      
      // 范围条件
      'between': (actual, { min, max }) => actual >= min && actual <= max,
      
      // 时间条件
      'time_before': (actual, time) => new Date(actual) < new Date(time),
      'time_after': (actual, time) => new Date(actual) > new Date(time),
      'is_today': (actual) => {
        const today = new Date().toDateString();
        return new Date(actual).toDateString() === today;
      },
      
      // 集合条件
      'contains': (actual, expected) => actual?.includes(expected),
      'not_contains': (actual, expected) => !actual?.includes(expected),
      
      // 用户属性条件
      'user_level_gte': (userId, level) => {
        const user = store.users.findById(userId);
        return user?.memberLevel >= level;
      },
      'user_registration_days': (userId, minDays) => {
        const user = store.users.findById(userId);
        if (!user) return false;
        const days = (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
        return days >= minDays;
      }
    };
    
    // 数据获取器
    this.dataProviders = {
      'user': (userId) => store.users.findById(userId),
      'task_progress': (userId, taskId) => store.progresses.findOne({ userId, taskId }),
      'user_tasks': (userId) => store.progresses.find({ userId }),
      'growth_records': (userId) => store.records.find({ userId }),
      'task_group_progress': (userId, groupId) => {
        const group = store.taskGroups.findById(groupId);
        if (!group) return null;
        return group.taskIds.map(taskId => ({
          taskId,
          progress: store.progresses.findOne({ userId, taskId })
        }));
      }
    };
  }

  registerCondition(name, handler) {
    this.conditions[name] = handler;
  }

  registerDataProvider(name, handler) {
    this.dataProviders[name] = handler;
  }

  evaluate(condition, context) {
    if (!condition) return true;
    
    const { type, field, value, provider, args = [] } = condition;
    const handler = this.conditions[type];
    
    if (!handler) {
      console.warn(`Unknown condition type: ${type}`);
      return false;
    }

    let actualValue;
    if (provider) {
      const dataProvider = this.dataProviders[provider];
      if (!dataProvider) {
        console.warn(`Unknown data provider: ${provider}`);
        return false;
      }
      const data = dataProvider(context.userId, ...args);
      actualValue = this.getNestedValue(data, field);
    } else {
      actualValue = this.getNestedValue(context, field);
    }

    return handler(actualValue, value);
  }

  evaluateAll(conditions, context) {
    if (!conditions || conditions.length === 0) return true;
    
    return conditions.every(condition => this.evaluate(condition, context));
  }

  evaluateAny(conditions, context) {
    if (!conditions || conditions.length === 0) return true;
    
    return conditions.some(condition => this.evaluate(condition, context));
  }

  getNestedValue(obj, path) {
    if (!path) return obj;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

/**
 * 奖励系统 - 支持多种奖励类型
 */
class RewardSystem {
  constructor() {
    this.rewardHandlers = {
      'growth_value': async (userId, config) => {
        const result = await addGrowthValue(userId, config.amount, null, config.description || '任务奖励');
        return result;
      },
      'points': async (userId, config) => {
        const user = store.users.findById(userId);
        if (!user) throw new Error('用户不存在');
        const newPoints = (user.points || 0) + config.amount;
        store.users.update(userId, { points: newPoints });
        store.records.create({
          userId,
          changeType: 'points',
          amount: config.amount,
          description: config.description || '积分奖励'
        });
        return { type: 'points', amount: config.amount, total: newPoints };
      },
      'coupon': async (userId, config) => {
        const reward = store.rewards.create({
          userId,
          type: 'coupon',
          couponId: config.couponId,
          name: config.name,
          discount: config.discount,
          expiresAt: config.expiresAt,
          isUsed: false
        });
        return { type: 'coupon', reward };
      },
      'badge': async (userId, config) => {
        const user = store.users.findById(userId);
        if (!user) throw new Error('用户不存在');
        const badges = user.badges || [];
        if (!badges.includes(config.badgeId)) {
          badges.push(config.badgeId);
          store.users.update(userId, { badges });
        }
        return { type: 'badge', badgeId: config.badgeId };
      }
    };
  }

  registerRewardType(type, handler) {
    this.rewardHandlers[type] = handler;
  }

  async distributeRewards(userId, rewards) {
    const results = [];
    for (const reward of rewards) {
      const handler = this.rewardHandlers[reward.type];
      if (handler) {
        const result = await handler(userId, reward.config);
        results.push(result);
      }
    }
    return results;
  }
}

const conditionEngine = new TaskConditionEngine();
const rewardSystem = new RewardSystem();

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
    changeType: 'growth_value',
    amount,
    taskId,
    description
  });

  const levelResult = await checkLevelUp(userId);
  const updatedUser = store.users.findById(userId);
  return { user: updatedUser, record, levelResult };
}

/**
 * 完成任务的核心逻辑
 */
async function completeTask(userId, taskId, eventData = {}) {
  const task = store.tasks.findById(taskId);
  if (!task || !task.isActive) throw new Error('任务不存在或已禁用');

  // 检查任务显示条件
  if (task.showConditions && !conditionEngine.evaluateAll(task.showConditions, { userId, ...eventData })) {
    throw new Error('任务不可见');
  }

  // 检查任务完成条件
  if (task.completeConditions && !conditionEngine.evaluateAll(task.completeConditions, { userId, ...eventData })) {
    throw new Error('任务条件不满足');
  }

  // 获取或创建进度
  let progress = store.progresses.findOne({ userId, taskId });
  if (!progress) {
    progress = store.progresses.create({
      userId,
      taskId,
      target: task.target || 1,
      progress: 0
    });
  }

  // 检查任务是否已完成且不能重复完成
  if (progress.isCompleted && !task.repeatable) {
    throw new Error('任务已完成');
  }

  // 检查任务重置周期
  if (progress.isCompleted && task.resetType) {
    const now = new Date();
    const lastReset = progress.resetAt ? new Date(progress.resetAt) : new Date(progress.createdAt);
    const shouldReset = checkResetCondition(task.resetType, now, lastReset);
    
    if (shouldReset) {
      progress = store.progresses.update(progress._id, {
        progress: 0,
        isCompleted: false,
        resetAt: now.toISOString()
      });
    } else {
      throw new Error('任务冷却中');
    }
  }

  // 更新进度
  const increment = eventData.increment || task.stepIncrement || 1;
  const newProgress = Math.min(progress.progress + increment, progress.target);
  const isCompleted = newProgress >= progress.target;
  
  progress = store.progresses.update(progress._id, {
    progress: newProgress,
    isCompleted,
    completedAt: isCompleted ? new Date().toISOString() : null
  });

  // 如果完成，发放奖励
  let rewardResults = [];
  if (isCompleted && task.rewards && task.rewards.length > 0) {
    rewardResults = await rewardSystem.distributeRewards(userId, task.rewards);
  }

  // 处理任务链/前置任务
  if (isCompleted && task.nextTaskIds && task.nextTaskIds.length > 0) {
    for (const nextTaskId of task.nextTaskIds) {
      const nextTask = store.tasks.findById(nextTaskId);
      if (nextTask && nextTask.autoUnlock) {
        await unlockTask(userId, nextTaskId);
      }
    }
  }

  // 处理任务组完成检查
  if (isCompleted && task.groupId) {
    await checkTaskGroupCompletion(userId, task.groupId);
  }

  return { progress, rewards: rewardResults };
}

function checkResetCondition(resetType, now, lastReset) {
  switch (resetType) {
    case 'daily':
      return now.getDate() !== lastReset.getDate();
    case 'weekly':
      const nowWeek = getWeekNumber(now);
      const lastWeek = getWeekNumber(lastReset);
      return nowWeek !== lastWeek;
    case 'monthly':
      return now.getMonth() !== lastReset.getMonth();
    case 'interval':
      // 支持自定义间隔（小时）
      return (now - lastReset) > (task.resetInterval || 24) * 60 * 60 * 1000;
    default:
      return false;
  }
}

function getWeekNumber(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date - startOfYear;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

async function unlockTask(userId, taskId) {
  const existing = store.progresses.findOne({ userId, taskId });
  if (!existing) {
    const task = store.tasks.findById(taskId);
    store.progresses.create({
      userId,
      taskId,
      target: task?.target || 1,
      progress: 0,
      isUnlocked: true,
      unlockedAt: new Date().toISOString()
    });
  }
}

async function checkTaskGroupCompletion(userId, groupId) {
  const group = store.taskGroups.findById(groupId);
  if (!group || !group.rewards) return;

  const taskProgresses = group.taskIds.map(taskId => 
    store.progresses.findOne({ userId, taskId })
  );

  const allCompleted = taskProgresses.every(p => p?.isCompleted);
  if (allCompleted && group.rewards && group.rewards.length > 0) {
    return await rewardSystem.distributeRewards(userId, group.rewards);
  }
}

/**
 * 获取用户可见的任务列表
 */
async function getVisibleTasks(userId) {
  const allTasks = store.tasks.find({ isActive: true });
  const visibleTasks = [];

  for (const task of allTasks) {
    // 检查前置任务条件
    if (task.prerequisiteTaskIds && task.prerequisiteTaskIds.length > 0) {
      const prerequisitesCompleted = task.prerequisiteTaskIds.every(preTaskId => {
        const preProgress = store.progresses.findOne({ userId, taskId: preTaskId });
        return preProgress?.isCompleted;
      });
      if (!prerequisitesCompleted) continue;
    }

    // 检查显示条件
    if (task.showConditions && !conditionEngine.evaluateAll(task.showConditions, { userId })) {
      continue;
    }

    visibleTasks.push(task);
  }

  return visibleTasks;
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

  const existingTaskGroups = store.taskGroups.count();
  if (existingTaskGroups === 0) {
    const groups = [
      { 
        name: '新手任务', 
        code: 'newbie', 
        sortOrder: 1, 
        taskIds: [],
        rewards: [
          { type: 'badge', config: { badgeId: 'newbie_master', name: '新手达人' } }
        ]
      },
      { 
        name: '每日任务', 
        code: 'daily', 
        sortOrder: 2, 
        taskIds: [] 
      },
      { 
        name: '成长任务', 
        code: 'growth', 
        sortOrder: 3, 
        taskIds: [] 
      }
    ];
    groups.forEach(g => store.taskGroups.create(g));
  }

  const existingTasks = store.tasks.count();
  if (existingTasks === 0) {
    const groupMap = {};
    store.taskGroups.find().forEach(g => groupMap[g.code] = g._id);
    
    const tasks = [
      {
        name: '完善个人资料',
        type: 'newbie',
        groupId: groupMap['newbie'],
        description: '填写昵称、头像等信息',
        icon: 'profile',
        target: 1,
        repeatable: false,
        sortOrder: 1,
        rewards: [
          { type: 'growth_value', config: { amount: 50, description: '完善资料奖励' } }
        ]
      },
      {
        name: '完成首单打车',
        type: 'newbie',
        groupId: groupMap['newbie'],
        description: '完成首次打车订单',
        icon: 'taxi',
        target: 1,
        repeatable: false,
        sortOrder: 2,
        nextTaskIds: [],
        rewards: [
          { type: 'growth_value', config: { amount: 100, description: '首单奖励' } },
          { type: 'coupon', config: { couponId: 'first_ride', name: '首乘优惠券', discount: 10 } }
        ]
      },
      {
        name: '每日打车',
        type: 'daily',
        groupId: groupMap['daily'],
        description: '每天完成一次打车',
        icon: 'daily_taxi',
        target: 1,
        repeatable: true,
        resetType: 'daily',
        sortOrder: 1,
        rewards: [
          { type: 'growth_value', config: { amount: 20, description: '每日任务奖励' } }
        ]
      },
      {
        name: '每日评价',
        type: 'daily',
        groupId: groupMap['daily'],
        description: '每天完成一次评价',
        icon: 'daily_review',
        target: 1,
        repeatable: true,
        resetType: 'daily',
        sortOrder: 2,
        rewards: [
          { type: 'growth_value', config: { amount: 10, description: '评价奖励' } }
        ]
      },
      {
        name: '累计打车10次',
        type: 'growth',
        groupId: groupMap['growth'],
        description: '累计完成10次打车订单',
        icon: 'growth_10',
        target: 10,
        stepIncrement: 1,
        repeatable: false,
        sortOrder: 1,
        rewards: [
          { type: 'growth_value', config: { amount: 200, description: '成长奖励' } },
          { type: 'points', config: { amount: 50, description: '积分奖励' } }
        ]
      }
    ];

    const createdTasks = tasks.map(t => store.tasks.create(t));
    
    const newbieGroup = store.taskGroups.findById(groupMap['newbie']);
    const dailyGroup = store.taskGroups.findById(groupMap['daily']);
    const growthGroup = store.taskGroups.findById(groupMap['growth']);
    
    if (newbieGroup) {
      store.taskGroups.update(newbieGroup._id, {
        taskIds: createdTasks.filter(t => t.type === 'newbie').map(t => t._id)
      });
    }
    if (dailyGroup) {
      store.taskGroups.update(dailyGroup._id, {
        taskIds: createdTasks.filter(t => t.type === 'daily').map(t => t._id)
      });
    }
    if (growthGroup) {
      store.taskGroups.update(growthGroup._id, {
        taskIds: createdTasks.filter(t => t.type === 'growth').map(t => t._id)
      });
    }
  }
}

module.exports = {
  conditionEngine,
  rewardSystem,
  checkLevelUp,
  addGrowthValue,
  completeTask,
  getVisibleTasks,
  unlockTask,
  checkTaskGroupCompletion,
  initializeSystem
};