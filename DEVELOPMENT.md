# 喵汪兔小程序重构开发文档

## 项目概述

本次重构基于《喵汪兔小程序开发需求说明书》，将小程序从宠物照片分享应用重构为私域社群的用户记录与激励中枢。

**核心改动**：
- 底部Tab从2个扩展为4个（品牌、积分、成长、我的）
- 新增订单兑换积分功能（支持淘宝/小红书）
- 重构积分系统和等级体系
- 优化成长记录功能
- 新增积分商城

---

## 已完成功能

### ✅ 1. Tab栏重构

**文件**：`app.json`

**改动**：
- 从2个Tab改为4个Tab
- 新的Tab配置：
  - `pages/brand/brand` - 品牌页面
  - `pages/points/points` - 积分页面
  - `pages/growth/growth` - 成长记录页面
  - `pages/my/my` - 个人中心页面

---

### ✅ 2. 品牌页面 (`pages/brand/`)

**功能点**：
- 顶部品牌海报轮播（swiper）
- 品牌理念横向滑动栏（我们懂、不说教、共成长、高品质）
- 社群活动卡片入口
- 品牌文章列表（可跳转公众号/小红书）

**核心文件**：
- `brand.wxml` - UI布局
- `brand.wxss` - 样式（紫色主题）
- `brand.js` - 业务逻辑
- `brand.json` - 页面配置

**待完善**：
- 后台API对接（品牌数据管理）
- 图片资源替换

---

### ✅ 3. 积分主页面 (`pages/points/`)

**功能点**：
- 积分余额卡片（可用积分、累计积分、本月积分）
- 用户等级展示（Lv1-Lv5）
- 订单兑换积分入口
- 积分商城入口
- 积分获取/使用/等级规则说明

**核心文件**：
- `points.wxml` - UI布局
- `points.wxss` - 样式
- `points.js` - 数据加载、事件监听
- `points.json` - 页面配置

**集成点**：
- 监听全局积分变化事件（`app.on('pointsChange')`）
- 调用`utils/points.js`计算等级

---

### ✅ 4. 订单兑换积分页面 (`pages/order-exchange/`)

**功能点**：
- 平台选择（淘宝/小红书）
- 订单号输入
- 购买包数选择（1包/4包/8包）
- 实时积分计算预览
- 首单检测和奖励（+100积分）
- 提交审核

**积分规则**：
- 1包(2.4kg) = 100积分
- 4包 = 400积分
- 8包 = 800积分
- 首单额外 +100积分

**核心文件**：
- `order-exchange.wxml` - 表单UI
- `order-exchange.wxss` - 样式
- `order-exchange.js` - 表单验证、提交逻辑
- `order-exchange.json` - 页面配置

**API接口**（待后端实现）：
- `GET /orders/check-first-order` - 检查是否首单
- `POST /orders/exchange-points` - 提交兑换请求

---

### ✅ 5. 积分商城页面 (`pages/points-mall/`)

**功能点**：
- 用户等级及积分展示
- 商品网格展示（猫砂1包/2包/4包）
- 等级权限检查（Lv2+可兑换）
- 兑换确认对话框
- 兑换记录查看

**兑换规则**：
- 1包猫砂 = 300积分（Lv2+）
- 2包猫砂 = 550积分（Lv3+）
- 4包猫砂 = 1000积分（Lv4+）

**核心文件**：
- `points-mall.wxml` - 商品列表UI
- `points-mall.wxss` - 样式
- `points-mall.js` - 兑换逻辑、权限控制
- `points-mall.json` - 页面配置

**API接口**（待后端实现）：
- `POST /points/exchange` - 提交兑换请求

---

### ✅ 6. 成长记录页面 (`pages/growth/`)

**功能点**：
- 宠物档案展示（昵称、品种、到家日、生日）
- 宠物选择器
- 成长记录列表（时间线布局）
- 添加成长记录（文本+1-3张图片）
- 编辑/删除记录
- 每日首次记录可获5积分

**核心文件**：
- `growth.wxml` - 档案+记录列表UI
- `growth.wxss` - 时间线样式
- `growth.js` - CRUD操作、图片预览
- `growth.json` - 页面配置（引入pet-picker组件）

