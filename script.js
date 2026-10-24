/*
Copyright (c) 2026 Bisan Subba.
All rights reserved.
Bsun Sat-Nav — GPS Tracking Engine
*/

"use strict";

// ========================================
// ELEMENT REFERENCES
// ========================================

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");

const gpsStatus = document.getElementById("gpsStatus");

const latitudeElement = document.getElementById("latitude");
const longitudeElement = document.getElementById("longitude");
const accuracyElement = document.getElementById("accuracy");
const speedElement = document.getElementById("speed");
const headingElement = document.getElementById("heading");
const lastUpdateElement = document.getElementById("lastUpdate");


// ========================================
// GPS VARIABLES
// ========================================

let watchId = null;
let isTracking = false;
let hasReceivedPosition = false;
let trackingGeneration = 0;


// ========================================
// UPDATE GPS STATUS
// ========================================

function updateStatus(message, statusClass) {

    gpsStatus.textContent = message;

    gpsStatus.className =
        "status " + statusClass;

}


// ========================================
// UPDATE BUTTONS
// ========================================

function updateButtons() {

    startBtn.disabled = isTracking;

    stopBtn.disabled = !isTracking;

}


// ========================================
// FORMAT NUMBERS
// ========================================

function formatCoordinate(value) {

    if (!Number.isFinite(value)) {
        return "—";
    }

    return value.toFixed(6);

}


// ========================================
// GPS SUCCESS CALLBACK
// ========================================

function handlePosition(position) {

    const coords = position.coords;
    
    // Update the interactive map with GPS coordinates
updateMapLocation(
    coords.latitude,
    coords.longitude,
    coords.accuracy
);

// Enable routing once GPS and destination are available
updateRouteButton();

    hasReceivedPosition = true;

    // Latitude
    latitudeElement.textContent =
        formatCoordinate(coords.latitude);

    // Longitude
    longitudeElement.textContent =
        formatCoordinate(coords.longitude);

    // Accuracy in metres
    accuracyElement.textContent =
        Number.isFinite(coords.accuracy)
            ? coords.accuracy.toFixed(1) + " m"
            : "Unavailable";

    // Speed: metres/second to mph
    if (
        coords.speed !== null &&
        Number.isFinite(coords.speed) &&
        coords.speed >= 0
    ) {

        const speedMPH =
            coords.speed * 2.2369362921;

        speedElement.textContent =
            speedMPH.toFixed(1) + " mph";

    } else {

        speedElement.textContent =
            "Unavailable";

    }

    // ========================================
// BSUN SAT-NAV — GPS HEADING
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
// ========================================
// GPS heading and speed diagnostic
console.log("GPS heading:", coords.heading);
console.log("GPS speed:", coords.speed);

// Heading
// Heading
latestHeading =
    coords.heading !== null &&
    Number.isFinite(coords.heading)
        ? coords.heading
        : null;

if (latestHeading !== null) {

    headingElement.textContent =
        coords.heading.toFixed(0) + "°";

    // Rotate the vehicle arrow
    if (locationMarker) {

        const vehicleArrow =
            locationMarker.getElement()
                ?.querySelector(".vehicle-arrow");

        if (vehicleArrow) {

            // Keep the vehicle arrow aligned with the map camera.
const cameraBearing = map ? map.getBearing() : 0;

vehicleArrow.style.transform =
    `rotate(${coords.heading - cameraBearing}deg)`;

        }
    }

} else {

    headingElement.textContent =
        "Unavailable";

}

    // Last GPS update
    lastUpdateElement.textContent =
        new Date(position.timestamp)
            .toLocaleTimeString("en-GB");

    // GPS status
    updateStatus(
        "GPS location received",
        "active"
    );

}


// ========================================
// GPS ERROR CALLBACK
// ========================================

