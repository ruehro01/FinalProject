///////////////////////////////////////////////////////////////////////
//function to instantiate the Leaflet map
var map, featuresLayer;
function createMap() {
    map = L.map('map', {
        center: [39, -105],
        zoom: 4,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
    });

    //configure basemap selector
    var layer = L.esri.basemapLayer('Topographic').addTo(map);
    var layerLabels;

    function setBasemap(basemap) {
        if (layer) {
            map.removeLayer(layer);
        }

        layer = L.esri.basemapLayer(basemap);

        map.addLayer(layer);

        if (layerLabels) {
            map.removeLayer(layerLabels);
        }

        if (
            basemap === 'ShadedRelief' ||
            basemap === 'Oceans' ||
            basemap === 'Gray' ||
            basemap === 'DarkGray' ||
            basemap === 'Terrain'
        ) {
            layerLabels = L.esri.basemapLayer(basemap + 'Labels');
            map.addLayer(layerLabels);
        } else if (basemap.includes('Imagery')) {
            layerLabels = L.esri.basemapLayer('ImageryLabels');
            map.addLayer(layerLabels);
        }
    }

    document
        .querySelector('#basemaps')
        .addEventListener('change', function (e) {
            var basemap = e.target.value;
            setBasemap(basemap);
        });

    //create panning buttons in top right corner of map
    var panControl = L.control.pan({ position: 'topright' });

    panControl.addTo(map);

    //create zoom and home buttons in top right corner of map
    var zoomHome = L.Control.zoomHome({ position: 'topright' });
    L.Control.zoomHome({
        center: [39, -105],
        zoom: 4,
        minZoom: 2,
        maxZoom: 18,
    })
    zoomHome.addTo(map);

    //create dynamic scale bars in bottom right corner of map
    var scale = L.control.scale({ position: 'bottomleft' });
    scale.addTo(map);

     //create legend in bottom right corner of map    
    var legend = L.control({ position: "bottomright" });

    legend.onAdd = function(map) {
      var div = L.DomUtil.create("div", "legend");
      div.innerHTML += "<h4>Legend</h4>";
      div.innerHTML += '<i style="background: #ffa500"></i><span>Wildfire footprint</span><br>';

      return div;
    };

    legend.addTo(map);
    
    //call getData function
    getData(map);
};



//style polygons for display in map
function polygonStyle() {
    return {
        fillColor: "#ffa500",
        color: "#b84700",
        weight: 0.8,
        opacity: 1,
        fillOpacity: 0.6
    }
}

function createPropSymbols(data, map) {
    //create a Leaflet GeoJSON layer and add it to the map
    featuresLayer = new L.geoJson(data, {
        style: polygonStyle,
        onEachFeature: onEachFeature,
        pointToLayer: function (feature, latlng) {
            return pointToLayer(feature, latlng);
        }
    }).addTo(map);
};

function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.State) {
        //access feature properties
        var props = layer.feature.properties;

        //add state to popup content string
        var popupContent = "<p><b>State:</b> " + props.State + "</p>";
        popupContent += "<p><b>Fire name:</b> " + props.FIRE_NAME + "</p>";
        popupContent += "<p><b>Date of ignition:</b> " + props.STARTMONTH + "/" + props.STARTDAY + "/" + props.YEAR + "</p>";
        popupContent += "<p><b>Total acreage burned:</b> " + props.ACRES + " acres</p>";

        layer.bindPopup(popupContent);
    }
}

