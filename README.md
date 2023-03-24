# FS-MapMaker

FS-MapMaker is a simple web application that displays a Leaflet map and shows the user's current location using the device's GPS. It also allows you to draw custom polygons directly on the map and get its coords to put them on your map permanently.

## Features

- Shows a map using Leaflet
- Displays the user's current location with a marker
- Centers the map to a predefined area if the user is located outside the map bounds
- Draw and modify custom polygons on the map and get its vertices locations

## Installation

To run this project locally, follow these steps:

1. Clone the repository:

git clone https://github.com/ToboCodes/fs-mapmaker.git

css
Copy code

2. Navigate to the project folder:

cd fs-mapmaker

markdown
Copy code

3. Install the required dependencies:

npm install

markdown
Copy code

4. Start the development server:

npm run start

markdown
Copy code

5. Open your browser and visit `http://localhost:1234`.

## Dependencies

- [Leaflet](https://leafletjs.com/)
- [Parcel](https://parceljs.org/)

## License

This project is open-source and available under the [MIT License](LICENSE).