function handleError(error) {

    let message = "GPS error";

    switch (error.code) {

        case 1:
            message = "Location permission denied";
            break;

        case 2:
            message = "Location unavailable";
            break;

        case 3:
            message = "GPS request timed out";
            break;

        default:
            message = "Unknown GPS error";
    }

    updateStatus(message, "inactive");

    if (error.code === 1) {
        stopTracking(false);
    }

}


// ========================================
// START GPS TRACKING
// ========================================

function startTracking() {

    if (isTracking) {
        return;
    }

    // Check secure context
    if (!window.isSecureContext) {

        updateStatus(
            "HTTPS or localhost required",
            "inactive"
        );

        return;
    }

    // Check browser support
    if (!("geolocation" in navigator)) {

        updateStatus(
            "Geolocation not supported",
            "inactive"
        );

        return;
    }

    isTracking = true;
    hasReceivedPosition = false;

    trackingGeneration++;

    const currentGeneration =
        trackingGeneration;

    updateButtons();

    updateStatus(
        "Waiting for GPS location...",
        "pending"
    );

    // Start continuous GPS tracking
    watchId = navigator.geolocation.watchPosition(

        function(position) {

            if (
                !isTracking ||
                currentGeneration !== trackingGeneration
            ) {
                return;
            }

            handlePosition(position);

        },

        function(error) {

            if (
                !isTracking ||
                currentGeneration !== trackingGeneration
            ) {
                return;
            }

            handleError(error);

        },

        {
            enableHighAccuracy: true,

            maximumAge: 0,

            timeout: 15000
        }

    );

}


// ========================================
// STOP GPS TRACKING
// ========================================

function stopTracking(showMessage = true) {

    trackingGeneration++;

    isTracking = false;

    if (watchId !== null) {

        navigator.geolocation.clearWatch(watchId);

        watchId = null;

    }

    updateButtons();

    if (showMessage) {

        updateStatus(
            "Tracking stopped",
            "inactive"
        );

    }

}


// ========================================
// CLEAR GPS READINGS
// ========================================

function clearReadings() {

    latitudeElement.textContent = "—";
    longitudeElement.textContent = "—";
    accuracyElement.textContent = "—";
    speedElement.textContent = "—";
    headingElement.textContent = "—";
    lastUpdateElement.textContent = "—";

    if (isTracking) {

        updateStatus(
            "Waiting for next GPS update...",
            "pending"
        );

    } else {

        updateStatus(
            "Not tracking",
            "inactive"
        );

    }

}


// ========================================
// EVENT LISTENERS
// ========================================

startBtn.addEventListener(
    "click",
    startTracking
);

stopBtn.addEventListener(
    "click",
    () => stopTracking()
);

clearBtn.addEventListener(
    "click",
    clearReadings
);


// ========================================
// PAGE CLEANUP
// ========================================

window.addEventListener(
    "pagehide",
    () => {

        if (isTracking) {
            stopTracking(false);
        }

    }
);


// ========================================
// INITIALISE
// ========================================

updateButtons();

updateStatus(
    "Not tracking",
    "inactive"
);

// ========================================
// BSUN SAT-NAV v0.2
// INTERACTIVE MAP ENGINE
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
// ========================================

// Map variables
let map = null;
let locationMarker = null;
let accuracyCircle = null;

let latestLatitude = null;
let latestLongitude = null;
let latestHeading = null;

let firstLocationReceived = false;

// ========================================
// INITIALISE INTERACTIVE MAP
// ========================================

function initialiseMap() {

    if (typeof maplibregl === "undefined") {
    console.error("MapLibre GL JS library not loaded.");
    return;
}

   // ========================================
// MAPLIBRE GL JS - MAP INITIALISATION
// Copyright (c) 2026 Bisan Subba.
// ========================================

// Initial view of the United Kingdom
map = new maplibregl.Map({
    container: "map",

    // Free vector map tiles from OpenFreeMap
    style: "https://tiles.openfreemap.org/styles/liberty",

    center: [-3.0, 54.5],

    zoom: 6,

    // Navigation camera settings
    pitch: 0,
    bearing: 0,

    attributionControl: true
});

// Add zoom and rotation controls
map.addControl(
    new maplibregl.NavigationControl(),
    "top-right"
);
}   


