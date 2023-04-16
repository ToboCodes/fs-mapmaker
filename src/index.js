import * as L from 'leaflet';
import { isPointInPolygon } from 'geolib';
import coords from './coordinates.json';

// Set map area and center view
let coord1 = coords.base.edge1;
let coord2 = coords.base.edge2;
let view = coords.base.center;
const colorMap = new Map();

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

// Load coords from JSON
const territorios = coords.territorios;
const colors = coords.colors;

// Updated createZones function
function createZones(obj, col) {
  for (let i in obj) {
    let num = i.match(/\d+/)[0];
    let polygon = L.polygon(obj[i], { color: col[num], fillOpacity: 0.7, weight: 2 }).addTo(map);
  }
}

let markersArray = [];
let polygon = null;

// Edge markers function
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

// Function to generate a random color
function getRandomColor() {
  let color = '#' + Math.floor(Math.random() * 16777215).toString(16);
  while (colorMap.has(color)) {
    color = '#' + Math.floor(Math.random() * 16777215).toString(16);
  }
  return color;
}

// On click marker function
let editMapEnabled = false;

document.getElementById("editMapToggle").addEventListener("change", function (e) {
  editMapEnabled = e.target.checked;
});
map.on('click', function (e) {
  if (!editMapEnabled) {
    return;
  }
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
    
    const newColor = getRandomColor();
    colorMap.set(newColor, true);
    
    polygon = L.polygon(positionsArray, { color: newColor, fillOpacity: 0.7, weight: 2 }).addTo(map);
  }
});

createZones(territorios, colors)

// Set zone and square markers
const markers = coords.markers;
  
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
  maximumAge: 1000,
  timeout: 10000
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

function onLocationError(e) {
  alert("No se pudo determinar su ubicación");
}

map.on('locationerror', onLocationError);

// Menu button toggle
let menuVisible = false;
const menu = document.getElementById('menu');

function toggleMenu() {
  if (!menuVisible) {
    menu.style.display = 'block';
    menuVisible = true;
  } else {
    menu.style.display = 'none';
    menuVisible = false;
  }
}

document.getElementById('menuBtn').addEventListener('click', toggleMenu);

// Download map menu option
document.getElementById('downloadPolygons').addEventListener('click', () => {
  const bounds = map.getBounds();
  const edge1 = bounds.getNorthWest();
  const edge2 = bounds.getSouthEast();
  const center = map.getCenter();

  let territorios = "{\n  \"base\": {\n";
  territorios += `    \"edge1\": [${edge1.lat.toFixed(5)},${edge1.lng.toFixed(5)}],\n`;
  territorios += `    \"edge2\": [${edge2.lat.toFixed(5)},${edge2.lng.toFixed(5)}],\n`;
  territorios += `    \"center\": [${center.lat.toFixed(5)},${center.lng.toFixed(5)}]\n  },\n`;

  territorios += "  \"territorios\": {\n";
  let colorsObj = {};
  let colorCounter = 1;
  let colorKeys = {};

  // Initialize the markers object
  let markersObj = {};

  const incrementLetter = (str) => {
    const lastChar = str.slice(-1);
    const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
    return str.slice(0, -1) + nextChar;
  };

  const processPolygon = (layer) => {
    const color = layer.options.color;
    let colorKey;

    if (!Object.values(colorsObj).includes(color)) {
      colorsObj[colorCounter] = color;
      colorKey = colorCounter;
      colorKeys[colorKey] = "A";
      colorCounter++;
    } else {
      colorKey = Object.keys(colorsObj).find(key => colorsObj[key] === color);
      colorKeys[colorKey] = incrementLetter(colorKeys[colorKey]);
    }

    const vertices = layer.getLatLngs()[0].map(vertex => {
      return `[${Number(vertex.lat.toFixed(5))},${Number(vertex.lng.toFixed(5))}]`;
    }).join(',\n      ');

    territorios += `    \"zone${colorKey}${colorKeys[colorKey]}\": [\n      ${vertices}\n    ],\n`;
  };

  // Check if there's a user-created polygon
  if (polygon !== null) {
    processPolygon(polygon);
  }

  map.eachLayer(layer => {
    if (layer instanceof L.Polygon && layer !== polygon) {
      processPolygon(layer);
    } else if (layer instanceof L.Marker) {
      const labelElement = layer.getElement().querySelector('.map-label-content');
      
      if (labelElement) {
        const label = labelElement.textContent;
        const latLng = layer.getLatLng();
        const key = isNaN(parseInt(label)) ? label : "num";

        if (!markersObj[key]) {
          markersObj[key] = [];
        }
        markersObj[key].push([latLng.lat.toFixed(5), latLng.lng.toFixed(5)]);
      }
    }
  });

  territorios = territorios.slice(0, -2) + "\n  },\n";
  territorios += "  \"markers\": {\n";

  for (const [key, value] of Object.entries(markersObj)) {
    territorios += `    \"${key}\": [\n`;
    territorios += value.map(coord => `      [${coord[0]},${coord[1]}]`).join(',\n');
    territorios += "\n    ],\n";
  }

  territorios = territorios.slice(0, -2) + "\n  },\n";
  territorios += "  \"colors\": {\n";
  for (const [key, value] of Object.entries(colorsObj)) {
    territorios += `    \"${key}\": \"${value}\",\n`;
  }

  territorios = territorios.slice(0, -2) + "\n  }\n}";

  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(territorios);

  const exportFileDefaultName = 'territorios.json';

  const link = document.createElement('a');
  link.setAttribute('href', dataUri);
  link.setAttribute('download', exportFileDefaultName);
  link.click();
});
