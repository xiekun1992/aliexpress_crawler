const {
  app, BrowserWindow
} = require('electron')
const fs = require('fs')
const path = require('path')
const xlsx = require('node-xlsx');

const { ListCrawler } = require('./list_crawl')
const { DetailCrawler, Dispatcher } = require('./detail_crawl')
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'

app.commandLine.appendSwitch("disable-background-timer-throttling")
app.on('window-all-closed', () => {})

app.whenReady().then(async () => {
  const startTime = Date.now()
  // 根据参数启动列表采集或详情采集
  switch(process.argv[2]) {
    case '-l':
      const lcontent = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'list_config.json')))
      const listCrawler = new ListCrawler({ua})
      const detailUrls = await listCrawler.crawl(lcontent.url, lcontent.max_pages)
      listCrawler.destroy()

      const taskQueue = []
      for (let i = 0; i < 6; i++) {
        taskQueue.push(new DetailCrawler())
      }

      const dispatcher = new Dispatcher(taskQueue, detailUrls)

      dispatcher.once('done', (products, failedUrls) => {
        console.log('total time', Date.now() - startTime, 'ms')
        console.log(failedUrls)
        fs.writeFileSync(path.resolve(__dirname, `${Date.now()}.json`), JSON.stringify(failedUrls, null, 2))
        const data = [
          [
            '产品id', '产品名称', '产品图片', '产品详细描述1', '颜色', '尺寸', '价格(卢布)', '库存',
            '变体图片', '来源url', '运费(卢布)', '订单数', '评价星级', '评价数量', '运费+价格(卢布)'
          ]
        ]
        products.forEach(productSeries => {
          data.push(...productSeries)
        })
        // console.log(data)
        const output = [{
          name: 'sheet1',
          data
        }]
        // console.log(products, output)
        const buffer = xlsx.build(output)
        fs.writeFileSync(path.resolve(__dirname, `${Date.now()}.xlsx`), buffer)
        app.quit()
      })

      dispatcher.run()
      // win.close()
      // dcontent = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'detail_config.json')))
      // dcontent.success_urls.push(...detailUrls)
      // fs.writeFileSync(path.resolve(__dirname, 'detail_config.json'), JSON.stringify(dcontent, null, 2))

      // console.log(new Set(detailUrls).size)
      // const detailUrls = ["https://aliexpress.ru/item/1005003017749512.html"]
      // const detailUrls = ["https://aliexpress.ru/item/1005002169451906.html"]
      // const detailUrls = ["https://aliexpress.ru/item/1005002612825529.html"]
      // const detailUrls = ["https://aliexpress.ru/item/4001054732168.html"]
      // const detailUrls = ["https://aliexpress.ru/item/33000450913.html"]
      break
    case '-d':
      // dcontent = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'detail_config.json')))
      // if (dcontent.error_urls) {
      //   content.error_urls.forEach(url => {
      //     dcrawler(win, url)
      //   })
      // }
      break
    case '-c':
      const win = new BrowserWindow()
      win.loadURL('https://aliexpress.ru/')
      break
  }
})