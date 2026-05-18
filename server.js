const express = require('express');
const cors = require('cors');
require('dotenv').config();

const usersRouter = require('./routes/users-memory');
const levelsRouter = require('./routes/levels-memory');
const tasksRouter = require('./routes/tasks-v2');
const rewardsRouter = require('./routes/rewards-v2');
const mobileRouter = require('./routes/mobile-v2');
const { initializeSystem } = require('./utils/memberService-v2');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/users', usersRouter);
app.use('/api/levels', levelsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/mobile', mobileRouter);

initializeSystem().then(() => {
  console.log('System initialized');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Initialization error:', err);
});
