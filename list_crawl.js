const a = require('async')
const {
  BrowserWindow
} = require('electron')

class ListCrawler {
  ua
  constructor({ua}) {
    this.ua = ua
    this.win = new BrowserWindow({
      webPreferences: {
        backgroundThrottling: false
      },
      show: true
    })
  }
  destroy() {
    this.win.close()
  }
  crawl(urlStr, pages) {
    const st = Date.now()
    const links = []
    return new Promise(resolve => {
      this.win.loadURL(urlStr, { userAgent: this.ua })
      this.win.webContents.once('did-finish-load', async () => {
        while (true) {
          try {
            const res = await this.crawlDetail(pages).then(([curPage, hasNextPage, detailUrls]) => {
              links.push(...detailUrls)
              if (!hasNextPage || curPage >= pages) {
                return false
              }
              return true
            })
            if (!res) {
              break
            }
          } catch {
            break
          }
        }
        resolve(links)
        console.log('list crawl costs', Date.now() - st, 'ms')
      })
    })
  }
  crawlDetail(pages) {
    const self = this
    return new Promise(async (resolve, reject) => {
      let curPage, hasNextPage = true, detailUrls
      // 检查当前页是否应该采集
        a.series([
          function(callback) {
            (async function() {
              try {
                curPage = await self.win.webContents.executeJavaScript(`document.querySelector("#__aer_root__ > div > div[class*='SearchWrap_SearchWrap__content__'] > div[class*='ali-kit_Grid__grid__'][class*='ali-kit_Grid__row__'][class*='ali-kit_Grid__flex-start__'][class*='ali-kit_Grid__align-flex-start__'] > div[class*='ali-kit_Col__col__'] > div > div[class*='SearchPagination_SearchPagination__pagination__'] > button[class*='SearchPagination_Button__button__'][class*='SearchPagination_Button__active__'][class*='SearchPagination_SearchPagination__paginationButton__']").textContent`)
                curPage = +curPage
                callback()
              } catch(e) {
                console.log(e)
                callback(new Error('end'))
              }
            })()
          },
          self.timeout(1000),
          function(callback) {
            (async function() {
              try {
                await self.win.webContents.executeJavaScript(`document.querySelector("#__aer_root__ > div > div[class*='SearchWrap_SearchWrap__content__'] > div[class*='ali-kit_Grid__grid__'][class*='ali-kit_Grid__row__'][class*='ali-kit_Grid__flex-start__'][class*='ali-kit_Grid__align-flex-start__'] > div[class*='ali-kit_Col__col__'] > div > div[class*='SearchPagination_SearchPagination__pagination__'] > button[class*='SearchPagination_Button__button__'][class*='SearchPagination_Button__active__'][class*='SearchPagination_SearchPagination__paginationButton__']").click()`)
                callback()
              } catch(e) {
                console.log(e)
                callback(new Error('end'))
              }
            })()
          },
          self.timeout(3000),
          function(callback) {
            (async function() {
              // 获取详情页链接
              detailUrls = await self.win.webContents.executeJavaScript(`Array.prototype.slice.call(document.querySelectorAll("#__aer_root__ > div > div[class*='SearchWrap_SearchWrap__content__'] > div[class*='ali-kit_Grid__grid__'][class*='ali-kit_Grid__row__'][class*='ali-kit_Grid__flex-start__'][class*='ali-kit_Grid__align-flex-start__'] > div[class*='ali-kit_Col__col__'] > div > div[class*='SearchProductFeed_SearchProductFeed__productFeed__'] > ul > li > ul > li > div > div[class*='SearchProductFeed_Preview__preview__'][class*='SearchProductFeed_GalleryCard__preview__'] > a")).map(el => el.href)`)
              console.log('pages', curPage, detailUrls.length)
              // 点击下一页
              if (curPage < pages) {
                try {
                  const nextPage = await self.win.webContents.executeJavaScript(`document.querySelector("#__aer_root__ > div > div[class*='SearchWrap_SearchWrap__content__'] > div[class*='ali-kit_Grid__grid__'][class*='ali-kit_Grid__row__'][class*='ali-kit_Grid__flex-start__'][class*='ali-kit_Grid__align-flex-start__'] > div[class*='ali-kit_Col__col__'] > div > div[class*='SearchPagination_SearchPagination__pagination__'] > button[class*='SearchPagination_Button__button__'][class*='SearchPagination_Button__active__'][class*='SearchPagination_SearchPagination__paginationButton__']").nextSibling.textContent`)
                  if (Number.isInteger(+nextPage)) {
                    await self.win.webContents.executeJavaScript(`document.querySelector("#__aer_root__ > div > div[class*='SearchWrap_SearchWrap__content__'] > div[class*='ali-kit_Grid__grid__'][class*='ali-kit_Grid__row__'][class*='ali-kit_Grid__flex-start__'][class*='ali-kit_Grid__align-flex-start__'] > div[class*='ali-kit_Col__col__'] > div > div[class*='SearchPagination_SearchPagination__pagination__'] > button[class*='SearchPagination_Button__button__'][class*='SearchPagination_Button__active__'][class*='SearchPagination_SearchPagination__paginationButton__']").nextSibling.click()`)
                    self.timeout(3000)(callback)
                  } else {
                    hasNextPage = false
                    callback()
                  }
                } catch {
                  callback(new Error('end'))
                }
              } else {
                hasNextPage = false
                callback()
              }
            })()
          },
        ]).then(function() {
          console.log(curPage, hasNextPage)
          resolve([curPage, hasNextPage, detailUrls])
        }).catch(function(e) {
          console.log(e)
          reject(e)
        })
    })
  }
  timeout(ms) {
    return function(callback) {
      setTimeout(() => {
        callback()
      }, ms)
    }
  }
}

module.exports = {
  ListCrawler
}