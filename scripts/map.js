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

var streets = L.tileLayer(mbUrl, {
        id: 'mapbox.streets',
        attribution: mbAttr
    }),
    osm = L.tileLayer(osmUrl, {
        attribution: osmAttr
    });

// Styles
var recycleMarkerSymbol = L.AwesomeMarkers.icon({
        icon: ' fa fa-recycle',
        prefix: 'fa',
        color: 'green',
        iconColor: 'white'
    }),
    recycleGlassMarkerSymbol = L.AwesomeMarkers.icon({
        icon: ' fa fa-recycle',
        prefix: 'fa',
        color: 'blue',
        iconColor: 'white'
    }),
    hereMarkerSymbol = L.AwesomeMarkers.icon({
        icon: ' fa fa-female',
        prefix: 'fa',
        color: 'darkpurple',
        iconColor: 'white'
    });

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
    var radius = e.accuracy / 2,
        myPosition = e.latlng;
    L.marker(myPosition, {
            icon: hereMarkerSymbol
        }).addTo(mymap)
        .bindPopup("Vous êtes ici ! (à " + Math.round(radius) + " mètres près)").openPopup();
    L.circle(myPosition, radius).addTo(mymap);
    getProximityData(myPosition);
}

function onLocationError(e) {
    alert("Il y a eu un problème avec la géolocalisation ! Vérifiez les paramètres de votre navigateur. ", e.message);
}

mymap.on('locationfound', onLocationFound);
mymap.on('locationerror', onLocationError);
mymap.locate({
    setView: true,
    maxZoom: 16
}).setMaxBounds(bounds);
mymap.options.minZoom = 12;

function getProximityData(myPosition) {
    var dataUrl = 'https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=recup-verre&geofilter.distance=' + myPosition.lat +  ',' + myPosition.lng + ',1500&rows=100';
    openDataRecupVerre = [dataUrl, "Points de collecte Verre", ["Adresse", "dmt_type"]];
    myXHRSender(openDataRecupVerre);
}

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
// Adding data
var addingData = function (layerToAdd, layerNameToAdd) {
    mymap.addLayer(layerToAdd);
    lcontrol.addOverlay(layerToAdd, layerNameToAdd);
};

//--------------------------------------------------------------------------------------------//
//------------------------------------OPEN DATA FUNCTIONS-------------------------------------//
//Go searching for openData from Toulouse Metropole
var fromPointFeatureToLayer = function (featuresCreated, openDataName, openDataProperties) {
    var myData = L.geoJson(
        featuresCreated, {
            pointToLayer: function (feature, latlng) {
                if (feature.properties.dmt_type === "Verre") {
                    return new L.marker((latlng), {
                        icon: recycleGlassMarkerSymbol
                    });
                } else {
                    return new L.marker((latlng), {
                        icon: recycleMarkerSymbol
                    });                    
                }
            },
            onEachFeature: function (feature, layer) {
                var featureAttributes = "",
                    prop, attr;
                for (prop in openDataProperties) {
                    for (attr in feature.properties) {
                        if (typeof (feature.properties[attr]) !== "object" && attr === openDataProperties[prop].toLowerCase()) {
                            featureAttributes += openDataProperties[prop] + " : " + feature.properties[attr] + "<br />";
                        }
                    }
                }
                layer.bindPopup(featureAttributes);
            }
        }
    );
    addingData(myData, openDataName);
};

var fromFeatureToFeatureType = function (featuresCreated, typeOfGeomArray, openDataName, openDataProperties) {
    console.log("Datas to display: ", featuresCreated, typeOfGeomArray, openDataName, openDataProperties);
    if (typeOfGeomArray.length !== 1) {
        console.log("Il y a un problème avec le type de géométrie");
    } else {
        if (typeOfGeomArray[0] === "Point" || typeOfGeomArray[0] === "MultiPoint") {
            fromPointFeatureToLayer(featuresCreated, openDataName, openDataProperties);
        } else {
            console.log("Il y a un problème avec le type de géométrie");
        }
    }
};

var FeatureConstructor = function (geometry, properties) {
    this.geometry = geometry;
    this.properties = properties;
    this.type = "Feature";
};

var fromXhrToFeature = function (myResponse, openDataName, openDataProperties) {
    var i,
        typeOfGeomArray = [],
        featuresCreated = {
            "type": "FeatureCollection",
            "features": []
        };
    for (i = 0; i < myResponse.records.length; i += 1) {
        var typeOfGeom = myResponse.records[i].fields.geo_shape.type,
            theGeom = myResponse.records[i].fields.geo_shape.coordinates,
            featureObject = new FeatureConstructor({
                    type: typeOfGeom,
                    coordinates: theGeom
                },
                myResponse.records[i].fields
            );
        if (typeOfGeomArray.indexOf(typeOfGeom) === -1) {
            typeOfGeomArray.push(typeOfGeom);
        }
        featuresCreated.features.push(featureObject);
    }
    fromFeatureToFeatureType(featuresCreated, typeOfGeomArray, openDataName, openDataProperties);
};

var myXHRSender = function (openData) {
    var openDataLink = openData[0],
        openDataName = openData[1],
        openDataProperties = openData[2],
        openDataXHR = new XMLHttpRequest();
    openDataXHR.open('GET', openDataLink);
    openDataXHR.send(null);
    openDataXHR.addEventListener('readystatechange', function () {
        if (openDataXHR.readyState === XMLHttpRequest.DONE) {
            if (openDataXHR.status === 200) {
                var myResponse = JSON.parse(openDataXHR.responseText);
                fromXhrToFeature(myResponse, openDataName, openDataProperties);
            } else {
                console.log("openDataXHR ", openDataXHR.statusText);
            }
        }
    });
};

var openDataRecupEmbal = [
    'https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=recup-emballage&geofilter.distance=43.60281%2C1.44736%2C2000&rows=100',
    "Points de collecte Carton / Plastique", ["Adresse", "dmt_type"]
];
myXHRSender(openDataRecupEmbal);