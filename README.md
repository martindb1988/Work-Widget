# Work Trip Dashboard

This code provides a work trip dashboard widget that integrates with a calendar to display the details of the user's next work event, including the trip route, travel time, weather conditions, and other relevant information. The widget is built for use on iOS devices with the Scriptable app.

## Key Features:
- **Event Calendar Integration:** It fetches upcoming events from a specified calendar to check for work-related tasks in the next 48 hours.
- **Location Detection:** Based on the event's location (either `Location A` or `Location B`), the widget calculates the route from the user's home, and provides details such as the route distance and estimated travel time by bicycle.
- **Weather Information:** It fetches real-time weather data from the Open Meteo API, which includes temperature, wind speed, and cloud cover. The widget uses this information to adjust the background gradient color according to the temperature and checks for potential rain or wind conditions during the trip.
- **Wind Consideration:** The widget calculates the wind direction and checks for headwinds, which could reduce the user's travel speed.
- **Route Calculation:** The widget calculates the travel distance and time using the OSRM routing API. It adjusts the estimated travel time based on wind conditions and rain probability.
- **Departure Time:** The widget calculates the optimal departure time based on the event's start time and includes a buffer for unforeseen delays (e.g., weather).
- **Dynamic Widget Content:** Depending on the weather conditions, the widget displays relevant weather information like wind, rain, or cloud cover. It updates the background gradient to reflect the current temperature.

## How It Works:
1. **Calendar Lookup:** The script searches for events in the user’s specified calendar for the next 48 hours.
2. **Event Filtering:** The script filters out all-day events and sorts the remaining ones by start date.
3. **Location Match:** It checks whether the event is related to `Location A` or `Location B`. If no match is found, it will display "No service tomorrow."
4. **Route & Weather Data:** The script calculates the route from the user's home to the selected location, considering the wind conditions and weather forecast during the trip.
5. **Output:** The widget is populated with event details, location, service time, route information, and weather-related data like temperature, rain, and wind. The background color adjusts to match the temperature, and relevant weather warnings (e.g., rain or headwind) are displayed.
6. **Departure Time Calculation:** Based on the calculated travel time, the widget suggests the ideal departure time to ensure the user arrives on time.

## Data Sources:
- **Calendar Events:** Fetches events from the specified calendar.
- **Routing API:** Uses [OSRM Routing API](https://project-osrm.org/) to calculate the route and travel time.
- **Weather Data:** Fetches real-time weather data from [Open-Meteo API](https://open-meteo.com/).

## Usage:
This script is ideal for anyone needing to track work-related travel in advance, ensuring timely departure based on weather and travel conditions. Simply run it within the Scriptable app on your iOS device.
