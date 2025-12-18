# VEM Admin Dashboard

A comprehensive React-based admin dashboard for the Vehicle Environmental Monitoring (VEM) system.

## Features

- **Real-time Dashboard**: Live monitoring of vehicles, devices, and alerts
- **Interactive Map**: Vehicle locations with GPS tracking
- **Vehicle Cards**: Detailed vehicle information with clickable popups
- **Sensor Analytics**: Comprehensive charts and graphs for all sensor data
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Components

### Header
- Dashboard title with vehicle icon
- Refresh button to update all data

### Stats Cards
- Vehicle count
- Device count  
- Active alerts count

### Vehicle Map
- Interactive map showing vehicle locations
- GPS coordinates and status information
- Popup details for each vehicle

### Vehicle Cards
- Grid layout of vehicle information cards
- Click to open detailed modal with:
  - Vehicle information
  - Device details
  - Recent alerts
  - Latest sensor readings

### Sensor Graphs
- Line charts showing sensor trends over time
- Bar charts for latest readings
- Organized by sensor categories:
  - Environmental (Temperature, Humidity, Pressure)
  - Air Quality (CO₂, TVOC)
  - Pollutants (O₃, CO, NO₂, CH₄, LPG)
- Time range selector (6h, 12h, 24h, 48h)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Google Maps API Key:
   - Create a `.env` file in the frontend directory
   - Add your Google Maps API key:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```
   - Get your API key from: https://console.cloud.google.com/google/maps-apis
   - Make sure to enable "Maps JavaScript API" for your project

3. Start the development server:
```bash
npm start
```

4. The dashboard will open at `http://localhost:3000`

## API Integration

The dashboard connects to the VEM backend API at `http://localhost:3001` by default. Make sure the backend is running before using the dashboard.

### Required Backend Endpoints

- `GET /vehicles` - Get all vehicles
- `GET /alerts` - Get all alerts
- `GET /alerts/:carId` - Get alerts for a specific car
- `GET /snapshots/:carId/latest` - Get latest snapshot for vehicle (by car_id)
- `GET /snapshots/:carId/history` - Get historical data for vehicle (by car_id)

## Technologies Used

- **React 18** - Frontend framework
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Google Maps API** - Interactive maps
- **Lucide React** - Icons
- **Axios** - HTTP client

## File Structure

```
src/
├── components/
│   ├── Header.js          # Dashboard header with refresh
│   ├── StatsCards.js      # Statistics cards
│   ├── VehicleMap.js      # Interactive map component
│   ├── VehicleCards.js    # Vehicle information cards
│   └── SensorGraphs.js    # Sensor data charts
├── services/
│   └── api.js            # API service functions
├── App.js                # Main application component
├── index.js              # Application entry point
└── index.css             # Global styles
```

## Customization

### Adding New Sensors
To add new sensor types, update the `getSensorCategories()` function in `SensorGraphs.js`:

```javascript
{
  name: 'New Category',
  sensors: [
    { key: 'newSensorKey', label: 'New Sensor', color: '#color', icon: IconComponent }
  ]
}
```

### Styling
The dashboard uses Tailwind CSS for styling. Custom colors and themes can be modified in `tailwind.config.js`.

### API Configuration
Update the API base URL in `src/services/api.js` if your backend runs on a different port or host.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Performance

- Optimized for real-time data updates
- Efficient chart rendering with Recharts
- Responsive design for all screen sizes
- Lazy loading of sensor data 