/**
 * 数据流转测试工具
 * 用于验证各页面间数据传递的一致性
 */

class DataFlowTest {
  
  /**
   * 测试订单数据的完整流转
   * @param {string} orderId - 测试订单ID
   */
  static async testOrderDataFlow(orderId = 'TEST_ORDER_001') {
    console.log('🔍 开始测试订单数据流转...');
    
    const DataManager = require('./data-manager.js');
    const testResults = {
      success: true,
      errors: [],
      details: {}
    };

    try {
      // 1. 模拟订单列表页面缓存数据
      console.log('📝 步骤1: 模拟订单列表缓存数据');
      const mockOrderData = this.createMockOrderData(orderId);
      DataManager.cacheOrderData(orderId, mockOrderData);
      testResults.details.step1 = '✅ 订单数据已缓存';

      // 2. 测试续租页面数据获取
      console.log('📝 步骤2: 测试续租页面数据获取');
      const renewalPageData = DataManager.getCachedOrderData(orderId);
      if (renewalPageData && renewalPageData.orderId === orderId) {
        testResults.details.step2 = '✅ 续租页面成功获取缓存数据';
      } else {
        testResults.errors.push('续租页面获取缓存数据失败');
        testResults.success = false;
      }

      // 3. 模拟支付成功后的数据更新
      console.log('📝 步骤3: 模拟支付成功数据更新');
      const paymentSuccessData = this.createPaymentSuccessData(mockOrderData);
      DataManager.setGlobalOrderData(paymentSuccessData);
      testResults.details.step3 = '✅ 支付成功数据已设置到全局';

      // 4. 测试续租成功页面数据获取
      console.log('📝 步骤4: 测试续租成功页面数据获取');
      const successPageData = DataManager.getGlobalOrderData();
      if (successPageData && successPageData.orderId === orderId) {
        testResults.details.step4 = '✅ 续租成功页面成功获取全局数据';
      } else {
        testResults.errors.push('续租成功页面获取全局数据失败');
        testResults.success = false;
      }

      // 5. 测试数据一致性
      console.log('📝 步骤5: 验证数据一致性');
      const consistencyCheck = this.checkDataConsistency(mockOrderData, successPageData);
      if (consistencyCheck.success) {
        testResults.details.step5 = '✅ 数据一致性验证通过';
      } else {
        testResults.errors.push(`数据一致性验证失败: ${consistencyCheck.errors.join(', ')}`);
        testResults.success = false;
      }

      // 6. 测试缓存清理
      console.log('📝 步骤6: 测试缓存清理');
      DataManager.clearOrderCache(orderId);
      DataManager.clearGlobalOrderData();
      const clearedCache = DataManager.getCachedOrderData(orderId);
      const clearedGlobal = DataManager.getGlobalOrderData();
      
      if (!clearedCache && !clearedGlobal) {
        testResults.details.step6 = '✅ 缓存清理成功';
      } else {
        testResults.errors.push('缓存清理失败');
        testResults.success = false;
      }

      // 7. 输出测试结果
      this.outputTestResults(testResults);
      
      return testResults;

    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
      testResults.success = false;
      testResults.errors.push(`测试异常: ${error.message}`);
      return testResults;
    }
  }

  /**
   * 创建模拟订单数据
   */
  static createMockOrderData(orderId) {
    return {
      orderId: orderId,
      storeName: '重庆渝北区分店',
      managerName: '张经理',
      managerPhone: '138****8888',
      carModel: '现代挖掘机R225LC-9T',
      originalStartTime: 1726488000000, // 2024-09-16 21:00
      originalEndTime: 1726660800000,   // 2024-09-18 21:00
      originalDays: 2,
      renewPrice: 800,
      memberRenewPrice: 640,
      status: 1,
      price: 1600,
      carImage: '../../assets/rsg.png'
    };
  }

  /**
   * 创建支付成功数据
   */
  static createPaymentSuccessData(orderData) {
    const renewDays = 3;
    const purchaseMembership = true;
    const renewAmount = renewDays * orderData.memberRenewPrice; // 会员价
    const membershipAmount = 299;
    const serviceFee = (renewAmount + membershipAmount) * 0.006;
    const totalAmount = renewAmount + membershipAmount + serviceFee;

    return {
      orderId: orderData.orderId,
      renewDays: renewDays,
      totalAmount: totalAmount.toFixed(2),
      newEndTime: '09月21日 21:00',
      purchaseMembership: purchaseMembership,
      paymentDetails: {
        renewAmount: renewAmount.toFixed(2),
        membershipAmount: membershipAmount.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        payTime: Date.now()
      },
      orderInfo: {
        orderId: orderData.orderId,
        carModel: orderData.carModel,
        managerName: orderData.managerName,
        managerPhone: orderData.managerPhone,
        storeName: orderData.storeName,
        originalStartTime: orderData.originalStartTime,
        originalEndTime: orderData.originalEndTime,
        originalDays: orderData.originalDays
      }
    };
  }

