import * as L from 'leaflet';
import { isPointInPolygon } from 'geolib';
import coords from './territorios.json';

// Set map area and center view
let coord1 = coords.base.edge1;
let coord2 = coords.base.edge2;
let view = coords.base.center;
const colorMap = new Map();

// Create Esri World Imagery layer
let esriWorldImagery = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  }
);

// Create OSM layer
let osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
});

// Initialize the map with the OSM layer
let map = L.map('map', {
  layers: [osmLayer],
  maxZoom: 18,
  minZoom: 15,
  maxBounds: [
    coord1,
    coord2
  ],
}).setView(view, 16);

// Add event listener to toggle between OSM and Satellite layers
document.getElementById("satelliteToggle").addEventListener("change", function (e) {
  if (e.target.checked) {
    map.removeLayer(osmLayer);
    map.addLayer(esriWorldImagery);
  } else {
    map.removeLayer(esriWorldImagery);
    map.addLayer(osmLayer);
  }
});

// Load territories and colors from new JSON
const territories = coords.territories;

// Function to create polygons from the JSON source and assign them variable names
const polygonsMap = {};

function createZones(territories) {
  for (const territoryKey in territories) {
    const territory = territories[territoryKey];
    const color = territory.color;
    for (const squareKey in territory) {
      if (squareKey.startsWith("Square")) {
        const edges = territory[squareKey].edges;
        const polygon = L.polygon(edges, { color: color, fillOpacity: 0.7, weight: 2 }).addTo(map);
        polygonsMap[squareKey] = polygon;
      }
    }
  }
}

createZones(territories);
let polygon = null;

// Set Markers function
const markersMap = {};

function setMarkers(territories) {
  for (const territoryKey in territories) {
    const territory = territories[territoryKey];
    const terrNum = territoryKey.match(/\d+/)[0];

    // Set territory number marker
    const terrMarker = territory.terrMarker;
    const posTerrMarker = new L.LatLng(terrMarker[0], terrMarker[1]);
    const iconTerrNum = terrNum;
    const iconTerr = L.divIcon({
      iconSize: null,
      html: `<div class="map-label number"><div class="map-label-content">${iconTerrNum}</div><div class="map-label-arrow"></div></div>`,
    });
    const terrMarkerInstance = L.marker(posTerrMarker, { icon: iconTerr }).addTo(map);
    markersMap[`${territoryKey}Marker`] = terrMarkerInstance;

    // Set square markers
    for (const squareKey in territory) {
      if (squareKey.startsWith("Square")) {
        const squareMarker = territory[squareKey].squareMarker;
        const squareLetter = squareKey.slice(-1);
        const posSquareMarker = new L.LatLng(squareMarker[0], squareMarker[1]);
        const iconSquare = L.divIcon({
          iconSize: null,
          html: `<div class="map-label square"><div class="map-label-content">${squareLetter}</div><div class="map-label-arrow"></div></div>`,
        });
        const squareMarkerInstance = L.marker(posSquareMarker, { icon: iconSquare }).addTo(map);
        markersMap[`${territoryKey}${squareKey}Marker`] = squareMarkerInstance;
      }
    }
  }
}

setMarkers(territories);



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
      // Update the selectedPolygon if it's the same as the polygon being edited
      if (selectedPolygon === polygon) {
        selectedPolygon.setLatLngs(positionsArray);
      }
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

// Floating menu elements
const floatingMenu = document.getElementById("floatingMenu");
const editPolygonButton = document.getElementById("editPolygon");
const deletePolygonButton = document.getElementById("deletePolygon");

// On click marker function
let editMapEnabled = false;
let selectedPolygon = null;

document.getElementById("editMapToggle").addEventListener("change", function (e) {
  editMapEnabled = e.target.checked;

  // Loop through markersArray and set visibility based on editMapEnabled
  markersArray.forEach(function (marker) {
    if (editMapEnabled) {
      marker.addTo(map);
    } else {
      marker.remove();
    }
  });
});

map.on('click', function (e) {
  if (!editMapEnabled) {
    return;
  }

  floatingMenu.style.display = "none";

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
    selectedPolygon = clickedPolygon;
    const polygonCenter = selectedPolygon.getBounds().getCenter();
    L.DomUtil.setPosition(floatingMenu, map.latLngToLayerPoint(polygonCenter));
    floatingMenu.style.display = "block";
  } else {
    // Check if there's a polygon being edited and deselect it
    if (polygon !== null && polygon !== selectedPolygon) {
      polygon.remove();
      polygon = null;
    }

    // Output the current positions of all markers
    console.clear();
    markersArray.forEach(function (m) {
      let pos = m.getLatLng();
      console.log(pos.lat.toFixed(5) + "," + pos.lng.toFixed(5));
    });

    // Remove the previous polygon (if any) and create a new one
    if (polygon === null) {
      let positionsArray = markersArray.map(function (m) {
        return m.getLatLng();
      });

      const newColor = getRandomColor();
      colorMap.set(newColor, true);

      polygon = L.polygon(positionsArray, { color: newColor, fillOpacity: 0.7, weight: 2 }).addTo(map);
    }
  }
});

