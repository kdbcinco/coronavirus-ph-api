# coronavirus-ph (API)

> 🦠A simple api for tracking the coronavirus (COVID-19, SARS-CoV-2) outbreak in the Philippines.

## Endpoints

All requests must be made to the base url: ``https://coronavirus-ph-api.now.sh`` (e.g: https://coronavirus-ph-api.now.sh/cases). You can try them out in your browser to further inspect responses.

Getting summary of COVID-19 cases in the Philippines:
```http
GET /cases
```
```json
[
  {
    "Case No": "1",
    "Date": "January 30",
    "Age": "38",
    "Gender": "Female",
    "Nationality": "Chinese",
    "Hospital Admitted To": "San Lazaro Hospital, Manila",
    "Had Recent Travel History Abroad": "Yes",
    "Status": "Recovered",
    "Notes": "Traveled from Wuhan, China and Hong Kong. Wife of Case No. 2; discharged on February 10."
  }
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
    "Country/Territory/Place": "Diamond Princess",
    "Confirmed": "80",
    "Recovered": "70",
    "Died": "0"
  }
]
```

Getting suspected cases:
```http
GET /suspected-cases
```
```json
{
  "Confirmed cases": "140",
  "Cases tested negative": "638",
  "Cases pending test results": "72"
}
```

## Data

The data comes from the [2020 coronavirus pandemic in the Philippines page in wikipedia](https://en.wikipedia.org/wiki/2020_coronavirus_pandemic_in_the_Philippines). It is
programmatically retrieved, re-formatted and stored in the cache for one hour.

## Installation

* `git clone https://github.com/sorxrob/coronavirus-ph-api.git`
* `cd coronavirus-ph-api`
* `npm install`
* `npm start`

## Running / Development

* `npm run dev`
* Visit your app at [http://localhost:5000](http://localhost:5000).

## Deploy on ZEIT Now

The easiest way to deploy your Next.js app is to use the [ZEIT Now Platform](https://zeit.co/) from the creators of Next.js.