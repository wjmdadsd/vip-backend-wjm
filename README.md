# 会员等级与成长值管理系统

一个功能完善的会员等级和成长值后台管理系统，支持多种任务类型、奖励系统和灵活的扩展机制。

## 功能特点

### 会员等级系统
- 5个预设等级：萌新会员、白银会员、黄金会员、铂金会员、钻石会员
- 每个等级有对应的成长值门槛和权益
- 自动升级检测

### 任务系统
- **新手任务**：完成首单打车、评价、支付等
- **每日任务**：每日打车、评价、分享
- **每周任务**：累计完成一定数量的订单/评价
- **每月任务**：累计打车满20单
- **特殊任务**：连续签到、节日活动

### 奖励系统
- 成长值奖励
- 积分奖励
- 优惠券
- 徽章

### 扩展性
- 任务条件引擎支持动态添加新条件类型
- 数据提供器支持从多种来源获取数据
- 插件化架构

## 技术栈

- **后端**：Node.js + Express
- **数据存储**：JSON文件（无需数据库）
- **前端**：原生 HTML/CSS/JavaScript

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务器
```bash
npm start
```

### 3. 访问后台管理
打开浏览器访问：http://localhost:3000

## API 接口

### 移动端接口
- `GET /api/mobile/user/:phone` - 获取用户信息
- `GET /api/mobile/tasks/:userId` - 获取用户任务列表
- `POST /api/mobile/task/complete` - 完成任务
- `GET /api/mobile/growth/records/:userId` - 获取成长值记录

### 管理接口
- `GET /api/users` - 用户列表
- `GET /api/levels` - 等级列表
- `GET /api/tasks` - 任务列表
- `GET /api/tasks/groups` - 任务组列表
- `GET /api/rewards` - 奖励列表

## 项目结构

```
├── server.js                 # 服务器入口
├── public/
│   └── index.html           # 后台管理界面
├── routes/                  # API路由
│   ├── users-memory.js
│   ├── levels-memory.js
│   ├── tasks-v2.js
│   ├── rewards-v2.js
│   └── mobile-v2.js
├── utils/                   # 工具服务
│   ├── memoryStore-v2.js    # 数据存储
│   └── memberService-v2.js  # 核心业务逻辑
├── data/                    # 数据存储目录
└── package.json
```

## 使用说明

### 添加新用户
1. 进入后台管理界面
2. 点击"新增用户"
3. 填写手机号和昵称
4. 设置初始成长值和等级

### 创建任务
1. 进入"任务管理"
2. 点击"新增任务"
3. 配置任务名称、类型、目标
4. 添加奖励配置

### 查看数据
- 数据概览页面显示用户统计和等级分布
- 成长值记录页面查看所有成长值变动

## 扩展开发

### 添加新的奖励类型
在 `utils/memberService-v2.js` 中扩展 RewardSystem 类：

```javascript
rewardSystem.registerRewardType('custom_type', async (userId, config) => {
  // 自定义奖励逻辑
});
```

### 添加新的条件类型
在 `utils/memberService-v2.js` 中扩展 TaskConditionEngine 类：

```javascript
conditionEngine.registerCondition('custom_condition', (actual, expected) => {
  // 自定义条件判断逻辑
});
```

## License

MIT
