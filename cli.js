#!/usr/bin/env node

const main = async () => {
  const chalk = require('chalk')
  const download = require('./src/download')
  const moment = require('moment')
  const os = require('os')
  const program = require('commander')

  const now = moment()
  const version = JSON.parse(require('fs').readFileSync('package.json', 'utf8'))

  program
    .version(version, '-v, --version')
    .arguments('<user-id>')
    .option(
      '-d, --destination <directory>',
      'directory to download PDFs to',
      destination => {
        if (destination.startsWith('~'))
          destination.replace('~', os.homedir())

        return path.resolve(__dirname, destination)
      },
      `${os.homedir()}/Downloads`
    )
    .option('-s, --start-date <yyyy-mm-dd>', 'start date', '1900-01-01')
    .option('-e, --end-date <yyyy-mm-dd>', 'end date', now.format('YYYY-MM-DD'))
    .parse(process.argv)

  const [userId] = program.args
  const {
    startDate: startDateOpt,
    endDate: endDateOpt,
    destination
  } = program

  if (!userId) {
    console.error(chalk.red(`<user-id> is required`))
    process.exit(1)
  }

  for (const date of [startDateOpt, endDateOpt]) {
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) {
      console.error(chalk.red(`'${date}' is not a valid date`))
      process.exit(1)
    }
  }

  const [startDate, endDate] = [startDateOpt, endDateOpt]
    .map(date => moment(date, ['YYYY-M-D']).toDate())

  const {password} = await require('inquirer').prompt({
    type: 'password',
    name: 'password',
    mask: '•',
    message: 'Enter your Paycheck Records password',
    validate: password => !!password.length
  })

  try {
    await download({userId, password, startDate, endDate, destination})
  } catch (e) {
    process.exit(1)
  }
}

main().catch(console.error)