**积分规则**：
- 每日首次记录：+5积分
- 连续7天记录：+20积分
- 连续30天记录：+100积分

**API接口**（待后端实现）：
- `GET /growth/records` - 获取成长记录
- `POST /growth/records` - 创建成长记录
- `PUT /growth/records/:id` - 更新记录
- `DELETE /growth/records/:id` - 删除记录

---

### ✅ 7. 个人中心页面 (`pages/my/`)

**功能点**：
- 用户信息卡片（头像、昵称、手机号）
- 三维数据统计（等级、陪伴天数、可用积分）
- 我的宠物列表（可添加）
- 统计面板（上传照片数、成长记录数、已兑换数）
- 功能菜单（兑换记录、积分商城、积分中心、设置）
- 退出登录

**陪伴天数计算**：
从用户注册日期到当前日期的天数

**核心文件**：
- `my.wxml` - 个人信息UI
- `my.wxss` - 梯度背景样式
- `my.js` - 数据加载、导航
- `my.json` - 页面配置

---

### ✅ 8. 积分工具类重构 (`utils/points.js`)

**新增功能**：
- 5级等级体系配置
- 等级名称和兑换权限
- 订单积分计算（按包数）
- 兑换积分计算
- 兑换权限检查

**等级体系**：
| 等级 | 名称 | 累计积分 | 兑换权限 |
|------|------|---------|----------|
| Lv1 | 新手铲屎官 | 0 | 不可兑换 |
| Lv2 | 稳定使用者 | ≥300 | 可兑换1包 |
| Lv3 | 长期陪伴官 | ≥800 | 可兑换1-2包 |
| Lv4 | 家庭号用户 | ≥2000 | 解锁全部兑换 |
| Lv5 | 终身铲屎官 | ≥4000 | 专属兑换门槛 |

**新增方法**：
```javascript
calculateOrderPoints(packages, isFirstOrder)  // 计算订单积分
calculateExchangePoints(packages)             // 计算兑换所需积分
getMaxExchangePackages(level)                 // 获取最大可兑换包数
canExchangePackages(level, packages)          // 检查是否可兑换
getLevelByLevel(level)                        // 根据等级获取配置
```

---

## 技术亮点

### 1. 事件驱动的积分系统
```javascript
// app.js中实现全局事件总线
app.emit('pointsChange', {
  oldPoints,
  newPoints,
  delta,
  reason
})

// 各页面监听积分变化
app.on('pointsChange', this.handlePointsChange.bind(this))
```

### 2. 统一的等级计算
```javascript
const { getLevelInfo } = require('../../utils/points.js')
const levelInfo = getLevelInfo(totalPoints)  // 基于累计积分
```

### 3. 兑换权限控制
```javascript
const { canExchangePackages } = require('../../utils/points.js')
if (!canExchangePackages(userLevel, packages)) {
  wx.showToast({ title: '等级不足', icon: 'none' })
}
```

### 4. 数据持久化
- 使用`wx.setStorageSync`和`wx.getStorageSync`
- 全局数据与本地存储双重保存
- 页面onShow时从服务器刷新最新数据

---

## 待完成事项

### 🔲 1. UI资源准备

**Tab栏图标**（需设计师提供）：
- `/images/tab-brand.png` - 品牌图标（未选中）
- `/images/tab-brand-active.png` - 品牌图标（选中）
- `/images/tab-points.png` - 积分图标（未选中）
- `/images/tab-points-active.png` - 积分图标（选中）
- `/images/tab-growth.png` - 成长图标（未选中）
- `/images/tab-growth-active.png` - 成长图标（选中）
- `/images/tab-my.png` - 我的图标（未选中）
- `/images/tab-my-active.png` - 我的图标（选中）

**品牌页面资源**：
- `/images/brand-banner-1.jpg` - 轮播图1
- `/images/brand-banner-2.jpg` - 轮播图2
- `/images/brand-banner-3.jpg` - 轮播图3
- `/images/activity-cover.jpg` - 活动封面
- `/images/article-*.jpg` - 文章封面
- `/images/wechat-icon.png` - 公众号图标
- `/images/xiaohongshu-icon.png` - 小红书图标

