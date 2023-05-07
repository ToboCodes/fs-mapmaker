import * as L from 'leaflet';
import { isPointInPolygon } from 'geolib';
import coords from './territorios.json';

// Set map area and center view
let coord1 = coords.base.edge1;
let coord2 = coords.base.edge2;
let view = coords.base.center;
const colorMap = new Map();

let isEditingEnabled = false;

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

// Add event listener to toggle map editing
document.getElementById("editToggle").addEventListener("change", function (e) {
  isEditingEnabled = e.target.checked;
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
        const polygonName = territoryKey + squareKey;
        polygonsMap[polygonName] = polygon;
      }
    }
  }
}

function setupPolygonInteractions(polygon, polygonName, edges) {
  // Add click event listener to the polygon
  polygon.on('click', (e) => {
    if (!isEditingEnabled) return;

    const point = {
      latitude: e.latlng.lat,
      longitude: e.latlng.lng
    };

    // Get the updated edges from the territories object
    const territoryKey = polygonName.replace(/Square.*/, '');
    const squareKey = polygonName.replace(territoryKey, '');
    const updatedEdges = territories[territoryKey][squareKey].edges;

    // Check if the click point is inside the polygon
    const isInside = isPointInPolygon(point, updatedEdges.map(coord => ({ latitude: coord[0], longitude: coord[1] })));

    // If click is inside, print the variable name and its edges
    if (isInside) {
      console.clear();
      console.log(`Variable name: ${polygonName}`);
      console.log(`Variable value (edges):`, updatedEdges);
    }
  });


  // Function to update the polygon when a vertex is dragged
  function updatePolygon() {
    if (!isEditingEnabled) return;
    const newEdges = vertexMarkers.map(marker => {
      const latLng = marker.getLatLng().wrap();
      const roundedLat = parseFloat(latLng.lat.toFixed(5));
      const roundedLng = parseFloat(latLng.lng.toFixed(5));
      return [roundedLat, roundedLng];
    });
    polygon.setLatLngs(newEdges);
  
    // Update the edges in the territories object
    const territoryKey = polygonName.replace(/Square.*/, '');
    const squareKey = polygonName.replace(territoryKey, '');
    territories[territoryKey][squareKey].edges = newEdges;
  }
  

  // Create draggable markers for each vertex of the polygon
  const vertexMarkers = edges.map(coord => {
    const marker = L.marker(coord, { draggable: true, zIndexOffset: 1000 }).addTo(map);

    // Update the polygon when a vertex marker is dragged
    marker.on('drag', updatePolygon);

    return marker;
  });

  // Hide the vertex markers by default
  vertexMarkers.forEach(marker => marker.removeFrom(map));

  // Show the vertex markers when the polygon is clicked
  polygon.on('click', () => {
    if (!isEditingEnabled) return;
    vertexMarkers.forEach(marker => marker.addTo(map));
  });

  // Hide the vertex markers when clicking outside the polygon
  map.on('click', (e) => {
    if (!isPointInPolygon(e.latlng, edges.map(coord => ({ latitude: coord[0], longitude: coord[1] })))) {
      vertexMarkers.forEach(marker => marker.removeFrom(map));
    }
  });
}


createZones(territories);

for (const polygonName in polygonsMap) {
  const polygon = polygonsMap[polygonName];
  const territoryKey = polygonName.replace(/Square.*/, '');
  const squareKey = polygonName.replace(territoryKey, '');
  const edges = territories[territoryKey][squareKey].edges;
  setupPolygonInteractions(polygon, polygonName, edges);
}

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
      html: `<div class="map-label number"><div class="map-label-content">${iconTerrNum}</div></div>`,
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
          html: `<div class="map-label square"><div class="map-label-content">${squareLetter}</div></div>`,
        });
        const squareMarkerInstance = L.marker(posSquareMarker, { icon: iconSquare }).addTo(map);
        markersMap[`${territoryKey}${squareKey}Marker`] = squareMarkerInstance;
      }
    }
  }
}

setMarkers(territories);

