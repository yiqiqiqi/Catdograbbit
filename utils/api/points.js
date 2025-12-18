// utils/api/points.js - 积分相关API封装
const { get, post, put } = require('../request');

/**
 * 兑换码验证
 * @param {string} code - 兑换码
 */
const verifyRedeemCode = (code) => {
  return post('/redeem/verify', { code });
};

/**
 * 获取用户积分
 */
const getUserPoints = () => {
  return get('/user/points');
};

/**
 * 积分抽奖
 */
const drawLottery = () => {
  return post('/lottery/draw', {});
};

/**
 * 获取奖品配置
 */
const getPrizesConfig = () => {
  return get('/lottery/prizes');
};

/**
 * 获取我的奖品列表
 * @param {number} page - 页码
 * @param {number} size - 每页数量
 */
const getMyPrizes = (page = 1, size = 10) => {
  return get('/prizes/my-list', { page, size });
};

/**
 * 使用奖品（生成核销码）
 * @param {number} prizeId - 奖品ID
 */
const usePrize = (prizeId) => {
  return post('/prizes/use', { prizeId });
};

/**
 * 获取兑换记录
 * @param {number} page - 页码
 * @param {number} size - 每页数量
 */
const getRedeemHistory = (page = 1, size = 10) => {
  return get('/redeem/history', { page, size });
};

/**
 * 获取积分明细
 * @param {number} page - 页码
 * @param {number} size - 每页数量
 */
const getPointsHistory = (page = 1, size = 10) => {
  return get('/points/history', { page, size });
};

module.exports = {
  verifyRedeemCode,
  getUserPoints,
  drawLottery,
  getPrizesConfig,
  getMyPrizes,
  usePrize,
  getRedeemHistory,
  getPointsHistory
};
