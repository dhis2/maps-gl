const json = require('../src/data/malaria-events.json');

const toGeoJson = (headers, rows) => ({
  type: 'FeatureCollection',
  features: rows.map(row => ({
    type: 'Feature',
    id: row[0],
    properties: headers.reduce((o, h, i) => ({
      ...o,
      h: row[i],
    }), {}),
    geometry: {
      type: 'Point',
      coordinates: [parseFloat(row[3]), parseFloat(row[4])],
    }
  })),
});

console.log(JSON.stringify(toGeoJson(json.headers, json.rows)));