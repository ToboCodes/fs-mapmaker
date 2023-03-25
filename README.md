# FS MapMaker

FS MapMaker is an online custom map creation tool that allows users to draw polygons on a map, place markers, and get the coordinates of those markers. Users can also click on existing polygons to view their vertices and modify them.

## Features

- Draw polygons by clicking on the map
- Drag markers to adjust the shape of the polygons
- Click on existing polygons to place markers on their vertices
- Remove markers by clicking on them
- Automatically centers the map on the user's location upon loading (if location permission is granted)
- Continuously updates the user's location with a GPS marker

## Dependencies

- Leaflet.js
- geolib

## Getting Started

1. Clone the repository.
2. Run `npm install` to install the necessary dependencies.
3. Run `npm start` to start the development server.
4. Open your browser and navigate to `http://localhost:1234`.

## Usage

1. Click on the map to place markers and automatically create a polygon from the markers.
2. Drag the markers to adjust the shape of the polygon.
3. Click on an existing polygon to place markers on its vertices. Drag those markers to update the polygon shape.
4. Click on a marker to remove it.

## License

This project is open-source and available under the MIT License.