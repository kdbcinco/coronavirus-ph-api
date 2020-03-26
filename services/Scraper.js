const cheerio = require('cheerio')
const cheerioTableparser = require('cheerio-tableparser')
const axios = require('axios')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const { toIS08601, stringToNumber } = require('../utils')
require('dotenv').config()

const URL =
  'https://en.wikipedia.org/wiki/2020_coronavirus_pandemic_in_the_Philippines'

const sheetId = '1wdxIwD0b58znX4UrH6JJh_0IhnZP0YWn23Uqs7lHB6Q'
const doc = new GoogleSpreadsheet(sheetId)

// Get from GOOGLE
doc.useApiKey(process.env.DOC_API_KEY)

class Scraper {
  async getHTML() {
    try {
      const res = await axios(URL)
      return cheerio.load(res.data)
    } catch (e) {
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
      } else if (el.hasClass('yes')) {
        res = 'Yes'
      } else if (el.hasClass('no')) {
        res = 'No'
      }

      return res.trim()
    }

    const status = el => {
      let res

      if (el.hasClass('tba')) {
        res = 'TBA'
      } else if (el.hasClass('status-r')) {
        res = 'Recovered'
      } else if (el.hasClass('status-d')) {
        res = 'Died'
      } else if (el.hasClass('status-a')) {
        res = 'Admitted'
      }

      return res.trim()
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
          age: +content(child, 2),
          gender: content(child, 3).charAt(0),
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

    // We do this because infobox confirmed cases
    // get updated quickly but the table hasn't
    if (+confirmedCases > formattedData.length) {
      const diff = +confirmedCases - formattedData.length
      for (let x = 0; x < diff; x++) {
        formattedData.push(model(formattedData.length + 1))
      }
    }

    return formattedData
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
          addTBA(row['Status']) !== 'TBA' ? row['Status'].split(' ')[0] : 'TBA',
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
          other_information: 'TBA',
          source: 'TBA'
        })
      }
    }

    return formattedData
  }

  async getCasesOutsidePh() {
    const $ = await this.getHTML()
    cheerioTableparser($)
    const rawData = $('.wikitable')
      .eq(2)
      .parsetable(true, true, true)

    const formattedData = []

    rawData[0].forEach((item, idx) => {
      const skip = [0, rawData[0].length - 1, rawData[0].length - 2]
      if (skip.includes(idx)) return

      const obj = {
        country_territory_place: item,
        confirmed: +rawData[1][idx].split('[')[0],
        recovered: +rawData[2][idx].split('[')[0],
        died: +rawData[3][idx].split('[')[0]
      }

      formattedData.push(obj)
    })

    return formattedData
  }

  async getTestResults() {
    const $ = await this.getHTML()
    cheerioTableparser($)
    const rawData = $('.wikitable')
      .eq(4)
      .parsetable(true, true, true)

    return {
      confirmed_cases: +rawData[1][0],
      cases_tested_negative: +rawData[1][1],
      cases_pending_test_results: +rawData[1][2]
    }
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
    const $ = await this.getHTML()
    cheerioTableparser($)
    const rawData = $('.wikitable')
      .eq(6)
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
        cases: +rawData[4][idx],
        deaths: +rawData[5][idx],
        recovered: +rawData[6][idx]
      })
    })

    return formattedData
  }
}

module.exports = Scraper
