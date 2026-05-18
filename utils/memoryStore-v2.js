const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const FILES = {
  users: 'users.json',
  levels: 'levels.json',
  tasks: 'tasks-v2.json',
  taskGroups: 'taskGroups.json',
  rewards: 'rewards.json',
  records: 'records.json',
  progresses: 'progresses.json'
};

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadFile(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveFile(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

let users = loadFile(FILES.users);
let levels = loadFile(FILES.levels);
let tasks = loadFile(FILES.tasks);
let taskGroups = loadFile(FILES.taskGroups);
let rewards = loadFile(FILES.rewards);
let records = loadFile(FILES.records);
let progresses = loadFile(FILES.progresses);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const store = {
  users: {
    find: (query = {}) => users.filter(u => {
      for (const [key, value] of Object.entries(query)) {
        if (u[key] !== value) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    findOne: (query = {}) => users.find(u => {
      for (const [key, value] of Object.entries(query)) {
        if (u[key] !== value) return false;
      }
      return true;
    }),
    findById: (id) => users.find(u => u._id === id),
    create: (data) => {
      const item = { ...data, _id: generateId(), createdAt: new Date(), updatedAt: new Date() };
      users.push(item);
      saveFile(FILES.users, users);
      return item;
    },
    update: (id, data) => {
      const index = users.findIndex(u => u._id === id);
      if (index === -1) return null;
      users[index] = { ...users[index], ...data, updatedAt: new Date() };
      saveFile(FILES.users, users);
      return users[index];
    },
    delete: (id) => {
      const index = users.findIndex(u => u._id === id);
      if (index === -1) return null;
      const item = users[index];
      users.splice(index, 1);
      saveFile(FILES.users, users);
      return item;
    },
    count: () => users.length
  },
  levels: {
    find: (query = {}) => levels.filter(l => {
      for (const [key, value] of Object.entries(query)) {
        if (l[key] !== value) return false;
      }
      return true;
    }).sort((a, b) => a.level - b.level),
    findOne: (query = {}) => levels.find(l => {
      for (const [key, value] of Object.entries(query)) {
      if (l[key] !== value) return false;
      }
      return true;
    }),
    findById: (id) => levels.find(l => l._id === id),
    create: (data) => {
      const item = { ...data, _id: generateId(), createdAt: new Date(), updatedAt: new Date() };
      levels.push(item);
      saveFile(FILES.levels, levels);
      return item;
    },
    update: (id, data) => {
      const index = levels.findIndex(l => l._id === id);
      if (index === -1) return null;
      levels[index] = { ...levels[index], ...data, updatedAt: new Date() };
      saveFile(FILES.levels, levels);
      return levels[index];
    },
    delete: (id) => {
      const index = levels.findIndex(l => l._id === id);
      if (index === -1) return null;
      const item = levels[index];
      levels.splice(index, 1);
      saveFile(FILES.levels, levels);
      return item;
    },
    count: () => levels.length
  },
  tasks: {
    find: (query = {}) => tasks.filter(t => {
      for (const [key, value] of Object.entries(query)) {
        if (t[key] !== value) return false;
      }
      return true;
    }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    findOne: (query = {}) => tasks.find(t => {
      for (const [key, value] of Object.entries(query)) {
        if (t[key] !== value) return false;
      }
      return true;
    }),
    findById: (id) => tasks.find(t => t._id === id),
    create: (data) => {
      const item = { 
        ...data, 
        isActive: true, 
        _id: generateId(), 
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      tasks.push(item);
      saveFile(FILES.tasks, tasks);
      return item;
    },
    update: (id, data) => {
      const index = tasks.findIndex(t => t._id === id);
      if (index === -1) return null;
      tasks[index] = { ...tasks[index], ...data, updatedAt: new Date() };
      saveFile(FILES.tasks, tasks);
      return tasks[index];
    },
    delete: (id) => {
      const index = tasks.findIndex(t => t._id === id);
      if (index === -1) return null;
      const item = tasks[index];
      tasks.splice(index, 1);
      saveFile(FILES.tasks, tasks);
      return item;
    },
    count: () => tasks.length
  },
  taskGroups: {
    find: (query = {}) => taskGroups.filter(g => {
      for (const [key, value] of Object.entries(query)) {
        if (g[key] !== value) return false;
      }
      return true;
    }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    findOne: (query = {}) => taskGroups.find(g => {
      for (const [key, value] of Object.entries(query)) {
        if (g[key] !== value) return false;
      }
      return true;
    }),
    findById: (id) => taskGroups.find(g => g._id === id),
    create: (data) => {
      const item = { 
        ...data, 
        isActive: true, 
        _id: generateId(), 
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      taskGroups.push(item);
      saveFile(FILES.taskGroups, taskGroups);
      return item;
    },
    update: (id, data) => {
      const index = taskGroups.findIndex(g => g._id === id);
      if (index === -1) return null;
      taskGroups[index] = { ...taskGroups[index], ...data, updatedAt: new Date() };
      saveFile(FILES.taskGroups, taskGroups);
      return taskGroups[index];
    },
    delete: (id) => {
      const index = taskGroups.findIndex(g => g._id === id);
      if (index === -1) return null;
      const item = taskGroups[index];
      taskGroups.splice(index, 1);
      saveFile(FILES.taskGroups, taskGroups);
      return item;
    },
    count: () => taskGroups.length
  },
  rewards: {
    find: (query = {}) => rewards.filter(r => {
      for (const [key, value] of Object.entries(query)) {
        if (r[key] !== value) return false;
      }
      return true;
    }),
    findOne: (query = {}) => rewards.find(r => {
      for (const [key, value] of Object.entries(query)) {
        if (r[key] !== value) return false;
      }
      return true;
    }),
    findById: (id) => rewards.find(r => r._id === id),
    create: (data) => {
      const item = { ...data, _id: generateId(), createdAt: new Date() };
      rewards.push(item);
      saveFile(FILES.rewards, rewards);
      return item;
    },
    update: (id, data) => {
      const index = rewards.findIndex(r => r._id === id);
      if (index === -1) return null;
      rewards[index] = { ...rewards[index], ...data };
      saveFile(FILES.rewards, rewards);
      return rewards[index];
    },
    delete: (id) => {
      const index = rewards.findIndex(r => r._id === id);
      if (index === -1) return null;
      const item = rewards[index];
      rewards.splice(index, 1);
      saveFile(FILES.rewards, rewards);
      return item;
    },
    count: () => rewards.length
  },
  records: {
    find: (query = {}) => records.filter(r => {
      for (const [key, value] of Object.entries(query)) {
        if (r[key] !== value) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    findOne: (query = {}) => records.find(r => {
      for (const [key, value] of Object.entries(query)) {
        if (r[key] !== value) return false;
      }
      return true;
    }),
    findById: (id) => records.find(r => r._id === id),
    create: (data) => {
      const item = { ...data, _id: generateId(), createdAt: new Date() };
      records.push(item);
      saveFile(FILES.records, records);
      return item;
    },
    count: () => records.length
  },
  progresses: {
    find: (query = {}) => progresses.filter(p => {
      for (const [key, value] of Object.entries(query)) {
        if (p[key] !== value) return false;
      }
      return true;
    }),
    findOne: (query = {}) => progresses.find(p => {
      for (const [key, value] of Object.entries(query)) {
        if (p[key] !== value) return false;
      }
      return true;
    }),
    findById: (id) => progresses.find(p => p._id === id),
    create: (data) => {
      const item = { ...data, _id: generateId(), createdAt: new Date(), updatedAt: new Date() };
      progresses.push(item);
      saveFile(FILES.progresses, progresses);
      return item;
    },
    update: (id, data) => {
      const index = progresses.findIndex(p => p._id === id);
      if (index === -1) return null;
      progresses[index] = { ...progresses[index], ...data, updatedAt: new Date() };
      saveFile(FILES.progresses, progresses);
      return progresses[index];
    },
    delete: (id) => {
      const index = progresses.findIndex(p => p._id === id);
      if (index === -1) return null;
      const item = progresses[index];
      progresses.splice(index, 1);
      saveFile(FILES.progresses, progresses);
      return item;
    },
    count: () => progresses.length
  }
};

module.exports = store;