// ========================================
// DISPLAY GPS POSITION ON MAP
// ========================================



// ========================================
// BSUN SAT-NAV v0.7
// MAPLIBRE GPS LOCATION & VEHICLE TRACKING
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
// ========================================

function updateMapLocation(latitude, longitude, accuracy) {

    if (!map) {
        return;
    }

    latestLatitude = latitude;
    latestLongitude = longitude;

    // MapLibre coordinates: [longitude, latitude]
    const location = [longitude, latitude];

    // ========================================
    // VEHICLE NAVIGATION ARROW
    // ========================================

    if (!locationMarker) {

        const vehicleElement = document.createElement("div");
        vehicleElement.className = "vehicle-marker";

        vehicleElement.innerHTML = `
            <div class="vehicle-arrow">
                <svg viewBox="0 0 48 60"
                     width="42"
                     height="52"
                     xmlns="http://www.w3.org/2000/svg"
                     aria-label="Vehicle location">
                    <path
                        d="M24 3 L44 53 L24 42 L4 53 Z"
                        fill="#2563eb"
                        stroke="#ffffff"
                        stroke-width="3"
                        stroke-linejoin="round"
                    />
                </svg>
            </div>
        `;

        locationMarker = new maplibregl.Marker({
            element: vehicleElement,
            anchor: "center"
        })
            .setLngLat(location)
            .setPopup(
                new maplibregl.Popup().setText(
                    "Your approximate location"
                )
            )
            .addTo(map);

    } else {

        locationMarker.setLngLat(location);

    }

    // ========================================
    // GPS ACCURACY CIRCLE
    // ========================================

    // Create a GeoJSON polygon approximating
    // the GPS accuracy radius in metres.

    const radius = Math.max(0, Number(accuracy) || 0);
    const points = [];
    const earthRadius = 6378137;
    const latitudeRadians = latitude * Math.PI / 180;

    for (let i = 0; i <= 64; i++) {

        const angle = (i / 64) * Math.PI * 2;

        const deltaLatitude =
            (radius / earthRadius) *
            Math.cos(angle) *
            (180 / Math.PI);

        const deltaLongitude =
            (radius / earthRadius) *
            Math.sin(angle) *
            (180 / Math.PI) /
            Math.max(0.000001, Math.cos(latitudeRadians));

        points.push([
            longitude + deltaLongitude,
            latitude + deltaLatitude
        ]);
    }

    const accuracyData = {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [points]
        },
        properties: {}
    };

    // Add or update the accuracy overlay once
    // the MapLibre style has finished loading.

    if (map.isStyleLoaded()) {

        const existingSource =
            map.getSource("gps-accuracy");

        if (!existingSource) {

            map.addSource("gps-accuracy", {
                type: "geojson",
                data: accuracyData
            });

            map.addLayer({
                id: "gps-accuracy-fill",
                type: "fill",
                source: "gps-accuracy",
                paint: {
                    "fill-color": "#3b82f6",
                    "fill-opacity": 0.12
                }
            });

            map.addLayer({
                id: "gps-accuracy-outline",
                type: "line",
                source: "gps-accuracy",
                paint: {
                    "line-color": "#3b82f6",
                    "line-width": 1
                }
            });

        } else {

            existingSource.setData(accuracyData);

        }
    }

    // ========================================
    // FIRST GPS READING
    // ========================================

    if (!firstLocationReceived) {

        map.jumpTo({
            center: location,
            zoom: 16
        });

        firstLocationReceived = true;
    }

    // ========================================
    // LIVE GPS FOLLOWING
    // ROAD-AHEAD CAMERA POSITIONING
    // ========================================

    if (navigationActive) {

        Number.isFinite(latestHeading)
    ? latestHeading
    : null;

        const cameraOptions = {
            center: location,
            zoom: 17,
            pitch: 55,
            duration: 500,
            padding: {
                top: 0,
                bottom: Math.round(
                    map.getContainer().clientHeight * 0.40
                ),
                left: 0,
                right: 0
            }
        };

        // Rotate map to vehicle heading when available.
        if (heading !== null) {
            cameraOptions.bearing = heading;
        }

        map.easeTo(cameraOptions);
    }
}
// ========================================
// BSUN SAT-NAV v0.7
// MAPLIBRE CENTRE MAP FUNCTION
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
// ========================================