// Save map JSON function
function generateJson() {
  const output = {
    base: {
      edge1: coords.base.edge1,
      edge2: coords.base.edge2,
      center: coords.base.center
    },
    territories: {}
  };

  for (const polygonName in polygonsMap) {
    const polygon = polygonsMap[polygonName];
    const territoryKey = polygonName.replace(/Square.*/, '');
    const squareKey = polygonName.replace(territoryKey, '');
    const edges = polygon.getLatLngs()[0].map(coord => [
      parseFloat(coord.lat.toFixed(5)),
      parseFloat(coord.lng.toFixed(5))
    ]);

    if (!output.territories[territoryKey]) {
      output.territories[territoryKey] = {
        color: polygon.options.color,
        terrMarker: [
          parseFloat(markersMap[`${territoryKey}Marker`].getLatLng().lat.toFixed(5)),
          parseFloat(markersMap[`${territoryKey}Marker`].getLatLng().lng.toFixed(5))
        ],
      };
    }

    output.territories[territoryKey][squareKey] = {
      edges: edges,
      squareMarker: [
        parseFloat(markersMap[`${territoryKey}${squareKey}Marker`].getLatLng().lat.toFixed(5)),
        parseFloat(markersMap[`${territoryKey}${squareKey}Marker`].getLatLng().lng.toFixed(5))
      ]
    };
  }

  return output;
}


document.getElementById("downloadMap").addEventListener("click", function() {
  const data = generateJson();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "territorios.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
});

// Territory list
function populateTerritoriesList() {
  const territoriesList = document.getElementById("territoriesList");

  for (const territoryKey in territories) {
    const listItem = document.createElement("li");
    listItem.className = "menu-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = territoryKey + "Checkbox";
    checkbox.checked = true;
    listItem.appendChild(checkbox);

    const label = document.createElement("label");
    label.htmlFor = territoryKey + "Checkbox";
    label.textContent = "Territorio " + territoryKey.match(/\d+/)[0];
    listItem.appendChild(label);

    territoriesList.appendChild(listItem);

    // Add event listener to control territory visibility
    checkbox.addEventListener("change", function (e) {
      const territory = territories[territoryKey];
      for (const squareKey in territory) {
        if (squareKey.startsWith("Square")) {
          if (e.target.checked) {
            polygonsMap[territoryKey + squareKey].addTo(map);
            markersMap[territoryKey + squareKey + "Marker"].addTo(map);
          } else {
            polygonsMap[territoryKey + squareKey].removeFrom(map);
            markersMap[territoryKey + squareKey + "Marker"].removeFrom(map);
          }
        }
      }
    });
  }
}

populateTerritoriesList();

// Toggle territories menu option
function toggleTerritoriesMenu() {
  const menu = document.getElementById("menu");
  const territoriesMenu = document.getElementById("territoriesMenu");

  if (menu.style.display === "block") {
    menu.style.display = "none";
    territoriesMenu.style.display = "block";
  } else {
    menu.style.display = "block";
    territoriesMenu.style.display = "none";
  }
}

document.getElementById("togglePolygons").addEventListener("click", toggleTerritoriesMenu);


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
  const menu = document.getElementById("menu");
  const territoriesMenu = document.getElementById("territoriesMenu");

  if (territoriesMenu.style.display === "block") {
    territoriesMenu.style.display = "none";
  } else if (!menuVisible) {
    menu.style.display = "block";
    menuVisible = true;
  } else {
    menu.style.display = "none";
    menuVisible = false;
  }
}

// Zoom level format
function updateLabelStyles() {
  const zoomLevel = map.getZoom();
  const territoryLabels = document.querySelectorAll(".map-label.number");
  const squareLabels = document.querySelectorAll(".map-label.square");

  if (zoomLevel === 18) {
    territoryLabels.forEach(label => {
      label.style.fontSize = "38px";
    });

    squareLabels.forEach(label => {
      label.style.fontSize = "21px";
    });
  } else {
    territoryLabels.forEach(label => {
      label.style.fontSize = "21px";
    });

    squareLabels.forEach(label => {
      label.style.fontSize = "12px";
    });
  }

  // Hide square labels at minZoom
  if (zoomLevel === 15) {
    territoryLabels.forEach(label => {
      label.style.fontSize = "18px";
    });

    squareLabels.forEach(squareLabel => {
      squareLabel.style.display = 'none';
    });
  } else {
    squareLabels.forEach(squareLabel => {
      squareLabel.style.display = 'block';
    });
  }
}

map.on('zoomend', updateLabelStyles);


document.getElementById('menuBtn').addEventListener('click', toggleMenu);