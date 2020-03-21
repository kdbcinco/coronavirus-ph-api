const cheerio = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');
const axios = require('axios');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { toIS08601 } = require('../utils');
require('dotenv').config();

const URL = 'https://en.wikipedia.org/wiki/2020_coronavirus_pandemic_in_the_Philippines';

const sheetId = '1wdxIwD0b58znX4UrH6JJh_0IhnZP0YWn23Uqs7lHB6Q';
const doc = new GoogleSpreadsheet(sheetId);

// Get from GOOGLE
doc.useApiKey(process.env.DOC_API_KEY);

class Scraper {
  async getHTML() {
    try {
      const res = await axios(URL);
      return cheerio.load(res.data);
    } catch (e) {
      throw new Error("Can't fetch url.");
    }
  }

  async getCases() {
    const $ = await this.getHTML();
    cheerioTableparser($);
    const rawData = $('.wikitable').first().parsetable(true, true, true);

    const model = (caseNo) => ({
      "case_no": caseNo,
      "date": "TBA",
      "age": "TBA",
      "gender": "TBA",
      "nationality": "TBA",
      "hospital_admitted_to": "TBA",
      "had_recent_travel_history_abroad": "TBA",
      "status": "TBA",
      "other_information": "TBA"
    });

    const formattedData = [];

    // If this element is missing, it means the table is missing in wiki
    const casesCaption = $('span.nowrap:contains("Summary of COVID-19 cases in the Philippines")');

    // Backup source when wiki is down
    if (!casesCaption.text()) {
      const redditData = await this.getRedditCases();
      return redditData;
    }

    // Infobox confirmed cases
    const confirmedCases = $('.infobox tbody tr th:contains("Confirmed cases")').next().text();

    rawData[0].forEach((item, idx) => {
      if (idx === 0) return;

      // Check if last row has hyphen meaning it's TBA
      // Ex. 201-212
      if (item.includes('–')) {
        if (+confirmedCases > formattedData.length) {
          const diff = +confirmedCases - formattedData.length;
          for (let x = 0; x < diff; x++) {
            formattedData.push(model(formattedData.length + 1));
          }
        }

        return;
      }

      const obj = {
        "case_no": +item,
        "date": toIS08601(`${rawData[1][idx]}, 2020`),
        "age": typeof rawData[2][idx] === 'string' ? rawData[2][idx] : +rawData[2][idx],
        "gender": rawData[3][idx].charAt(0),
        "nationality": rawData[4][idx],
        "hospital_admitted_to": rawData[5][idx],
        "had_recent_travel_history_abroad": rawData[6][idx],
        "status": rawData[7][idx],
        "other_information": rawData[8][idx]
      };

      formattedData.push(obj);
    });

    // We do this because infobox confirmed cases
    // get updated quickly but the table hasn't
    if (+confirmedCases > formattedData.length) {
      const diff = +confirmedCases - formattedData.length;
      for (let x = 0; x < diff; x++) {
        formattedData.push(model(formattedData.length + 1));
      }
    }

    return formattedData;
  }

  async getRedditCases() {
    await doc.loadInfo();

    // Main database from reddit
    const firstSheet = doc.sheetsByIndex[0];

    const rows = await firstSheet.getRows({
      offset: 1
    });

    const formattedData = [];

    const addTBA = (val) => val === '?' || typeof val === 'undefined' ? "TBA" : val;

    rows.forEach((row) => {
      formattedData.push({
        "case_no": +row['Case #'],
        "date": row['Tested Positive'] === 'For Validation' ? 'For Validation' : toIS08601(`${row['Tested Positive']}, 2020`),
        "age": +row.Age,
        "gender": addTBA(row['Sex']),
        "nationality": addTBA(row['Nationality']),
        "hospital_admitted_to": addTBA(row['Medical Facility Admitted/Consulted']),
        "had_recent_travel_history_abroad": addTBA(row['Travel History']),
        "status": addTBA(row['Status']) !== 'TBA' ? row['Status'].split(' ')[0] : 'TBA',
        "other_information": addTBA(row['Other Information']),
      });
    });

    // Check if current total is equal to data from reddit.
    // If not equal, add placeholders (TBA)
    const $ = await this.getHTML();
    cheerioTableparser($);
    const confirmedCases = $('.infobox tbody tr th:contains("Confirmed cases")').next().text();
    if (+confirmedCases > formattedData.length) {
      const diff = +confirmedCases - formattedData.length;
      for (let x = 0; x < diff; x++) {
        formattedData.push({
          "case_no": formattedData.length + 1,
          "date": "TBA",
          "age": "TBA",
          "gender": "TBA",
          "nationality": "TBA",
          "hospital_admitted_to": "TBA",
          "had_recent_travel_history_abroad": "TBA",
          "resident_of": "TBA",
          "status": "TBA",
          "other_information": "TBA",
          "source": "TBA"
        });
      }
    }

    return formattedData;
  }

  async getCasesOutsidePh() {
    const $ = await this.getHTML();
    cheerioTableparser($);
    const rawData = $('.wikitable').eq(1).parsetable(true, true, true);

    const formattedData = [];

    rawData[0].forEach((item, idx) => {
      const skip = [0, rawData[0].length - 1, rawData[0].length - 2]
      if (skip.includes(idx)) return;

      const obj = {
        "country_territory_place": item,
        "confirmed": +rawData[1][idx],
        "recovered": +rawData[2][idx],
        "died": +rawData[3][idx]
      };

      formattedData.push(obj);
    });

    return formattedData;
  }

  async getSuspectedCases() {
    const $ = await this.getHTML();
    cheerioTableparser($);
    const rawData = $('.wikitable').eq(3).parsetable(true, true, true);

    return {
      "confirmed_cases": +rawData[1][0],
      "cases_tested_negative": +rawData[1][1],
      "cases_pending_test_results": +rawData[1][2]
    }
  }

  async getPatientsUnderInvestigation() {
    const $ = await this.getHTML();
    cheerioTableparser($);
    const rawData = $('.wikitable').eq(4).parsetable(true, true, true);

    const formattedData = [];

    rawData[0].forEach((item, idx) => {
      const skip = [0, 1, 2, rawData[0].length - 1, rawData[0].length - 2, rawData[0].length - 3];
      if (skip.includes(idx)) return;

      const obj = {
        "region": rawData[1][idx],
        "local_government_unit": item,
        "current_pui_status": {
          "confirmed_cases": {
            "admitted": +rawData[4][idx],
            "deaths": +rawData[5][idx],
            "recoveries": +rawData[6][idx],
          }
        },
        "total": 0
      };

      obj.total = +rawData[4][idx] + +rawData[5][idx] + +rawData[6][idx]

      formattedData.push(obj);
    });

    return formattedData;
  }
}

module.exports = Scraper;