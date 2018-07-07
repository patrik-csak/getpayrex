const {Chromeless} = require('chromeless')
const fs = require('fs')

require('dotenv')
  .config()

async function run () {
  const chromeless = new Chromeless({launchChrome: false})
  let dates = {}

  const ids = await chromeless
    .goto('https://www.paycheckrecords.com/login.jsp')
    .type(process.env.USERNAME, '#ius-userid')
    .type(process.env.PASSWORD, '#ius-password')
    .click('#ius-sign-in-submit-btn')
    .wait('table.report')
    .clearInput('input#startDate')
    .type('01/01/2000', 'input#startDate')
    .click('#updateReportSubmit')
    .wait(1000)
    .evaluate(() => {
      const ids = []
      document
        .querySelectorAll('table.report > tbody > tr > td:first-child > a')
        .forEach(a => {ids.push(+a.href.match(/paycheckId=(\d+)/)[1])})
      return ids
    })

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    const url = `https://www.paycheckrecords.com/in/paystub_printerFriendly.jsp?paycheckId=${id}`

    const date = await chromeless
      .goto(url)
      .evaluate(() => {
        const [, m, d, y] = document
          .querySelectorAll(
            'table.checkPart > tbody > tr > td > table > tbody > tr > td:nth-child(3)'
          )[0]
          .textContent
          .match(/(\d{2})\/(\d{2})\/(\d{4})/)

        return `${y}-${m}-${d}`
      })

    const pdf = await chromeless
      .goto(url)
      .pdf()

    dates[date] = dates[date] ? ++dates[date] : 1

    let filename = `${__dirname}/pdfs/${date}`
    filename += dates[date] > 1 ? `-${dates[date]}.pdf` : '.pdf'

    fs.copyFileSync(pdf, filename, fs.constants.COPYFILE_EXCL)
  }

  await chromeless.end()
}

run()
  .catch(console.error.bind(console))
