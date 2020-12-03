//function to instantiate the Leaflet map
function createMap(){
    var map = L.map('map', {
        center: [38,-95],
        zoom: 4,
        minZoom:2,
        maxZoom:18
    });

    L.tileLayer('https://api.maptiler.com/maps/topo/{z}/{x}/{y}.png?key=HgWcVD9zl0mqqWSOflrs', {
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
    }).addTo(map);
        
    //call getData function
    getData(map);
};


function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 250;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};


function pointToLayer(feature, latlng, attributes){
    //Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    //check
    console.log(attribute);
    //create marker options
    var options = {
        fillColor: "#8900ff",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    var popupContent = "<p><b>City:</b> " + feature.properties.name + "</p>";

    //add formatted attribute to popup content string
    var month = attribute.split("_")[1];
    popupContent += "<p><b>Rainfall in " + month + ":</b> " + feature.properties[attribute] + " inches</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius),
        closeButton: false 
    });
    //event listeners to open popup on hover and fill panel on click
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        }
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //add city to popup content string
            var popupContent = "<p><b>City:</b> " + props.name + "</p>";

            //add formatted attribute to panel content string
            var month = attribute.split("_")[1];
            popupContent += "<p><b>Rainfall in " + month + ":</b> " + props[attribute] + " inches</p>";

            //replace the layer popup
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-radius)
            });
        };
    });
};

function createPopup(properties, attribute, layer, radius){
    //add city to popup content string
    var popupContent = "<p><b>City:</b> " + properties.name + "</p>";

    //add formatted attribute to panel content string
    var month = attribute.split("_")[1];
    popupContent += "<p><b>Rainfall in " + month + ":</b> " + properties[attribute] + " inches</p>";

    //replace the layer popup
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius)
    });
};    
function createSequenceControls(map, attributes){
    //create slider
    $('#panel').append('<input class="range-slider" type="range">');
    $('#panel').append('<button class="skip" id="reverse">Reverse</button>');
    $('#panel').append('<button class="skip" id="forward">Skip</button>');
       //Click listener for buttons
    $('.skip').click(function(){
        //get the old index value
        var index = $('.range-slider').val();
        if ($(this).attr('id') == 'forward'){
            index++;
            //Part of slider loop
            index = index > 11 ? 0 : index;
            
             updatePropSymbols(map, attributes[index]);
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //Part of slider loop
            index = index < 0 ? 11 : index;
            
            updatePropSymbols(map, attributes[index]);
            
        };

        $('.range-slider').val(index);
        
    });

    //set slider attributes
    $('.range-slider').attr({
        max: 11,
        min: 0,
        value: 0,
        step: 1
    });
};

function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Rain") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};

//Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/rainfall.json", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);
            
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
        }
    });
};
$(document).ready(createMap);    