function centreMapOnLocation() {

    if (
        !map ||
        !Number.isFinite(latestLatitude) ||
        !Number.isFinite(latestLongitude)
    ) {
        return;
    }

    map.easeTo({
        center: [latestLongitude, latestLatitude],
        zoom: 17,
        duration: 500
    });

}

// Connect centre button
document.getElementById("centreMapBtn")
    .addEventListener("click", centreMapOnLocation);


// Initialise map
initialiseMap();

// ========================================
// BSUN SAT-NAV v0.3
// DESTINATION SEARCH
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
// ========================================

// Development-only geocoding endpoint.
// Replace before public production deployment.
const GEOCODING_URL =
    "https://nominatim.openstreetmap.org/search";

const destinationForm =
    document.getElementById("destinationForm");

const destinationInput =
    document.getElementById("destinationInput");

const destinationStatus =
    document.getElementById("destinationStatus");

const destinationResult =
    document.getElementById("destinationResult");

const searchDestinationBtn =
    document.getElementById("searchDestinationBtn");

let destinationMarker = null;

// Cache repeated searches during this browser session.
const destinationCache = new Map();

// Limit requests from this browser instance.
let lastSearchRequestTime = 0;


// ========================================
// SEARCH DESTINATION
// ========================================

async function searchDestination(event) {

    event.preventDefault();

    const query = destinationInput.value.trim();

    if (query.length < 3) {
        destinationStatus.textContent =
            "Please enter at least 3 characters.";
        return;
    }

    if (!map) {
        destinationStatus.textContent =
            "The map is not available.";
        return;
    }

    searchDestinationBtn.disabled = true;

    destinationStatus.textContent =
        "Searching for destination...";

    destinationResult.textContent = "";

    try {

        const cacheKey = query.toLowerCase();

        let place = destinationCache.get(cacheKey);

        if (!place) {

            // Wait if this browser searched recently.
            const elapsed =
                Date.now() - lastSearchRequestTime;

            if (elapsed < 1200) {
                await new Promise(resolve =>
                    setTimeout(resolve, 1200 - elapsed)
                );
            }

            lastSearchRequestTime = Date.now();

            const url = new URL(GEOCODING_URL);

            url.searchParams.set("q", query);
            url.searchParams.set("format", "jsonv2");
            url.searchParams.set("limit", "1");

            const response = await fetch(url.toString(), {
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(
                    "Search service unavailable: " +
                    response.status
                );
            }

            const results = await response.json();

            if (!Array.isArray(results) ||
                results.length === 0) {

                destinationStatus.textContent =
                    "Destination not found. Try a more specific name.";

                return;
            }

            place = results[0];

            destinationCache.set(cacheKey, place);
        }

        const latitude = Number(place.lat);
        const longitude = Number(place.lon);

        if (!Number.isFinite(latitude) ||
            !Number.isFinite(longitude)) {

            throw new Error(
                "Invalid destination coordinates."
            );
        }

        const destinationCoordinates = [
            
            longitude,
            latitude
            
        ];

        // Store the destination for driving route calculation
selectedDestination = {
    latitude,
    longitude
};

clearDisplayedRoute();

updateRouteButton();

        // Remove previous destination marker.
        // ========================================
// BSUN SAT-NAV v0.7
// MAPLIBRE DESTINATION MARKER
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
// ========================================

// Remove previous destination marker.
if (destinationMarker) {
    destinationMarker.remove();
}

// Create MapLibre destination marker.
destinationMarker = new maplibregl.Marker({
    color: "#ef4444"
})
    .setLngLat(destinationCoordinates)
    .setPopup(
        new maplibregl.Popup().setText("📍 Destination")
    )
    .addTo(map);

// Display destination popup.
destinationMarker.togglePopup();

// Zoom to destination.
map.flyTo({
    center: destinationCoordinates,
    zoom: 14
});

        destinationStatus.textContent =
            "Destination found successfully.";

        destinationResult.textContent =
            place.display_name || query;

    } catch (error) {

        console.error(
            "Destination search error:",
            error
        );

        destinationStatus.textContent =
            "Unable to search right now. Please try again later.";

    } finally {

        searchDestinationBtn.disabled = false;

    }
}


// ========================================
// SEARCH BUTTON EVENT
// ========================================

destinationForm.addEventListener(
    "submit",
    searchDestination
);

// ========================================
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
//
// BSUN SAT-NAV v0.4
// DRIVING ROUTE ENGINE
// ========================================

// Development/testing only.
// Public OSRM demonstration server.
const ROUTING_URL = "https://router.project-osrm.org/route/v1/driving/";

const showRouteBtn =
    document.getElementById("showRouteBtn");

const routeStatus =
    document.getElementById("routeStatus");

const routeResults =
    document.getElementById("routeResults");

const routeDistance =
    document.getElementById("routeDistance");

const routeDuration =
    document.getElementById("routeDuration");

    // ========================================
// BSUN SAT-NAV v0.5
// NAVIGATION BUTTON REFERENCES
// ========================================

const goBtn = document.getElementById("goBtn");

const stopNavigationBtn =
    document.getElementById("stopNavigationBtn");

const navigationStatus =
    document.getElementById("navigationStatus");

let navigationActive = false;
let routeReady = false;

let selectedDestination = null;

let displayedRoute = null;

let routeRequestId = 0;

// ========================================
// BSUN SAT-NAV v0.5
// TURN-BY-TURN NAVIGATION DATA
// ========================================

let navigationSteps = [];

// ========================================
// UPDATE SHOW ROUTE BUTTON
// ========================================

function updateRouteButton() {

    const hasLocation =
        Number.isFinite(latestLatitude) &&
        Number.isFinite(latestLongitude);

    const hasDestination =
        selectedDestination !== null;

    showRouteBtn.disabled =
        !hasLocation || !hasDestination;
}


// ========================================
// CLEAR EXISTING ROUTE
// ========================================

function clearDisplayedRoute() {

      routeReady = false;
    navigationActive = false;

    navigationSteps = [];

document.getElementById("nextTurn").textContent =
    "Next turn: —";

document.getElementById("remainingDistance").textContent =
    "Remaining distance: —";

    goBtn.disabled = true;
    stopNavigationBtn.disabled = true;

    navigationStatus.textContent =
        "Calculate a driving route to begin navigation.";  

    routeRequestId++;

    // Remove the MapLibre route layer and source.
if (map) {

    if (map.getLayer("driving-route")) {
        map.removeLayer("driving-route");
    }

    if (map.getSource("driving-route")) {
        map.removeSource("driving-route");
    }
}

displayedRoute = null;

    routeResults.hidden = true;

    routeDistance.textContent = "—";
    routeDuration.textContent = "—";

    routeStatus.textContent =
        "Ready to calculate a driving route.";
}


// ========================================
// FORMAT JOURNEY DURATION
// ========================================

function formatJourneyDuration(seconds) {

    const totalMinutes = Math.round(seconds / 60);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return `${minutes} min`;
    }

    return `${hours} hr ${minutes} min`;
}