editPolygonButton.addEventListener("click", function () {
  floatingMenu.style.display = "none";
  markersArray.forEach(marker => map.removeLayer(marker));
  markersArray = selectedPolygon.getLatLngs()[0].map(vertex => createDraggableMarker(vertex));
  polygon = selectedPolygon;
});

deletePolygonButton.addEventListener("click", function () {
  floatingMenu.style.display = "none";
  map.removeLayer(selectedPolygon);
  selectedPolygon = null;
});

const findPolygonByPoint = (point) => {
  let foundPolygon = null;

  map.eachLayer(layer => {
    if (layer instanceof L.Polygon) {
      if (layer.getBounds().contains(point)) {
        foundPolygon = layer;
      }
    }
  });

  return foundPolygon;
};


// Download map menu option
document.getElementById('downloadPolygons').addEventListener('click', () => {
  const bounds = map.getBounds();
  const edge1 = bounds.getNorthWest();
  const edge2 = bounds.getSouthEast();
  const center = map.getCenter();

  let base = {
    edge1: [edge1.lat.toFixed(5), edge1.lng.toFixed(5)],
    edge2: [edge2.lat.toFixed(5), edge2.lng.toFixed(5)],
    center: [center.lat.toFixed(5), center.lng.toFixed(5)],
  };

  let territories = {};

  const incrementLetter = (str) => {
    const lastChar = str.slice(-1);
    const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
    return str.slice(0, -1) + nextChar;
  };

  const findPolygonsByColor = (color) => {
    let polygons = [];
    map.eachLayer(layer => {
      if (layer instanceof L.Polygon && layer.options.color === color) {
        polygons.push(layer);
      }
    });
    return polygons;
  };

  const findMarkerInPolygon = (polygon) => {
    let marker = null;
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        const latLng = layer.getLatLng();
        if (polygon.getBounds().contains(latLng)) {
          marker = layer;
        }
      }
    });
    return marker;
  };

  const findPolygonsWithLetterMarkers = (polygons) => {
    let polygonsWithMarkers = [];
    let polygonsWithoutMarkers = [];

    polygons.forEach(polygon => {
      const marker = findMarkerInPolygon(polygon);
      if (marker !== null) {
        const labelElement = marker.getElement().querySelector('.map-label-content');
        if (labelElement) {
          const label = labelElement.textContent;
          if (label.length === 1 && label.toUpperCase() === label) {
            polygonsWithMarkers.push({ polygon, marker });
          } else {
            polygonsWithoutMarkers.push(polygon);
          }
        }
      } else {
        polygonsWithoutMarkers.push(polygon);
      }
    });

    return { polygonsWithMarkers, polygonsWithoutMarkers };
  };

  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      const labelElement = layer.getElement().querySelector('.map-label-content');
      if (labelElement) {
        const label = labelElement.textContent;
        const latLng = layer.getLatLng();

        if (!isNaN(parseInt(label))) {
          const terrID = `terr${label}`;
          if (!territories.hasOwnProperty(terrID)) {
            territories[terrID] = {
              terrMarker: [latLng.lat.toFixed(5), latLng.lng.toFixed(5)],
              color: '',
            };
          }

          const polygon = findPolygonByPoint(latLng);
          if (polygon) {
            territories[terrID].color = polygon.options.color;

            const polygons = findPolygonsByColor(polygon.options.color);
            const { polygonsWithMarkers, polygonsWithoutMarkers } = findPolygonsWithLetterMarkers(polygons);


          let currentLetter = 'A';
          polygonsWithMarkers.forEach(({ polygon, marker }) => {
            const labelElement = marker.getElement().querySelector('.map-label-content');
            const label = labelElement.textContent;
            const latLng = marker.getLatLng();
            const vertices = polygon.getLatLngs()[0].map(vertex => {
              return [Number(vertex.lat.toFixed(5)), Number(vertex.lng.toFixed(5))];
            });

            territories[terrID][`Square${label}`] = {
              squareMarker: [latLng.lat.toFixed(5), latLng.lng.toFixed(5)],
              edges: vertices,
            };
          });

          polygonsWithoutMarkers.forEach(polygon => {
            const vertices = polygon.getLatLngs()[0].map(vertex => {
              return [Number(vertex.lat.toFixed(5)), Number(vertex.lng.toFixed(5))];
            });

            territories[terrID][`Square${currentLetter}`] = {
              squareMarker: [],
              edges: vertices,
            };

            currentLetter = incrementLetter(currentLetter);
          });

          }
        }
      }
    }
  });

  const territoriosJSON = JSON.stringify({ base, territories }, null, 2);

  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(territoriosJSON);

  const exportFileDefaultName = 'territorios.json';

  const link = document.createElement('a');
  link.setAttribute('href', dataUri);
  link.setAttribute('download', exportFileDefaultName);
  link.click();
});