function createSequenceControls(map) {
    //create slider
    $('#panel').append('<input class="range-slider" type="range">');
    $('#panel').append('<button class="skip" id="reverse">Reverse</button>');
    $('#panel').append('<button class="skip" id="forward">Forward</button>');
    //Click listener for buttons
    $('.skip').click(function () {
        //get the old index value
        currentDecadeValue = parseInt($('.range-slider').val());
        if ($(this).attr('id') == 'forward') {
            //Part of slider loop
            currentDecadeValue += 10;
            currentDecadeValue = currentDecadeValue > maxDecade ? minDecade - 10 : currentDecadeValue;

        } else if ($(this).attr('id') == 'reverse') {
            //Part of slider loop
            currentDecadeValue -= 10;
            currentDecadeValue = currentDecadeValue < minDecade - 10 ? maxDecade : currentDecadeValue;
        };

        if (currentDecadeValue === minDecade - 10) {
            $('#selDecade').val("");
        }
        else {
            $('#selDecade').val(currentDecadeValue.toString());
        }

        updatePropSymbols(map);

        $('.range-slider').val(currentDecadeValue);

    });

    //set slider attributes
    $('.range-slider').attr({
        max: maxDecade,
        min: minDecade - 10,
        value: minDecade - 10,
        step: 10
    });
};

function updatePropSymbols(map) {
    let object = getFilteredData();
    createPropSymbols(object.filterData, map);
}

function getFilteredData() {

    map.eachLayer(function (layer) {
        if (!layer._container)
            map.removeLayer(layer);
    });

    let state = $('#selState').val();
    let decade = $('#selDecade').val();
    let acreage = $('#selAcreage').val();

    let returnObject = { filterData: [], Lat: '', Lng: '' };

    for (let feature of jsonData.features) {
        let property = feature.properties;
        if (state === "" && decade === "" && acreage === "") {
            returnObject.filterData.push(feature);
            if (returnObject.Lat === '' && returnObject.Lng === '') {
                returnObject.Lat = feature.geometry.coordinates[0][0][0];
                returnObject.Lng = feature.geometry.coordinates[0][0][1];
            }
        }
        else if (state !== "" && decade !== "" && acreage !== "") {
            if (property['State'] === state && property['Decade'] === parseInt(decade) && property['ACRES'] >= parseInt(acreage)) {
                returnObject.filterData.push(feature);
                if (returnObject.Lat === '' && returnObject.Lng === '') {
                    returnObject.Lat = feature.geometry.coordinates[0][0][0];
                    returnObject.Lng = feature.geometry.coordinates[0][0][1];
                }
            }
        }
        else if (state !== "" && decade !== "") {
            if (property['State'] === state && property['Decade'] === parseInt(decade)) {
                returnObject.filterData.push(feature);
                if (returnObject.Lat === '' && returnObject.Lng === '') {
                    returnObject.Lat = feature.geometry.coordinates[0][0][0];
                    returnObject.Lng = feature.geometry.coordinates[0][0][1];
                }
            }
        }
        else if (state !== "" && acreage !== "") {
            if (property['State'] === state && property['ACRES'] >= parseInt(acreage)) {
                returnObject.filterData.push(feature);
                if (returnObject.Lat === '' && returnObject.Lng === '') {
                    returnObject.Lat = feature.geometry.coordinates[0][0][0];
                    returnObject.Lng = feature.geometry.coordinates[0][0][1];
                }
            }
        }
        else if (decade !== "" && acreage !== "") {
            if (property['Decade'] === parseInt(decade) && property['ACRES'] >= parseInt(acreage)) {
                returnObject.filterData.push(feature);
                if (returnObject.Lat === '' && returnObject.Lng === '') {
                    returnObject.Lat = feature.geometry.coordinates[0][0][0];
                    returnObject.Lng = feature.geometry.coordinates[0][0][1];
                }
            }
        }
        else if (state !== "") {
            if (property['State'] === state) {
                returnObject.filterData.push(feature);
                if (returnObject.Lat === '' && returnObject.Lng === '') {
                    returnObject.Lat = feature.geometry.coordinates[0][0][0];
                    returnObject.Lng = feature.geometry.coordinates[0][0][1];
                }
            }
        }
        else if (decade !== "") {
            if (property['Decade'] === parseInt(decade)) {
                returnObject.filterData.push(feature);
                if (returnObject.Lat === '' && returnObject.Lng === '') {
                    returnObject.Lat = feature.geometry.coordinates[0][0][0];
                    returnObject.Lng = feature.geometry.coordinates[0][0][1];
                }
            }
        }
        else if (acreage !== "") {
            if (property['ACRES'] >= parseInt(acreage)) {
                returnObject.filterData.push(feature);
                if (returnObject.Lat === '' && returnObject.Lng === '') {
                    returnObject.Lat = feature.geometry.coordinates[0][0][0];
                    returnObject.Lng = feature.geometry.coordinates[0][0][1];
                }
            }
        }
    }

    return returnObject;
}

