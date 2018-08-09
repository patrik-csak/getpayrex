/**
 * @param {string} userId Paycheck Records user ID
 * @param {string} password Paycheck Records password
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} destination Directory to store PDFs
 * @return {Promise<void>}
 */
const download = async (
  {userId, password, startDate, endDate, destination}
) => {
  const moment = require('moment')
  const ora = require('ora')
  const path = require('path')
  const ProgressBar = require('progress')
  const puppeteer = require('puppeteer')
  const {mkdir} = require('shelljs')

  const pdfsDir = path.normalize(`${destination}/Paycheck Records PDFs`)
  const url = 'https://paycheckrecords.com'

  const [startDateStr, endDateStr] = [startDate, endDate]
    .map(date => moment(date).format('MM/DD/YYYY'))
  const [startDatePretty, endDatePretty] = [startDate, endDate]
    .map(date => moment(date).format('MMM D, YYYY'))

  const spinner = ora('Logging in to Paycheck Records').start()

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto(`${url}/login.jsp`)
  await page.type('#ius-userid', userId)
  await page.type('#ius-password', password)
  await page.click('#ius-sign-in-submit-btn')

  try {
    await page.waitForSelector('table.report', {timeout: 10000})
  } catch (error) {
    const elementText = await page.evaluate(() => {
      return document.getElementsByClassName('error')[0].innerText
    })
    const message = `Failed to log in. Paycheck Records reported the following error: '${elementText}'`

    spinner.fail(message)
    await browser.close()

    throw new Error(message)
  }

  spinner
    .succeed('Logged in to Paycheck Records')
    .start(
      `Searching for paychecks from ${startDatePretty} to ${endDatePretty}`
    )

  // Clear date inputs
  await page.evaluate(() => {
    for (const id of ['startDate', 'endDate'])
      document.getElementById(id).value = ''
  })
  await page.type('#startDate', startDateStr)
  await page.type('#endDate', endDateStr)
  await page.click('#updateReportSubmit')
  // Wait for the table to load
  await page.waitFor(2500)

  const ids = await page.evaluate(() => {
      const anchors = Array.from(
        document.querySelectorAll(
          'table.report > tbody > tr > td:first-child > a'
        )
      )

      return anchors.map(a => +a.href.match(/paycheckId=(\d+)/)[1])
    }
  )

  if (!ids.length) {
    const message =
      `Found no paychecks between ${startDatePretty} and ${endDatePretty}. Maybe try different dates?`

    spinner.fail(message)
    await browser.close()

    throw new Error(message)
  }

  spinner
    .succeed(
      `Found ${ids.length} paychecks from ${startDatePretty} to ${endDatePretty}`
    )

  console.info(`Downloading PDFs to ${pdfsDir}`)

  mkdir('-p', pdfsDir)

  const bar = new ProgressBar(':percent :bar', {total: ids.length})
  const dateCounts = new Map()

  for (const id of ids) {
    await page.goto(
      `${url}/in/paystub_printerFriendly.jsp?paycheckId=${id}`
    )

    const date = await page.evaluate(() => {
      const [, m, d, y] = document.querySelectorAll(
        'table.checkPart > tbody > tr > td > table > tbody > tr > td:nth-child(3)'
      )[0]
        .innerText
        .match(/(\d{2})\/(\d{2})\/(\d{4})/)

      return [y, m, d].join('-')
    })

    const count = dateCounts.get(date) ? dateCounts.get(date) + 1 : 1
    dateCounts.set(date, count)
    const suffix = count > 1 ? `-${count}` : ''
    let path = `${pdfsDir}/${date}${suffix}.pdf`

    await page.pdf({path, printBackground: true})

    bar.tick()
  }

  spinner.succeed(`${ids.length} PDFs downloaded to ${pdfsDir}`)

  await browser.close()
}

module.exports = download
