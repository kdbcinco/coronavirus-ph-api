const cheerio = require('cheerio')
const cheerioTableparser = require('cheerio-tableparser')
const axios = require('axios')
const https = require('https')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const { toIS08601, stringToNumber } = require('../utils')
require('dotenv').config()

const sheetId = '1wdxIwD0b58znX4UrH6JJh_0IhnZP0YWn23Uqs7lHB6Q'
const doc = new GoogleSpreadsheet(sheetId)

// Get from GOOGLE
doc.useApiKey(process.env.DOC_API_KEY)

class Scraper {
  async getHTML(
    url = 'https://en.wikipedia.org/wiki/2020_coronavirus_pandemic_in_the_Philippines'
  ) {
    try {
      const res = await axios(url)
      return cheerio.load(res.data)
    } catch (e) {
      console.log(e)
      throw new Error("Can't fetch url.")
    }
  }

  async getCases() {
    const $ = await this.getHTML()

    const model = caseNo => ({
      case_no: caseNo,
      date: 'TBA',
      age: 'TBA',
      gender: 'TBA',
      nationality: 'TBA',
      hospital_admitted_to: 'TBA',
      had_recent_travel_history_abroad: 'TBA',
      status: 'TBA',
      other_information: 'TBA'
    })

    const formattedData = []

    // If this element is missing, it means the table is missing in wiki
    const casesCaption = $(
      'span.nowrap:contains("Summary of COVID-19 cases in the Philippines")'
    )

    // Backup source when wiki is down
    if (!casesCaption.text()) {
      const redditData = await this.getRedditCases()
      return redditData
    }

    const travelHistory = el => {
      let res

      if (el.hasClass('tba')) {
        res = 'TBA'
      } else if (el.hasClass('table-yes')) {
        res = 'Yes'
      } else if (el.hasClass('table-no')) {
        res = 'No'
      } else {
        res = 'TBA'
      }

      return res.trim()
    }

    const status = el => {
      let res

      if (el.hasClass('tba')) {
        res = 'TBA'
      } else if (el.hasClass('table-success')) {
        res = 'Recovered'
      } else if (el.hasClass('table-failure')) {
        res = 'Died'
      } else if (el.hasClass('table-partial')) {
        res = 'Admitted'
      }

      return res
    }

    const content = (child, idx) => {
      if (child.eq(idx).hasClass('tba')) {
        return 'TBA'
      }

      return child
        .eq(idx)
        .text()
        .trim()
    }

    $('.wikitable')
      .first()
      .find('tbody tr')
      .each((idx, el) => {
        if (idx === 0) return
        const child = $(el).children()

        formattedData.push({
          case_no: +content(child, 0),
          date: toIS08601(`${content(child, 1)}, 2020`),
          age:
            content(child, 2) === 'TBA' || content(child, 2) === ''
              ? 'TBA'
              : +content(child, 2),
          gender:
            content(child, 3) === 'TBA' || content(child, 3) === ''
              ? 'TBA'
              : content(child, 3).charAt(0),
          nationality: content(child, 4),
          hospital_admitted_to: content(child, 5),
          had_recent_travel_history_abroad: travelHistory(child.eq(6)),
          status: status(child.eq(7)),
          other_information: content(child, 8)
        })
      })

    // Infobox confirmed cases
    const confirmedCases = $('.infobox tbody tr th:contains("Confirmed cases")')
      .next()
      .text()
      .replace(/\,/g, '')

    // We do this because infobox confirmed cases
    // get updated quickly but the table hasn't
    if (+confirmedCases > formattedData.length) {
      const diff = +confirmedCases - formattedData.length
      for (let x = 0; x < diff; x++) {
        formattedData.push(model(formattedData.length + 1))
      }
    }

    const uniq = [...new Set(formattedData.map(i => JSON.stringify(i)))]

    return uniq.map(i => JSON.parse(i))
  }

