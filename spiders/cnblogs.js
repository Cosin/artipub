const BaseSpider = require('./base')

class CnblogsSpider extends BaseSpider {

  async inputContent(article, editorSel) {
    const footerContent = `<br><b>本文最先发表于个人网站<a href="https://sssis.me" target="_blank">「花墨世界」</a></b><br><br><b>关注公众号查看我的更多文章：花墨世界</b><br><img src="http://wx4.sinaimg.cn/mw690/0060lm7Tly1fyumis9goej30go0go0ud.jpg">`
    const content = article.contentHtml + footerContent;
    const iframeWindow = document.querySelector('#Editor_Edit_EditorBody_ifr').contentWindow
    const el = iframeWindow.document.querySelector(editorSel.content)
    el.focus()
    iframeWindow.document.execCommand('delete', false)
    iframeWindow.document.execCommand('insertHTML', false, content)
  }

  async inputFooter(article, editorSel) {
    // do nothing
  }

  async afterPublish() {
    const username = await this.page.evaluate(() => {
      return document.querySelector('#lnkBlogUrl').innerText
    })
    const _url = this.page.url()
    const id = _url.match(/postid=(\d+)/)[1]
    const url = `https://www.cnblogs.com/${username}/articles/${id}.html`
    this.task.url = url
    this.task.updateTs = new Date()
    await this.task.save()
  }

  async fetchStats() {
    if (!this.task.url) return
    await this.page.goto(this.task.url, { timeout: 60000 })
    await this.page.waitFor(5000)

    const stats = await this.page.evaluate(() => {
      const text = document.querySelector('body').innerText
      const mRead = text.match(/阅读 \((\d+)\)/)
      const mLike = document.querySelector('#bury_count').innerText
      const mComment = text.match(/评论 \((\d+)\)/)
      const readNum = mRead ? Number(mRead[1]) : 0
      const likeNum = Number(mLike)
      const commentNum = mComment ? Number(mComment[1]) : 0
      return {
        readNum,
        likeNum,
        commentNum
      }
    })
    this.task.readNum = stats.readNum
    this.task.likeNum = stats.likeNum
    this.task.commentNum = stats.commentNum
    await this.task.save()
    await this.page.waitFor(3000)
  }
}

module.exports = CnblogsSpider