var decades = [];
var currentDecadeValue = 0;
var minDecade = 0;
var maxDecade = 0;

function processData(data) {
    //populate the dropdownlist
    let states = [];
    for (let feature of data.features) {
        let property = feature.properties;
        states.push(property['State']);
    }

    // make states array unique
    states = Array.from(new Set(states));

    $('#selState').empty();
    $('#selState').append($('<option></option>').val('').html('All States'));
    $.each(states, function (i, p) {
        $('#selState').append($('<option></option>').val(p).html(p));
    });

    // populate the decade field

    decades = [];
    for (let feature of jsonData.features) {
        let property = feature.properties;
        decades.push(property['Decade']);
    }

    // make decade array unique
    decades = Array.from(new Set(decades));
    decades.sort();

    maxDecade = Math.max(...decades);
    minDecade = Math.min(...decades);

    $('#selDecade').empty();
    $('#selDecade').append($('<option></option>').val('').html('All Decades'));
    $.each(decades, function (i, p) {
        $('#selDecade').append($('<option></option>').val(p).html(p));
    });

    currentDecadeValue = parseInt($('#selDecade').val())

    // Populate acreage dropdown
    let acreages = [];
    for (let feature of jsonData.features) {
        let property = feature.properties;
        acreages.push(parseInt(property['ACRES']));
    }

    // make acreages array unique
    acreages = Array.from(new Set(acreages));
    acreages.sort((a, b) => a - b);

    let acreageRanges = [];
    for (let i = 0; i < acreages.length - 1; i += 1000) {
        acreageRanges.push(acreages[i])
    }

    $('#selAcreage').empty();
    $('#selAcreage').append($('<option></option>').val('').html('All Acreage'));
    $.each(acreageRanges, function (i, p) {
        $('#selAcreage').append($('<option></option>').val(p).html(`> ${p.toLocaleString()} acres.`));
    });
};

////////////////////////////////////////////
//// Update the map on the basis of filters
$('#btnApply').click(function () {
    let object = getFilteredData();
    createPropSymbols(object.filterData, map);
    map.flyTo(new L.LatLng(object.Lng, object.Lat), 5);
});

$('#btnReset').click(function () {
    $.ajax("data/US_Wildfires_Simplify.json", {
        dataType: "json",
        success: function (response) {
            jsonData = response;
            $('#selState').val('');
            $('#selDecade').val('');
            $('#selAcreage').val('');

            createPropSymbols(response, map);
        }
    });
    map.flyTo(new L.LatLng(39, -105), 4);
    $('#searchtext9').val('');
    $('.range-slider').val('1970');

});

////////////////////////////////////////////////////
//Import GeoJSON data
var jsonData;

function getData(map) {
    //load the data
    $.ajax("data/US_Wildfires_Simplify.json", {
        dataType: "json",
        success: function (response) {
            jsonData = response;
            //create an attributes array
            processData(response);

            createPropSymbols(response, map);
            createSequenceControls(map);

            ///////////////////////////////////////////////////////////
            //create search bar in top left corner of map where user may search by state name
            var searchControl = new L.Control.Search({
                layer: featuresLayer,
                propertyName: 'FIRE_NAME',
                marker: false,
                moveToLocation: function (latlng, title, map) {
                    map.setView(latlng, 4); // access the zoom
                }
            });

            searchControl.on('search:locationfound', function (e) {
                e.layer.setStyle({ fillColor: '#3f0', color: '#0f0' });
                if (e.layer._popup)
                    e.layer.openPopup();

            }).on('search:collapsed', function (e) {

                featuresLayer.eachLayer(function (layer) {	//restore feature color
                    featuresLayer.resetStyle(layer);
                });
            });

            map.addControl(searchControl);  //inizialize search control
        }
    });
};
$(document).ready(createMap);    