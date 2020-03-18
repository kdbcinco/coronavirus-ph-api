# coronavirus-ph (API)

> 🦠A simple and fast (< 200ms) api for tracking the coronavirus (COVID-19, SARS-CoV-2) outbreak in the Philippines.

![GitHub](https://img.shields.io/github/license/sorxrob/coronavirus-ph-api)
![GitHub repo size](https://img.shields.io/github/repo-size/sorxrob/coronavirus-ph-api?label=size)
![GitHub stars](https://img.shields.io/github/stars/sorxrob/coronavirus-ph-api)
![GitHub forks](https://img.shields.io/github/forks/sorxrob/coronavirus-ph-api)
![GitHub last commit](https://img.shields.io/github/last-commit/sorxrob/coronavirus-ph-api)

## Endpoints

All requests must be made to the base url: `https://coronavirus-ph-api.now.sh` (e.g: https://coronavirus-ph-api.now.sh/cases). You can try them out in your browser to further inspect responses.

Getting summary of COVID-19 cases in the Philippines:

```http
GET /cases
```

```json
[
  {
    "case_no": 1,
    "date": "2020-01-30",
    "age": 38,
    "gender": "Female",
    "nationality": "Chinese",
    "hospital_admitted_to": "San Lazaro Hospital, Manila",
    "had_recent_travel_history_abroad": "Yes",
    "status": "Recovered",
    "notes": "Traveled from Wuhan, China and Hong Kong. Wife of Case No. 2; discharged on February 10."
  },
  {...}
]

```

Getting confirmed cases of Filipino
nationals outside the Philippines:

```http
GET /cases-outside-ph
```

```json
[
  {
    "country_territory_place": "Diamond Princess",
    "confirmed": 80,
    "recovered": 70,
    "died": 0
  },
  {...}
]
```

Getting suspected cases:

```http
GET /suspected-cases
```

```json
{
  "confirmed_cases": 140,
  "cases_tested_negative": 638,
  "cases_pending_test_results": 72
}
```

Getting patients under investigation:

```http
GET /patients-under-investigation
```

```json
[
  {
    "region": "Metro Manila (NCR)",
    "current_pui_status": {
       "suspected_cases": {
         "admitted": 80,
         "deaths": 1
       },
       "confirmed_cases": {
         "admitted": 117,
         "recoveries": 1,
         "deaths": 9
       }
    },
    "total": 208
  },
  {...}
]
```

Getting Metro Manila Community Quarantine Checkpoints:

```http
GET /mm-checkpoints
```

```json
[
  {
    "id": 13,
    "district": "NORTHERN POLICE DISTRICT",
    "city": "VALENZUELA CITY",
    "location": "NLEX (ENTRANCE)",
    "type": "EntryExit",
    "lat": 14.768614,
    "lng": 120.967557,
    "description": "Not verified"
  },
  {...}
]
```

Getting a single Metro Manila Community Quarantine Checkpoint:

```http
GET /mm-checkpoints/:id
```

```json
{
  "id": 13,
  "district": "NORTHERN POLICE DISTRICT",
  "city": "VALENZUELA CITY",
  "location": "NLEX (ENTRANCE)",
  "type": "EntryExit",
  "lat": 14.768614,
  "lng": 120.967557,
  "description": "Not verified"
}
```

## Data

The cases data comes from the [2020 coronavirus pandemic in the Philippines page in wikipedia](https://en.wikipedia.org/wiki/2020_coronavirus_pandemic_in_the_Philippines) which also gets mostly of their data from the [DOH COVID-19](https://www.doh.gov.ph/2019-nCoV) page while the checkpoints data comes from [safetravel.ph](https://safetravel.ph/). It is
programmatically retrieved, re-formatted and stored in the cache for one hour.

## Installation

- `git clone https://github.com/sorxrob/coronavirus-ph-api.git`
- `cd coronavirus-ph-api`
- `npm install`
- `npm start`

## Running / Development

- `npm run dev`
- Visit your app at [http://localhost:3030](http://localhost:3030).

## Testing

- `npm test`

## Deploy on ZEIT Now

The easiest way to deploy this app is to use the [ZEIT Now Platform](https://zeit.co/) from the creators of Next.js.

## In the Wild

A list of public websites that are using this API

- https://zntp.github.io/covidcase
- https://covid19ph-update.netlify.com
- https://covid19.nextvation.com

## Other apps

I also launched a [coronavirus tracking website](https://the2019ncov.com) and open-sourced it!

## License & copyright

© Robert C Soriano

Licensed under the [MIT License](LICENSE).