  async getRedditCases() {
    await doc.loadInfo()

    // Main database from reddit
    const firstSheet = doc.sheetsByIndex[0]

    const rows = await firstSheet.getRows({
      offset: 1
    })

    const formattedData = []

    const addTBA = val =>
      val === '?' || typeof val === 'undefined' ? 'TBA' : val

    const status = stat => {
      if (stat === 'Dead') {
        return 'Died'
      }

      return stat
    }

    rows.forEach(row => {
      formattedData.push({
        case_no: +row['Case #'],
        date:
          row['Tested Positive'] === 'For Validation'
            ? 'For Validation'
            : toIS08601(`${row['Tested Positive']}, 2020`),
        age: +row.Age,
        gender: addTBA(row['Sex']),
        nationality: addTBA(row['Nationality']),
        hospital_admitted_to: addTBA(
          row['Medical Facility Admitted/Consulted']
        ),
        had_recent_travel_history_abroad: addTBA(row['Travel History']),
        status:
          addTBA(row['Status']) !== 'TBA'
            ? status(row['Status'].split(' ')[0])
            : 'TBA',
        other_information: addTBA(row['Other Information'])
      })
    })

    // Check if current total is equal to data from reddit.
    // If not equal, add placeholders (TBA)
    const $ = await this.getHTML()
    cheerioTableparser($)
    const confirmedCases = $('.infobox tbody tr th:contains("Confirmed cases")')
      .next()
      .text()
      .replace(/\,/g, '')
    if (+confirmedCases > formattedData.length) {
      const diff = +confirmedCases - formattedData.length
      for (let x = 0; x < diff; x++) {
        formattedData.push({
          case_no: formattedData.length + 1,
          date: 'TBA',
          age: 'TBA',
          gender: 'TBA',
          nationality: 'TBA',
          hospital_admitted_to: 'TBA',
          had_recent_travel_history_abroad: 'TBA',
          resident_of: 'TBA',
          status: 'TBA',
          other_information: 'TBA'
        })
      }
    }

    return formattedData
  }

  async getCasesOutsidePh() {
    const $ = await this.getHTML()
    cheerioTableparser($)
    const rawData = $('.wikitable')
      .eq(0)
      .parsetable(true, true, true)

    const formattedData = []

    rawData[0].forEach((item, idx) => {
      const skip = [
        0,
        rawData[0].length - 1,
        rawData[0].length - 2,
        rawData[0].length - 3
      ]
      if (skip.includes(idx)) return

      const obj = {
        country_territory_place: item,
        confirmed: +rawData[1][idx].split('[')[0],
        recovered: +rawData[2][idx].split('[')[0],
        died: +rawData[3][idx].split('[')[0]
      }

      formattedData.push(obj)
    })

    // return formattedData

    return formattedData
  }

  // Removed from wiki
  async getTestResults() {
    const $ = await this.getHTML()
    cheerioTableparser($)
    const rawData = $('.wikitable')
      .eq(4)
      .parsetable(true, true, true)

    return {
      confirmed_cases: +rawData[1][0].split(',').join(''),
      cases_tested_negative: +rawData[1][1].split(',').join(''),
      cases_pending_test_results: +rawData[1][2].split(',').join('')
    }
  }

  async getLaboratoryStatusOfPatients() {
    const agent = new https.Agent({
      rejectUnauthorized: false
    })
    const res = await axios('https://www.doh.gov.ph/2019-nCov', {
      httpsAgent: agent
    })
    const $ = cheerio.load(res.data)

    const formattedData = {}

    $('table')
      .eq(0)
      .find('tbody tr')
      .each((idx, el) => {
        const td = $(el).children()

        formattedData[
          td
            .eq(0)
            .text()
            .trim()
            .split(' ')
            .join('_')
            .toLowerCase()
        ] = +td
          .eq(1)
          .text()
          .trim()
          .replace(/\,/g, '')
      })

    return formattedData
  }

  async getPatientsUnderInvestigation() {
    const $ = await this.getHTML()
    cheerioTableparser($)
    const rawData = $('.wikitable')
      .eq(4)
      .parsetable(true, true, true)

    const formattedData = []

    rawData[0].forEach((item, idx) => {
      const skip = [
        0,
        1,
        2,
        rawData[0].length - 1,
        rawData[0].length - 2,
        rawData[0].length - 3
      ]
      if (skip.includes(idx)) return

      const obj = {
        region: rawData[1][idx],
        local_government_unit: item,
        current_pui_status: {
          confirmed_cases: {
            admitted: +rawData[4][idx],
            deaths: +rawData[5][idx],
            recoveries: +rawData[6][idx]
          }
        },
        total: 0
      }

      obj.total = +rawData[4][idx] + +rawData[5][idx] + +rawData[6][idx]

      formattedData.push(obj)
    })

    return formattedData
  }

  async getLockdowns() {
    const url =
      'https://en.wikipedia.org/wiki/Template:2019%E2%80%9320_coronavirus_pandemic_data/Philippines_coronavirus_quarantines'
    const $ = await this.getHTML(url)
    cheerioTableparser($)
    const rawData = $('.wikitable')
      .first()
      .parsetable(true, true, true)

    const formattedData = []

    rawData[0].forEach((item, idx) => {
      const skipIdx = [
        0,
        1,
        2,
        rawData[0].length - 1,
        rawData[0].length - 2,
        rawData[0].length - 3
      ]
      if (skipIdx.includes(idx)) return

      formattedData.push({
        lgu: item.split('[')[0].trim(),
        region: rawData[1][idx],
        start_date: toIS08601(rawData[2][idx]),
        estimated_population: stringToNumber(rawData[3][idx]),
        cases: +rawData[4][idx] || 0,
        deaths: +rawData[5][idx] || 0,
        recovered: +rawData[6][idx || 0]
      })
    })

    return formattedData
  }
}

module.exports = Scraper