// ========================================
// CALCULATE DRIVING ROUTE
// ========================================

async function calculateDrivingRoute() {

    if (
        !selectedDestination ||
        !Number.isFinite(latestLatitude) ||
        !Number.isFinite(latestLongitude)
    ) {
        routeStatus.textContent =
            "Start GPS tracking and search for a destination first.";
        return;
    }

    const requestId = ++routeRequestId;

    const startLatitude = latestLatitude;
    const startLongitude = latestLongitude;

    const endLatitude = selectedDestination.latitude;
    const endLongitude = selectedDestination.longitude;

    showRouteBtn.disabled = true;

    routeStatus.textContent =
        "Calculating driving route...";

    routeResults.hidden = true;

    try {

        // OSRM expects longitude,latitude pairs.
        const coordinates =
            `${startLongitude},${startLatitude};` +
            `${endLongitude},${endLatitude}`;

        const url =
    ROUTING_URL +
    coordinates +
    "?overview=full&geometries=geojson&steps=true";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Routing service returned ${response.status}`
            );
        }

        const data = await response.json();

        if (requestId !== routeRequestId) {
            return;
        }

        if (
            data.code !== "Ok" ||
            !Array.isArray(data.routes) ||
            data.routes.length === 0
        ) {
            routeStatus.textContent =
                "No driving route was found.";
            return;
        }

        const route = data.routes[0];

        // Extract driving manoeuvres from OSRM
navigationSteps = [];

if (Array.isArray(route.legs)) {

    route.legs.forEach(leg => {

        if (Array.isArray(leg.steps)) {

            navigationSteps.push(...leg.steps);

        }

    });

}

        if (
            !route.geometry ||
            !Array.isArray(route.geometry.coordinates)
        ) {
            throw new Error("Invalid route geometry.");
        }

        // Wait for MapLibre's map style to finish loading.
if (!map.isStyleLoaded()) {
    await new Promise(resolve => {
        map.once("load", resolve);
    });
}

// Stop if this route request has been cancelled.
if (requestId !== routeRequestId) {
    return;
}

        // GeoJSON coordinates are longitude,latitude.
        // ========================================
// BSUN SAT-NAV v0.7
// MAPLIBRE DRIVING ROUTE
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
// ========================================

// OSRM already provides longitude, latitude coordinates.
const routePoints = route.geometry.coordinates;

// Remove the previous route layer and source.
if (map.getLayer("driving-route")) {
    map.removeLayer("driving-route");
}

if (map.getSource("driving-route")) {
    map.removeSource("driving-route");
}

// Create the route GeoJSON source.
map.addSource("driving-route", {
    type: "geojson",
    data: {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: routePoints
        },
        properties: {}
    }
});

// Display the blue driving route.
map.addLayer({
    id: "driving-route",
    type: "line",
    source: "driving-route",
    layout: {
        "line-join": "round",
        "line-cap": "round"
    },
    paint: {
        "line-color": "#2563eb",
        "line-width": 6,
        "line-opacity": 0.9
    }
});

displayedRoute = "driving-route";

// Calculate route boundaries.
const bounds = new maplibregl.LngLatBounds();

routePoints.forEach(coordinate => {
    bounds.extend(coordinate);
});

// Fit the entire route onto the map.
map.fitBounds(bounds, {
    padding: 35,
    duration: 1000
});
        // Convert metres to miles.
        const miles = route.distance / 1609.344;

        routeDistance.textContent =
            miles.toFixed(1) + " miles";

        routeDuration.textContent =
            formatJourneyDuration(route.duration);

        routeResults.hidden = false;

        routeStatus.textContent =
            "Driving route calculated successfully.";

                // Enable GO after successful route calculation
    routeReady = true;

    goBtn.disabled = false;

    navigationStatus.textContent =
        "Route ready. Press GO to start navigation.";

    } catch (error) {

        if (requestId !== routeRequestId) {
            return;
        }

        console.error(
            "Driving route error:",
            error
        );

        routeStatus.textContent =
            "Unable to calculate the route. Please try again later.";

    } finally {

        if (requestId === routeRequestId) {
            updateRouteButton();
        }

    }
}


// ========================================
// SHOW ROUTE BUTTON
// ========================================

showRouteBtn.addEventListener(
    "click",
    calculateDrivingRoute
);

updateRouteButton();

// ========================================
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
//
// BSUN SAT-NAV v0.5
// BASIC NAVIGATION MODE
// ========================================

// START NAVIGATION
goBtn.addEventListener("click", () => {

    if (!routeReady || navigationActive) {
        return;
    }

   // ========================================
// BSUN SAT-NAV v0.6.3
// ROAD-AHEAD NAVIGATION VIEW
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
// ========================================

navigationActive = true;

// Activate dedicated navigation layout
document.body.classList.add("navigation-mode");

goBtn.disabled = true;
stopNavigationBtn.disabled = false;
// ========================================
// BSUN SAT-NAV v0.7
// MAPLIBRE PERSPECTIVE NAVIGATION CAMERA
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
// ========================================

requestAnimationFrame(() => {

    if (
        !map ||
        !Number.isFinite(latestLatitude) ||
        !Number.isFinite(latestLongitude)
    ) {
        return;
    }

    map.resize();

    const vehicleLocation = [
        latestLongitude,
        latestLatitude
    ];

    const cameraOptions = {
        center: vehicleLocation,
        zoom: 17,
        pitch: 55,
        padding: {
            top: 0,
            bottom: Math.round(
                map.getContainer().clientHeight * 0.40
            ),
            left: 0,
            right: 0
        },
        duration: 800
    };

    if (Number.isFinite(latestHeading)) {
        cameraOptions.bearing = latestHeading;
    }

    map.easeTo(cameraOptions);

});




    navigationStatus.textContent =
    "Navigation mode started.";

const nextTurnElement =
    document.getElementById("nextTurn");

const remainingDistanceElement =
    document.getElementById("remainingDistance");

if (navigationSteps.length > 0) {

    const firstStep = navigationSteps[0];

    const manoeuvre = firstStep.maneuver || {};

    const roadName = firstStep.name || "unnamed road";

    const turnType = manoeuvre.type || "continue";

    const turnDirection = manoeuvre.modifier || "";

    const instruction =
        turnType === "depart"
            ? `Depart onto ${roadName}`
            : `${turnType} ${turnDirection} onto ${roadName}`;

    nextTurnElement.textContent =
        "Next turn: " + instruction;

    remainingDistanceElement.textContent =
        "Step distance: " +
        (firstStep.distance / 1609.344).toFixed(2) +
        " miles";

} else {

    nextTurnElement.textContent =
        "Next turn: No instructions available.";

}

});

// ========================================
// BSUN SAT-NAV — STOP NAVIGATION FIX
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
// ========================================

// STOP NAVIGATION
stopNavigationBtn.addEventListener("click", () => {

    navigationActive = false;

    // Restore the normal application layout
    document.body.classList.remove("navigation-mode");

    goBtn.disabled = !routeReady;
    stopNavigationBtn.disabled = true;

    navigationStatus.textContent =
        "Navigation stopped.";

    // Restore the normal MapLibre camera and layout.
requestAnimationFrame(() => {
    if (map) {
        map.resize();

        map.easeTo({
            pitch: 0,
            bearing: 0,
            padding: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            },
            duration: 500
        });
    }
});
});
// ========================================
// Copyright (c) 2026 Bisan Subba.
// All rights reserved.
// BSUN SAT-NAV v0.7
// MOBILE SCREEN ROTATION FIX
// ========================================

// Refresh MapLibre after the browser viewport changes.
let mapResizeTimer = null;

window.addEventListener("resize", () => {

    clearTimeout(mapResizeTimer);

    mapResizeTimer = setTimeout(() => {

        if (!map) {
            return;
        }

        map.resize();

    }, 300);

});
