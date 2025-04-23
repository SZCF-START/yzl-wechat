/**
 * 返回到某个页面
 * @param {Object} options
 * @param {string} [options.backUrl=''] - 要返回的页面路径，为空时返回上一页
 * @param {string} [options.url] - 跳转的页面路径 -- 页面栈没有指定的页面时，会强制跳转该页面
 * @param {string} [options.mode='reLaunch'] - 强制跳转跳转模式
 */
export const backPage = ({ backUrl = '', url = '/pages/index/index', pageData = {} , mode = 'reLaunch' } = {}) => {
  const routerApi = {
    navigateTo: wx.navigateTo,
    redirectTo: wx.redirectTo,
    reLaunch: wx.reLaunch,
    switchTab: wx.switchTab,
  }
  const to = () => routerApi[mode]({ url })
  const pages = getCurrentPages()
  console.log("pages:",pages);
  if (pages.length > 1) {
    backUrl = backUrl.startsWith('/') ? backUrl.slice(1) : backUrl
    if (backUrl) {
      const index = pages.findIndex(item => item.route === backUrl)
      if (index === -1) {
        return to()
      }
      if (pageData && Object.keys(pageData).length > 0){
        const targetPage = pages[index];
        targetPage.setData({ ...pageData });
      }
      return wx.navigateBack({ delta: pages.length - (index + 1) })
    }
    return wx.navigateBack()
  }

  return to()
}