**订单兑换页面资源**：
- `/images/taobao-logo.png` - 淘宝Logo
- `/images/xiaohongshu-logo.png` - 小红书Logo
- `/images/icon-order-exchange.png` - 订单兑换图标
- `/images/icon-points-mall.png` - 积分商城图标

**其他页面资源**：
- `/images/share-brand.jpg` - 品牌分享图
- `/images/share-points.jpg` - 积分分享图

**临时方案**：
可先使用emoji或占位图，确保小程序可运行。

---

### 🔲 2. 后端API开发

#### 订单兑换相关
```javascript
// 检查是否首单
GET /orders/check-first-order
Response: {
  code: 0,
  data: { isFirstOrder: true }
}

// 提交订单兑换
POST /orders/exchange-points
Body: {
  platform: "taobao",
  orderNo: "1234567890",
  packages: 1
}
Response: {
  code: 0,
  data: {
    estimatedPoints: 200,
    status: "pending"  // pending/approved/rejected
  }
}

// 获取兑换记录
GET /orders/exchange-history
Query: { page: 1, size: 10 }
Response: {
  code: 0,
  data: {
    list: [
      {
        id: 1,
        platform: "taobao",
        orderNo: "***7890",
        packages: 1,
        points: 200,
        status: "approved",
        createdAt: "2024-01-01T00:00:00Z"
      }
    ],
    total: 10
  }
}
```

#### 积分商城相关
```javascript
// 积分兑换商品
POST /points/exchange
Body: {
  productId: 1,  // 商品ID
  packages: 1,   // 兑换包数
  points: 300    // 消耗积分
}
Response: {
  code: 0,
  data: {
    orderId: "EX20240101001",
    remainPoints: 50
  }
}

// 获取兑换记录
GET /points/exchange-history
Query: { page: 1, size: 10 }
```

#### 成长记录相关
```javascript
// 创建成长记录
POST /growth/records
Body: {
  petId: 1,
  content: "今天很开心",
  images: ["/uploads/1.jpg", "/uploads/2.jpg"]
}
Response: {
  code: 0,
  data: {
    id: 1,
    pointsEarned: 5,  // 本次获得积分
    continuousDays: 3  // 连续记录天数
  }
}

// 获取成长记录列表
GET /growth/records
Query: { petId: 1, page: 1, size: 10 }

// 更新成长记录
PUT /growth/records/:id
Body: { content: "...", images: [...] }

// 删除成长记录
DELETE /growth/records/:id
```

#### 品牌动态相关
```javascript
// 获取品牌数据
GET /brand/info
Response: {
  code: 0,
  data: {
    banners: [...],
    currentActivity: {...},
    articles: [...]
  }
}
```

#### 积分系统相关
```javascript
// 获取积分摘要
GET /points/summary
Response: {
  code: 0,
  data: {
    availablePoints: 100,
    totalPoints: 500,
    monthlyPoints: 50
  }
}

// 获取积分明细
GET /points/history
Query: { page: 1, size: 20, type: "all|income|expense" }
```

---

### 🔲 3. 功能完善

#### 成长记录积分逻辑
- [ ] 检测每日首次记录
- [ ] 计算连续记录天数
- [ ] 连续7天自动发放20积分
- [ ] 连续30天自动发放100积分
- [ ] 断签后重新计算连续天数

#### 订单兑换风控
- [ ] 单订单号全局唯一校验
- [ ] 单用户月度兑换上限（20包/2000积分）
- [ ] 异常订单号检测和拦截

#### 积分商城权限
- [ ] Lv1用户提示升级才能兑换
- [ ] Lv2只能兑换1包
- [ ] Lv3只能兑换1-2包
- [ ] Lv4+解锁全部

#### 陪伴天数计算
- [ ] 基于用户注册时间
- [ ] 或基于第一只宠物到家日期
- [ ] 个人中心实时展示

---

### 🔲 4. 数据迁移

如需迁移现有数据：
- [ ] 旧积分体系转换为新体系
- [ ] 用户等级重新计算
- [ ] 照片记录转换为成长记录

---

### 🔲 5. 测试清单

#### 功能测试
- [ ] 品牌页面：轮播、活动跳转、文章链接
- [ ] 订单兑换：平台切换、积分计算、提交成功
- [ ] 积分商城：商品展示、权限控制、兑换流程
- [ ] 成长记录：添加记录、图片上传、积分获取
- [ ] 个人中心：数据展示、宠物列表、功能跳转

