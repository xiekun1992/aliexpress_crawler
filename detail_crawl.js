// 产品id	产品名称	产品图片	产品详细描述1	尺寸	颜色	价格	库存	变体图片	来源url	运费	订单数	评价星级	评价数量 运费+价格
const {
  BrowserWindow
} = require('electron')
const fs = require('fs')
const path = require('path')
const EventEmitter = require('events')
const code = fs.readFileSync(path.resolve(__dirname, 'helper.js'))
const asyncCode = fs.readFileSync(path.resolve(__dirname, 'node_modules/async/dist/async.min.js'))

class DetailCrawler {
  win
  ua
  constructor() {
    this.win = new BrowserWindow({
      webPreferences: {
        backgroundThrottling: false
      },
      // show: false
      show: true
    })
    // this.win.webContents.openDevTools()
    this.ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
  }
  crawl(urlStr) {
    return new Promise((resolve, reject) => {
      const start = Date.now()
      this.win.loadURL(urlStr, { userAgent: this.ua })
      let timeout = false
      const timer = setTimeout(() => {
        // 60秒超时等待
        timeout = true
        reject()
      }, 60000);
      this.win.webContents.once('did-finish-load', async () => {
        if (timeout) return
        clearTimeout(timer)
        console.log('did-finish-load', urlStr)
        // 注入外部代码
        await this.win.webContents.executeJavaScript(asyncCode)
        // 开始采集
        this.win.webContents.executeJavaScript(code).then((res) => {
          // console.log(res)
          console.log('time', urlStr, Date.now() - start, 'ms')
          const pid = urlStr.split('/').pop().replace('.html', '')
          res.forEach(arr => {
            // 产品id
            arr.unshift(pid)
            // 来源url
            arr.splice(9, 0, urlStr)
          })
          resolve(res)
        }).catch(reject)
      })
    })
  }
}

class Dispatcher extends EventEmitter {
  data
  totalNum
  successQueue
  failQueue
  taskQueue
  constructor(taskQueue, data) {
    super()
    this.successQueue = []
    this.failQueue = []
    this.taskQueue = taskQueue
    this.data = data
    this.totalNum = this.data.length
  }
  dispatch(task) {
    const data = this.data.shift()
    if (typeof data !== 'undefined') {
      console.log('left', this.data.length)
      task.crawl(data).then((products) => {
        this.successQueue.push(products)
        return this.dispatch(task)
      }).catch(() => {
        this.failQueue.push(data)
        return this.dispatch(task)
      })
    } else {
      if (this.successQueue.length + this.failQueue.length === this.totalNum) {
        console.log(this.successQueue.length, this.failQueue.length, this.totalNum)
        this.emit('done', this.successQueue, this.failQueue)
      }
    }
  }
  run() {
    this.taskQueue.forEach(task => {
      this.dispatch(task)
    })
  }
}


module.exports = {
  DetailCrawler,
  Dispatcher
}