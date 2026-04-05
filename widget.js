// Work Trip Dashboard

const CALENDAR_NAME = "Work Schedule"

// Home location
const HOME = {lat:00, lon:00}

const LOCATIONS = {
  locationA: {lat:00, lon:00},
  locationB: {lat:00, lon:00}
}

const NORMAL_SPEED = 50
const HEADWIND_SPEED = 40
const BUFFER = 15

let widget = new ListWidget()
widget.setPadding(20, 20, 20, 20)

// Fetch calendar
let calendars = await Calendar.forEvents()
let calendar = calendars.find(c => c.title === CALENDAR_NAME)

if (!calendar) {
  widget.addText("Calendar not found").textColor = Color.white()
  Script.setWidget(widget)
  Script.complete()
  return
}

// Current time
let now = new Date()

// Events in the next 48 hours
let end = new Date()
end.setDate(end.getDate() + 2)

let events = await CalendarEvent.between(now, end, [calendar])
events = events.filter(e => !e.isAllDay)
events.sort((a, b) => a.startDate - b.startDate)

if (events.length === 0) {
  let t = widget.addText("No service tomorrow")
  t.textColor = Color.white()
  t.font = Font.boldSystemFont(22)
  Script.setWidget(widget)
  Script.complete()
  return
}

let event = events[0]

// Formatter
let df = new DateFormatter()
df.locale = "en-US"
df.dateFormat = "HH:mm"

let serviceStart = df.string(event.startDate)

// Location detection
let text = `${event.title} ${event.location || ""}`.toLowerCase()

let destination = null
let locationName = "Unknown"

if (text.includes("locationA")) {
  destination = LOCATIONS.locationA
  locationName = "Location A"
}

if (text.includes("locationB")) {
  destination = LOCATIONS.locationB
  locationName = "Location B"
}

// If neither locationA nor locationB → stop
if (!destination) {
  let t = widget.addText("No service tomorrow")
  t.textColor = Color.white()
  t.font = Font.boldSystemFont(22)

  Script.setWidget(widget)
  Script.complete()
  return
}

// Route calculation
let distanceKM = "?"
let travelTimeMin = "?"

let url = `https://router.project-osrm.org/route/v1/bicycle/${HOME.lon},${HOME.lat};${destination.lon},${destination.lat}?overview=false`
let req = new Request(url)
let data = await req.loadJSON()

distanceKM = (data.routes[0].distance / 1000).toFixed(1)

// Fetch weather
let weatherReq = new Request(
  `https://api.open-meteo.com/v1/forecast?latitude=${HOME.lat}&longitude=${HOME.lon}&hourly=temperature_2m,apparent_temperature,precipitation,precipitation_probability,windspeed_10m,winddirection_10m,cloudcover&timezone=Europe%2FAmsterdam`
)

let weather = await weatherReq.loadJSON()

let temp = weather.hourly.temperature_2m
let feel = weather.hourly.apparent_temperature
let rain = weather.hourly.precipitation
let rainChance = weather.hourly.precipitation_probability
let wind = weather.hourly.windspeed_10m
let windDir = weather.hourly.winddirection_10m
let cloud = weather.hourly.cloudcover
let times = weather.hourly.time

let temperature = Math.round(temp[0])
let feelTemp = Math.round(feel[0])

// Background color depending on temperature
let gradient = new LinearGradient()

if (temperature <= 5) {
  gradient.colors = [new Color("#1e3a8a"), new Color("#0f172a")]
} else if (temperature <= 15) {
  gradient.colors = [new Color("#0f766e"), new Color("#134e4a")]
} else if (temperature <= 25) {
  gradient.colors = [new Color("#166534"), new Color("#14532d")]
} else if (temperature <= 30) {
  gradient.colors = [new Color("#c2410c"), new Color("#7c2d12")]
} else {
  gradient.colors = [new Color("#991b1b"), new Color("#450a0a")]
}

gradient.locations = [0, 1]
widget.backgroundGradient = gradient

let speed = NORMAL_SPEED
let weatherText = []

// Bearing calculation
function bearing(lat1, lon1, lat2, lon2) {
  let dLon = (lon2 - lon1) * Math.PI / 180

  lat1 = lat1 * Math.PI / 180
  lat2 = lat2 * Math.PI / 180

  let y = Math.sin(dLon) * Math.cos(lat2)
  let x = Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

  let brng = Math.atan2(y, x)

  return (brng * 180 / Math.PI + 360) % 360
}

// Wind arrow
function windArrow(deg) {
  const dirs = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"]
  return dirs[Math.round(deg / 45) % 8]
}

let windArrowSymbol = windArrow(windDir[8])

// Headwind check
let routeDirection = bearing(
  HOME.lat,
  HOME.lon,
  destination.lat,
  destination.lon
)

let difference = Math.abs(routeDirection - windDir[8])

if (difference > 180) difference = 360 - difference

if (difference < 60 && wind[8] > 25) {
  speed = HEADWIND_SPEED
  weatherText.push(`💨🛵 Headwind ${windArrowSymbol}`)
}

// Travel time
travelTimeMin = Math.round((distanceKM / speed) * 60)

// Arrival time
let arrival = new Date(event.startDate.getTime() - BUFFER * 60000)
let departureTime = new Date(arrival.getTime() - travelTimeMin * 60000)

// Rain check
let rainDuringTravel = false
let cloudy = false

for (let i = 0; i < times.length; i++) {
  let time = new Date(times[i])

  if (time >= departureTime && time <= arrival) {
    if (rain[i] > 0.5 || rainChance[i] > 50) {
      rainDuringTravel = true
    }

    if (cloud[i] > 70) {
      cloudy = true
    }
  }
}

if (rainDuringTravel) {
  weatherText.push("🌧️ Rain during ride")
  travelTimeMin += 2
}

if (cloudy && !rainDuringTravel) {
  weatherText.push("☁️ Cloudy")
}

// Final departure time
departureTime = new Date(arrival.getTime() - travelTimeMin * 60000)
let departure = df.string(departureTime)

// Title
let titleText = "Work Trip"

let today = new Date()
today.setHours(0, 0, 0, 0)

let tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

if (event.startDate >= today && event.startDate < tomorrow) {
  titleText = "Work Trip Today"
} else if (event.startDate >= tomorrow) {
  titleText = "Work Trip Tomorrow"
}

let title = widget.addText(titleText)
title.font = Font.boldSystemFont(22)
title.textColor = Color.white()

widget.addSpacer(10)

let locationText = widget.addText(`📍 ${locationName}`)
locationText.textColor = Color.white()
locationText.font = Font.mediumSystemFont(18)

widget.addText(`🕒 Service: ${serviceStart}`).textColor = Color.white()
widget.addText(`🎯 Arrival: ${df.string(arrival)}`).textColor = Color.white()

widget.addSpacer(6)

widget.addText(`🌡️ ${temperature}°C (feels like ${feelTemp}°C)`).textColor = Color.white()

widget.addSpacer(6)

widget.addText(`🚲 Route: ${distanceKM} km`).textColor = Color.white()
widget.addText(`🛵 Travel Time: ${travelTimeMin} min`).textColor = Color.white()

widget.addSpacer(6)

if (weatherText.length > 0) {
  widget.addText(weatherText.join("   ")).textColor = Color.white()
}

widget.addSpacer(10)

let departureText = widget.addText(`🏁 Departure ${departure}`)
departureText.font = Font.boldSystemFont(26)
departureText.textColor = new Color("#7dd3fc")

Script.setWidget(widget)
Script.complete()
