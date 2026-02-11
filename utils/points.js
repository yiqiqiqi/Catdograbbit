/**
 * 积分系统公共工具方法
 * 按照喵汪兔产品需求规划的等级体系
 */

// 等级配置（统一管理）- 基于累计积分
const LEVEL_CONFIG = [
  {
    min: 0,
    max: 300,
    level: 1,
    name: '新手铲屎官',
    packages: 0, // 对应包数
    privilege: '不可兑换',
    maxExchangePackages: 0 // 最多兑换包数
  },
  {
    min: 300,
    max: 800,
    level: 2,
    name: '稳定使用者',
    packages: 3,
    privilege: '可兑换1包',
    maxExchangePackages: 1
  },
  {
    min: 800,
    max: 2000,
    level: 3,
    name: '长期陪伴官',
    packages: 8,
    privilege: '可兑换1-2包',
    maxExchangePackages: 2
  },
  {
    min: 2000,
    max: 4000,
    level: 4,
    name: '家庭号用户',
    packages: 20,
    privilege: '解锁全部兑换',
    maxExchangePackages: 999
  },
  {
    min: 4000,
    max: Infinity,
    level: 5,
    name: '终身铲屎官',
    packages: 40,
    privilege: '专属兑换门槛',
    maxExchangePackages: 999
  }
];

/**
 * 计算用户等级
 * @param {number} points - 当前积分
 * @returns {number} - 用户等级（1-6）
 */
const calculateLevel = (points) => {
  const config = LEVEL_CONFIG.find(c => points >= c.min && points < c.max);
  return config ? config.level : 1;
};

/**
 * 获取当前等级的配置信息
 * @param {number} points - 当前积分（累计积分）
 * @returns {object} - { level, name, min, max, progress, needPoints, privilege, maxExchangePackages }
 */
const getLevelInfo = (points) => {
  const config = LEVEL_CONFIG.find(c => points >= c.min && points < c.max) || LEVEL_CONFIG[0];
  const { level, name, min, max, privilege, maxExchangePackages, packages } = config;

  // 计算进度百分比
  const progress = max === Infinity
    ? 100
    : Math.min(100, Math.round(((points - min) / (max - min)) * 100));

  // 计算进度步长（10的倍数，用于UI显示）
  const progressStep = Math.round(progress / 10) * 10;

  // 计算升级所需积分
  const needPoints = max === Infinity ? 0 : max - points;

  return {
    level,
    name,
    min,
    max: max === Infinity ? '∞' : max,
    progress,
    progressStep,
    needPoints,
    privilege,
    maxExchangePackages,
    packages
  };
};

/**
 * 格式化积分显示
 * @param {number} points - 积分数
 * @returns {string} - 格式化后的积分（如：1,234）
 */
const formatPoints = (points) => {
  return (points || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 验证积分是否足够
 * @param {number} currentPoints - 当前积分
 * @param {number} requiredPoints - 需要的积分
 * @returns {boolean}
 */
const hasEnoughPoints = (currentPoints, requiredPoints) => {
  return (currentPoints || 0) >= requiredPoints;
};

/**
 * 根据等级获取最大可兑换包数
 * @param {number} level - 用户等级
 * @returns {number} - 最大可兑换包数
 */
const getMaxExchangePackages = (level) => {
  const config = LEVEL_CONFIG.find(c => c.level === level);
  return config ? config.maxExchangePackages : 0;
};

/**
 * 检查是否可以兑换指定包数
 * @param {number} level - 用户等级
 * @param {number} packages - 要兑换的包数
 * @returns {boolean}
 */
const canExchangePackages = (level, packages) => {
  const maxPackages = getMaxExchangePackages(level);
  return packages <= maxPackages;
};

/**
 * 根据等级获取配置信息
 * @param {number} level - 等级
 * @returns {object} - 等级配置
 */
const getLevelByLevel = (level) => {
  return LEVEL_CONFIG.find(c => c.level === level) || LEVEL_CONFIG[0];
};

/**
 * 计算订单积分（按包数）
 * @param {number} packages - 购买包数
 * @param {boolean} isFirstOrder - 是否首单
 * @returns {object} - { basePoints, bonusPoints, totalPoints }
 */
const calculateOrderPoints = (packages, isFirstOrder = false) => {
  const POINTS_PER_PACKAGE = 100; // 1包=100积分
  const FIRST_ORDER_BONUS = 100; // 首单额外+100

  const basePoints = packages * POINTS_PER_PACKAGE;
  const bonusPoints = isFirstOrder ? FIRST_ORDER_BONUS : 0;
  const totalPoints = basePoints + bonusPoints;

  return {
    basePoints,
    bonusPoints,
    totalPoints
  };
};

/**
 * 计算兑换所需积分
 * @param {number} packages - 兑换包数
 * @returns {number} - 所需积分
 */
const calculateExchangePoints = (packages) => {
  const EXCHANGE_RULES = {
    1: 300,   // 1包需要300积分
    2: 550,   // 2包需要550积分
    4: 1000   // 4包需要1000积分
  };

  return EXCHANGE_RULES[packages] || 0;
};

module.exports = {
  LEVEL_CONFIG,
  calculateLevel,
  getLevelInfo,
  getLevelByLevel,
  formatPoints,
  hasEnoughPoints,
  getMaxExchangePackages,
  canExchangePackages,
  calculateOrderPoints,
  calculateExchangePoints
};
