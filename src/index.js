import * as L from 'leaflet';
import { isPointInPolygon } from 'geolib';
import coordinates from './coordinates.json';

// Set map area and center view
let coord1 = [-39.603457,-73.038868];
let coord2 = [-39.808016,-72.774131];
let view = [-39.66123,-72.95155];

// Create map and set OSM tiles
let map = L.map('map', {
  maxZoom: 19,
  minZoom: 15,
  maxBounds: [
    coord1,
    coord2
  ],
}).setView(view, 16);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(map);

// Set custom zones
const territorios = coordinates.territorios;

// Set zone colors
const colors = coordinates.colors;

// Updated createZones function
function createZones(obj, col) {
  for (let i in obj) {
    let num = i.match(/\d+/)[0];
    let polygon = L.polygon(obj[i], { color: col[num], fillOpacity: 0.7, weight: 2 }).addTo(map);
  }
}

let markersArray = [];
let polygon = null;

function createDraggableMarker(latlng) {
  let marker = new L.marker(latlng, {
    draggable: 'true'
  });
  map.addLayer(marker);

  marker.on('click', function (event) {
    map.removeLayer(marker);
    markersArray = markersArray.filter(m => m !== marker);

    // Update the polygon with the new positions
    if (polygon !== null) {
      let positionsArray = markersArray.map(function (m) {
        return m.getLatLng();
      });
      polygon.setLatLngs(positionsArray);
    }
  });

  marker.on('dragend', function (event) {
    let position = marker.getLatLng();
    marker.setLatLng(position, {
      draggable: 'true'
    }).bindPopup(position).update();

    // Clear the console
    console.clear();

    // Output the current positions of all markers
    markersArray.forEach(function (m) {
      let pos = m.getLatLng();
      console.log(pos.lat.toFixed(5) + "," + pos.lng.toFixed(5));
    });

    // Update the polygon with the new positions
    if (polygon !== null) {
      let positionsArray = markersArray.map(function (m) {
        return m.getLatLng();
      });
      polygon.setLatLngs(positionsArray);
    }
  });

  return marker;
}


map.on('click', function (e) {
  let clickedInsidePolygon = false;
  let clickedPolygon = null;
  map.eachLayer(function (layer) {
    if (layer instanceof L.Polygon && layer !== polygon) {
      const point = { latitude: e.latlng.lat, longitude: e.latlng.lng };
      const vertices = layer.getLatLngs()[0].map(vertex => {
        return { latitude: vertex.lat, longitude: vertex.lng };
      });

      if (isPointInPolygon(point, vertices)) {
        clickedInsidePolygon = true;
        clickedPolygon = layer;
      }
    }
  });

  if (clickedInsidePolygon) {
    markersArray.forEach(marker => map.removeLayer(marker));
    markersArray = clickedPolygon.getLatLngs()[0].map(vertex => createDraggableMarker(vertex));
  } else {
    let marker = createDraggableMarker(e.latlng);
    markersArray.push(marker);

    // Output the current positions of all markers
    console.clear();
    markersArray.forEach(function (m) {
      let pos = m.getLatLng();
      console.log(pos.lat.toFixed(5) + "," + pos.lng.toFixed(5));
    });

    // Remove the previous polygon (if any) and create a new one
    if (polygon !== null) {
      polygon.remove();
    }
    let positionsArray = markersArray.map(function (m) {
      return m.getLatLng();
    });
    polygon = L.polygon(positionsArray, { color: 'red', fillOpacity: 0.7, weight: 2 }).addTo(map);
  }
});



createZones(territorios, colors)

// Set zone and square markers
const markers = coordinates.markers;
  
  for (let item in markers) {
      for (let idx = 0; idx < markers[item].length; idx++) {
          if (item === 'num') {
              let pos = new L.LatLng(markers[item][idx][0],markers[item][idx][1]);
              let iconNum = (idx + 1);
              let icon = L.divIcon({
                  iconSize:null,
                  html:'<div class="map-label number"><div class="map-label-content">'+iconNum+'</div><div class="map-label-arrow"></div></div>'
                });
              L.marker(pos,{icon: icon}).addTo(map);
          } else {
            let pos = new L.LatLng(markers[item][idx][0],markers[item][idx][1]);
            let icon = L.divIcon({
              iconSize:null,
              html:'<div class="map-label square"><div class="map-label-content">'+item+'</div><div class="map-label-arrow"></div></div>'
            });
          L.marker(pos,{icon: icon}).addTo(map);
          }
      }
  }

// Enable device GPS
map.locate({
  watch: true,
  enableHighAccuracy: true,
  maximumAge: 1000, // Reduced maximum age to get more frequent updates
  timeout: 10000, // Increased timeout to allow for more time to get accurate location
});

// Add location marker
let gpsMarker = null;
let hasCentered = false;

function onLocationFound(e) {
  const latlng = e.latlng;
  const mapBounds = L.latLngBounds(coord1, coord2);

  // Update the view based on the user's location or the default view
  if (!hasCentered) {
    const newView = mapBounds.contains(latlng) ? latlng : view;
    map.setView(newView);
    hasCentered = true; // Set the flag to true once the view has been centered
  }

  // Create or update the GPS marker with the user's latitude and longitude
  if (gpsMarker == null) {
    gpsMarker = L.marker(latlng).addTo(map);
  } else {
    gpsMarker.setLatLng(latlng);
  }
}

map.on('locationfound', onLocationFound);

// On location error
function onLocationError(e) {
  alert("No se pudo determinar su ubicación");
}

map.on('locationerror', onLocationError);
