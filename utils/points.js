/**
 * 积分系统公共工具方法
 */

// 等级配置（统一管理）
const LEVEL_CONFIG = [
  { min: 0, max: 100, level: 1 },
  { min: 100, max: 300, level: 2 },
  { min: 300, max: 600, level: 3 },
  { min: 600, max: 1000, level: 4 },
  { min: 1000, max: 2000, level: 5 },
  { min: 2000, max: Infinity, level: 6 } // 最高等级（无上限）
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
 * @param {number} points - 当前积分
 * @returns {object} - { level, min, max, progress, needPoints }
 */
const getLevelInfo = (points) => {
  const config = LEVEL_CONFIG.find(c => points >= c.min && points < c.max) || LEVEL_CONFIG[0];
  const { level, min, max } = config;

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
    min,
    max: max === Infinity ? '∞' : max,
    progress,
    progressStep,
    needPoints
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

module.exports = {
  LEVEL_CONFIG,
  calculateLevel,
  getLevelInfo,
  formatPoints,
  hasEnoughPoints
};