  /**
   * 检查数据一致性
   */
  static checkDataConsistency(originalData, processedData) {
    const errors = [];
    
    // 检查订单ID一致性
    if (originalData.orderId !== processedData.orderId) {
      errors.push('订单ID不一致');
    }
    
    // 检查订单基本信息一致性
    if (originalData.carModel !== processedData.orderInfo?.carModel) {
      errors.push('车型信息不一致');
    }
    
    if (originalData.managerName !== processedData.orderInfo?.managerName) {
      errors.push('管理员姓名不一致');
    }
    
    if (originalData.managerPhone !== processedData.orderInfo?.managerPhone) {
      errors.push('管理员电话不一致');
    }
    
    if (originalData.storeName !== processedData.orderInfo?.storeName) {
      errors.push('门店名称不一致');
    }
    
    // 检查时间信息一致性
    if (originalData.originalStartTime !== processedData.orderInfo?.originalStartTime) {
      errors.push('原始开始时间不一致');
    }
    
    if (originalData.originalEndTime !== processedData.orderInfo?.originalEndTime) {
      errors.push('原始结束时间不一致');
    }
    
    if (originalData.originalDays !== processedData.orderInfo?.originalDays) {
      errors.push('原始租期天数不一致');
    }
    
    // 检查支付数据完整性
    if (!processedData.paymentDetails) {
      errors.push('缺少支付详情数据');
    } else {
      if (!processedData.paymentDetails.renewAmount) {
        errors.push('缺少续租金额');
      }
      if (!processedData.paymentDetails.totalAmount) {
        errors.push('缺少总金额');
      }
      if (!processedData.paymentDetails.payTime) {
        errors.push('缺少支付时间');
      }
    }
    
    return {
      success: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 输出测试结果
   */
  static outputTestResults(testResults) {
    console.log('\n🎯 数据流转测试结果:');
    console.log('='.repeat(50));
    
    if (testResults.success) {
      console.log('✅ 测试通过！数据流转正常');
    } else {
      console.log('❌ 测试失败！发现以下问题:');
      testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n📋 详细步骤结果:');
    Object.entries(testResults.details).forEach(([step, result]) => {
      console.log(`   ${step}: ${result}`);
    });
    
    console.log('='.repeat(50));
  }

  /**
   * 性能测试 - 测试缓存性能
   */
  static async performanceTest() {
    console.log('⚡ 开始性能测试...');
    
    const DataManager = require('./data-manager.js');
    const testOrderIds = [];
    const testCount = 100;
    
    // 生成测试数据
    for (let i = 0; i < testCount; i++) {
      const orderId = `PERF_TEST_${i}`;
      testOrderIds.push(orderId);
      const mockData = this.createMockOrderData(orderId);
      DataManager.cacheOrderData(orderId, mockData);
    }
    
    // 测试缓存读取性能
    const startTime = Date.now();
    
    for (let i = 0; i < testCount; i++) {
      const data = DataManager.getCachedOrderData(testOrderIds[i]);
      if (!data) {
        console.warn(`⚠️ 缓存数据丢失: ${testOrderIds[i]}`);
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`📊 性能测试结果:`);
    console.log(`   - 测试数据量: ${testCount} 条`);
    console.log(`   - 总耗时: ${duration}ms`);
    console.log(`   - 平均耗时: ${(duration / testCount).toFixed(2)}ms/条`);
    console.log(`   - 吞吐量: ${(testCount / duration * 1000).toFixed(0)} 条/秒`);
    
    // 清理测试数据
    testOrderIds.forEach(orderId => {
      DataManager.clearOrderCache(orderId);
    });
    
    console.log('✅ 性能测试完成，测试数据已清理');
    
    return {
      testCount,
      duration,
      averageTime: duration / testCount,
      throughput: testCount / duration * 1000
    };
  }

  /**
   * 并发测试 - 测试多个页面同时访问数据的情况
   */
  static async concurrencyTest() {
    console.log('🔄 开始并发测试...');
    
    const DataManager = require('./data-manager.js');
    const orderId = 'CONCURRENCY_TEST_ORDER';
    const mockData = this.createMockOrderData(orderId);
    
    // 模拟多个页面同时操作
    const promises = [];
    
    // 模拟订单列表页面缓存数据
    promises.push(
      new Promise(resolve => {
        setTimeout(() => {
          DataManager.cacheOrderData(orderId, mockData);
          resolve('订单列表页面缓存完成');
        }, Math.random() * 100);
      })
    );
    
    // 模拟续租页面读取数据
    promises.push(
      new Promise(resolve => {
        setTimeout(() => {
          const data = DataManager.getCachedOrderData(orderId);
          resolve(data ? '续租页面读取成功' : '续租页面读取失败');
        }, Math.random() * 150);
      })
    );
    
    // 模拟支付成功设置全局数据
    promises.push(
      new Promise(resolve => {
        setTimeout(() => {
          const successData = this.createPaymentSuccessData(mockData);
          DataManager.setGlobalOrderData(successData);
          resolve('支付成功数据设置完成');
        }, Math.random() * 200);
      })
    );
    
    // 模拟成功页面读取全局数据
    promises.push(
      new Promise(resolve => {
        setTimeout(() => {
          const globalData = DataManager.getGlobalOrderData();
          resolve(globalData ? '成功页面读取全局数据成功' : '成功页面读取全局数据失败');
        }, Math.random() * 120);
      })
    );
    
    try {
      const results = await Promise.all(promises);
      
      console.log('📋 并发测试结果:');
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result}`);
      });
      
      // 验证最终数据状态
      const finalCacheData = DataManager.getCachedOrderData(orderId);
      const finalGlobalData = DataManager.getGlobalOrderData();
      
      console.log('🔍 最终数据状态验证:');
      console.log(`   - 缓存数据: ${finalCacheData ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`   - 全局数据: ${finalGlobalData ? '✅ 存在' : '❌ 不存在'}`);
      
      // 清理测试数据
      DataManager.clearOrderCache(orderId);
      DataManager.clearGlobalOrderData();
      
      console.log('✅ 并发测试完成');
      
      return {
        success: finalCacheData && finalGlobalData,
        results: results
      };
      
    } catch (error) {
      console.error('❌ 并发测试失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 内存泄漏测试
   */
  static memoryLeakTest() {
    console.log('🧹 开始内存泄漏测试...');
    
    const DataManager = require('./data-manager.js');
    
    // 获取初始缓存状态
    const initialStats = DataManager.getCacheStats();
    console.log(`📊 初始缓存状态: ${initialStats.totalKeys} 个key`);
    
    // 创建大量临时数据
    const testDataCount = 50;
    const testOrderIds = [];
    
    for (let i = 0; i < testDataCount; i++) {
      const orderId = `MEMORY_TEST_${i}`;
      testOrderIds.push(orderId);
      const mockData = this.createMockOrderData(orderId);
      
      // 设置较短的过期时间（1秒）
      DataManager.cacheOrderData(orderId, mockData, 1000);
    }
    
    // 检查数据是否正确缓存
    const afterCreateStats = DataManager.getCacheStats();
    console.log(`📊 创建数据后: ${afterCreateStats.totalKeys} 个key`);
    
    // 等待数据过期
    setTimeout(() => {
      // 手动清理过期数据
      DataManager.cleanExpiredCache();
      
      const afterCleanStats = DataManager.getCacheStats();
      console.log(`📊 清理后状态: ${afterCleanStats.totalKeys} 个key`);
      
      const leakDetected = afterCleanStats.totalKeys > (initialStats.totalKeys + 5); // 允许5个key的误差
      
      if (leakDetected) {
        console.log('⚠️ 检测到可能的内存泄漏');
        console.log(`   - 初始: ${initialStats.totalKeys} keys`);
        console.log(`   - 清理后: ${afterCleanStats.totalKeys} keys`);
        console.log(`   - 未清理: ${afterCleanStats.totalKeys - initialStats.totalKeys} keys`);
      } else {
        console.log('✅ 未检测到内存泄漏');
      }
      
      console.log('✅ 内存泄漏测试完成');
      
    }, 2000); // 等待2秒让数据过期
  }

  /**
   * 运行所有测试
   */
  static async runAllTests() {
    console.log('🚀 开始运行完整测试套件...\n');
    
    try {
      // 1. 数据流转测试
      await this.testOrderDataFlow();
      
      console.log('\n' + '='.repeat(60) + '\n');
      
      // 2. 性能测试
      await this.performanceTest();
      
      console.log('\n' + '='.repeat(60) + '\n');
      
      // 3. 并发测试
      await this.concurrencyTest();
      
      console.log('\n' + '='.repeat(60) + '\n');
      
      // 4. 内存泄漏测试
      this.memoryLeakTest();
      
      console.log('\n🎉 所有测试执行完成！');
      
    } catch (error) {
      console.error('❌ 测试套件执行失败:', error);
    }
  }
}

module.exports = DataFlowTest;