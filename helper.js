(function() {
  return new Promise(resolve => {
    var tabElements = [], i = 0, j = 0
    var products = []
    var chinaEl
    var tabs = Array.prototype.slice.call(document.querySelector("#\\#content > div[class*='Product_Sku__container__']").children)
    // 提取中国仓库
    for (let i = 0; i < tabs.length; i += 2) {
      // console.log(tabs[i].textContent)
      if (tabs[i].textContent.indexOf('Доставка из') > -1) {
        // console.log(Array.prototype.slice.call(tabs[i+1].children).map(el => el.textContent))
        chinaEl = Array.prototype.slice.call(tabs[i+1].children).find(el => el.textContent.toUpperCase() === 'CHINA' || el.textContent.toUpperCase() === 'CN')
        break
      }
    }
    // 提取其他选项
    for (let i = 0; i < tabs.length; i += 2) {
      if (tabs[i].textContent.indexOf('Доставка из') === -1) {
        tabElements.push(Array.prototype.slice.call(tabs[i+1].children).filter(el => el.className.includes('Product_SkuValueBaseItem__item__')))
      }
    }
    console.log('开始点击', tabElements)
    exec()
  
    function exec() {
      async.series([
        function(callback) {
          setTimeout(() => {
            callback()
          }, 500);
        },
        function(callback) {
          click(chinaEl)
          tabElements[0] && click(tabElements[0][i])
          tabElements[1] && click(tabElements[1][j])
          callback()
        },
        function(callback) {
          setTimeout(() => {
            callback()
          }, 500);
        },
        function(callback) {
          // 产品名称
          const name = document.querySelector("#\\#content > div[class^='Product_Name__container__'] > h1").textContent
          console.log(name)
          // 产品图片
          const cover = Array.prototype.slice.call(document.querySelectorAll("#__aer_root__ > div > div > div > div > div:nth-child(1) > div > div[class*='Product_Gallery__gallery__'] > div > div > div:nth-child(2) > div > div > img")).map(el => el.src.replace('_50x50.jpg', ''))
          console.log(cover)
          // 产品详细描述1
          const desc = document.querySelector("[class*='ProductDescription-module_wrapper__']").innerText.replaceAll('\\n', '<br/>')
          console.log(desc)
          // 价格
          let price = (
            document.querySelector("#\\#content > div[class*='Product_Price__container__'].product-price > span[class*='ali-kit_Base__base__'][class*='ali-kit_Base__default__'][class*='ali-kit_Base__strong__'].price[class*='ali-kit_Price__size-xl__'][class*='Product_Price__current__'].product-price-current")
            || document.querySelector("span[class*='Product_UniformBanner__uniformBannerBoxPrice__']")
          ).textContent
          price = parsePrice(price)
          console.log(price)
          // 库存
          const inventory = document.querySelector("#\\#content > div[class*='Product_Quantity__quantity__'] > div[class*='Product_Quantity__picker__'] > span[class*='Product_Quantity__countText__'] > span:last-child").textContent
          console.log(inventory)
          // 变体图片
          const img = document.querySelector("#\\#content > div[class*='Product_Sku__container__'] > div > div[class*='Product_SkuValueBaseItem__item__'][class*='Product_SkuValueBaseItem__active__'] > img")?.src
          console.log(img)
          // 运费
          let freight = document.querySelector("#\\#content > div[class*='Product_Delivery__productShipping__'] > div > div:nth-child(2) > span > span").textContent
          freight = parsePrice(freight)
          console.log(freight)
          // 订单数
          const orders = document.querySelector("#\\#content > div[class^='Product_CustomerReviews__container__'] > div[class^='Product_CustomerReviews__orders__'] > span")?.textContent
          console.log(orders)
          // 评价星级
          const starRate = document.querySelector("#\\#content > div[class^='Product_CustomerReviews__container__'] > div[class^='Product_CustomerReviews__stars__'] > div > div > div > span")?.textContent
          console.log(starRate)
          // 评价数量
          const numberOfRate = document.querySelector("#\\#content > div[class^='Product_CustomerReviews__container__'] > div[class^='Product_CustomerReviews__reviews__'] > span")?.textContent
          console.log(numberOfRate)
          // 运费+价格
          const totalPrice = (parseFloat(freight) + parseFloat(price)).toString()
          // 颜色
          const color = (tabElements[0] && tabElements[0][i]) ? tabElements[0][i].parentNode.previousElementSibling.children[1].textContent : ''
          // 尺寸
          const size = (tabElements[1] && tabElements[1][j]) ? tabElements[1][j].parentNode.previousElementSibling.children[1].textContent : ''
          console.log(totalPrice)
          products.push([
            name,
            cover.join('\n'),
            desc.replace(/\n/ig, '<br/>'),
            color,
            size,
            price,
            inventory.replace('шт. в наличии', '').trim(),
            img || cover[0],
            freight,
            orders ? orders.replace('заказа(ов)', '').replace('заказ', '').trim() : '0',
            starRate || '0',
            numberOfRate ? numberOfRate.replace('Отзывы', '').trim() : '0',
            totalPrice
          ])
          callback()
        }
      ]).then(() => {
        if (tabElements[1]) {
          j++
          if (j >= tabElements[1].length) {
            if (i >= tabElements[0].length - 1) {
              // 完成遍历
              resolve(products)
            } else {
              i++
              j = 0
              exec()
            }
          } else {
            exec()
          }
        } else if (tabElements[0]) {
          i++
          console.log(i, tabElements[0].length)
          if (i >= tabElements[0].length - 1) {
            // 完成遍历
            resolve(products)
          } else {
            exec()
          }
        } else {
          // 只有仓库，没有别的变体选项
          // 完成遍历
          resolve(products)
        }
      }).catch(console.log)
    }
  })

  function click(target) {
    if (target && target.className.includes('Product_SkuValueBaseItem__item__')) {
      if (!target.className.includes('Product_SkuValueBaseItem__active__')) {
        target.click()
      }
    }
  }

  function parsePrice(price) {
    let parsedPrice = price
    if (parsedPrice === 'Бесплатно') {
      parsedPrice = '0'
    }
    return parsedPrice.replace('руб.', '').replace('за', '').replace(',', '.').replace(/\s/g, '')
  }
})()