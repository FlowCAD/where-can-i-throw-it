//--------------------------------------------------------------------------------------------//
//--------------------------------------DATA DEFINITIONS--------------------------------------//
// Map's properties
var mymap = L.map('mapId');

// Map's bounds
var northEastBound = L.latLng(43.68, 1.68),
    southWestBound = L.latLng(43.52, 1.21),
    bounds = L.latLngBounds(northEastBound, southWestBound);

// Background layers
var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
'Imagery © <a href="http://mapbox.com">Mapbox</a>',
mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZmxvcmlhbmNhZG96IiwiYSI6ImNqMGkzN3ZzYzAwM3MzMm80MDZ6eGQ2bmwifQ.BMmvDcBnXoWT8waOnIKNBg',
osmAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

var streets = L.tileLayer(mbUrl, {id: 'mapbox.streets', attribution: mbAttr}),
    osm = L.tileLayer(osmUrl, {attribution: osmAttr});

// Styles
var alertMarkerSymbol = L.AwesomeMarkers.icon({icon: ' fa fa-exclamation', prefix: 'fa', color: 'orange', iconColor: 'white'}),
homeMarkerSymbol = L.AwesomeMarkers.icon({icon: ' fa fa-home', prefix: 'fa', color: 'green', iconColor: 'white'}),
hereMarkerSymbol = L.AwesomeMarkers.icon({icon: ' fa fa-street-view', prefix: 'fa', color: 'orange', iconColor: 'white'});

//--------------------------------------------------------------------------------------------//
//-------------------------------------MAP INITIALIZATION-------------------------------------//
var initParam = function () {
    osm.addTo(mymap);
    streets.addTo(mymap);
};

mymap.on("load", function () {
    initParam();
});

//--------------------------------------------------------------------------------------------//
//---------------------------------------MAP PROPERTIES---------------------------------------//
// Geolocation of the user and initialization of the map view
function onLocationFound(e) {
    var radius = e.accuracy / 2;
    L.marker(e.latlng, {icon: hereMarkerSymbol}).addTo(mymap)
        .bindPopup("Vous êtes ici ! (à " + Math.round(radius) + " mètres près)").openPopup();
    L.circle(e.latlng, radius).addTo(mymap);
}

function onLocationError(e) {
    alert("Il y a eu un problème avec la géolocalisation ! Vérifiez les paramètres de votre navigateur. ", e.message);
}

mymap.on('locationfound', onLocationFound);
mymap.on('locationerror', onLocationError);
mymap.locate({setView: true, maxZoom: 16}).setMaxBounds(bounds);
mymap.options.minZoom = 12;

// Basemaps for control
var baseMaps = {
    "OpenStreetMap": osm,
    "Plan": streets
};

// Layers for control
var overlayMaps = {};

// Controler
var lcontrol = L.control.layers(baseMaps, overlayMaps).addTo(mymap);

//--------------------------------------------------------------------------------------------//
//--------------------------------------OTHER FUNCTIONS---------------------------------------//
// Removing data
var removeData = function (layerToRemove) {
    mymap.removeLayer(layerToRemove);
    lcontrol.removeLayer(layerToRemove);
};

// Adding data
var addingData = function (layerToAdd, layerNameToAdd) {
    mymap.addLayer(layerToAdd);
    lcontrol.addOverlay(layerToAdd, layerNameToAdd);
};