#### 兼容性测试
- [ ] iOS/Android真机测试
- [ ] 不同屏幕尺寸适配
- [ ] 网络异常处理

#### 性能测试
- [ ] 图片懒加载
- [ ] 列表分页加载
- [ ] 接口请求优化

---

## 项目结构

```
Catdograbbit/
├── app.js                      # 全局应用逻辑（事件总线、积分管理）
├── app.json                    # 小程序配置（4个Tab）
├── app.wxss                    # 全局样式
├── pages/
│   ├── brand/                  # ✅ 品牌页面
│   │   ├── brand.wxml
│   │   ├── brand.wxss
│   │   ├── brand.js
│   │   └── brand.json
│   ├── points/                 # ✅ 积分主页
│   │   ├── points.wxml
│   │   ├── points.wxss
│   │   ├── points.js
│   │   └── points.json
│   ├── growth/                 # ✅ 成长记录页面
│   │   ├── growth.wxml
│   │   ├── growth.wxss
│   │   ├── growth.js
│   │   └── growth.json
│   ├── my/                     # ✅ 个人中心页面
│   │   ├── my.wxml
│   │   ├── my.wxss
│   │   ├── my.js
│   │   └── my.json
│   ├── order-exchange/         # ✅ 订单兑换积分页面
│   │   ├── order-exchange.wxml
│   │   ├── order-exchange.wxss
│   │   ├── order-exchange.js
│   │   └── order-exchange.json
│   ├── points-mall/            # ✅ 积分商城页面
│   │   ├── points-mall.wxml
│   │   ├── points-mall.wxss
│   │   ├── points-mall.js
│   │   └── points-mall.json
│   ├── index/                  # 原首页（保留兼容）
│   ├── profile/                # 原个人中心（保留兼容）
│   ├── pet-edit/               # 宠物编辑页面
│   ├── points-center/          # 积分明细页面
│   ├── daily-task/             # 每日任务页面
│   ├── lucky-draw/             # 抽奖页面
│   └── ...
├── components/
│   ├── photo-card/             # 照片卡片组件
│   ├── pet-picker/             # 宠物选择器组件
│   └── ...
├── utils/
│   ├── points.js               # ✅ 积分工具类（已重构）
│   ├── request.js              # 网络请求封装
│   ├── util.js                 # 通用工具函数
│   └── ...
└── images/                     # 🔲 图片资源（待补充）
```

---

## 开发注意事项

### 1. 积分类型区分
- **可用积分**：可用于兑换的积分
- **累计积分**：历史获得的积分总量（用于计算等级）
- 兑换商品消耗可用积分，但不减少累计积分（等级不降级）

### 2. 首单判断逻辑
- 基于用户维度，全局仅一次
- 首单标识存储在用户表中
- 审核通过后才标记首单已使用

### 3. 积分事件机制
所有积分变化都应通过`app.emit('pointsChange')`触发：
```javascript
app.emit('pointsChange', {
  oldPoints: 100,
  newPoints: 200,
  delta: 100,
  reason: '订单兑换'
})
```

### 4. 等级计算时机
- 用户登录时
- 积分变化后
- 页面onShow时

### 5. 样式规范
- 主色：`#8b5cf6`（紫色）
- 圆角：`12-24rpx`
- 阴影：`0 4rpx 16rpx rgba(0, 0, 0, 0.06)`
- 间距：`20-30rpx`

---

## 后续规划

### 短期（1-2周）
1. 补充UI资源（icon、banner等）
2. 后端API开发和对接
3. 成长记录积分逻辑实现
4. 全流程测试

### 中期（1个月）
1. 会员体系扩展
2. 社群活动功能完善
3. 数据统计和分析
4. 运营后台开发

### 长期
1. 产品共创功能
2. 用户UGC内容沉淀
3. 私域流量转化优化

---

## 联系方式

如有问题，请查看：
- 需求文档：《喵汪兔小程序开发需求说明书.docx》
- 技术文档：本文档（`DEVELOPMENT.md`）
- 代码仓库：https://github.com/yiqiqiqi/Catdograbbit

---

**最后更新**: 2024-01-20
**开发者**: Claude Code
