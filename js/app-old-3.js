var map;
var infoWindow;
var myLatLng = { lat: 51.283947, lng: -1.080868 };
var markers = ko.observableArray();
var locations = ko.observableArray();

function initMap() {
    var getRestaurants = function() {
        markers([]);
        $.get("https://developers.zomato.com/api/v2.1/geocode?lat=" + myLatLng.lat + "&lon=" + myLatLng.lng + "&apikey=c5c5699a30922c7c7d4b8500982d27fc", function(data, status) {
            var cityRestaurants = data.nearby_restaurants;
            for (i = 0; i < cityRestaurants.length; i++) {
                if (cityRestaurants.length == 0) {
                    alert('ezaz');
                }
                var addressLat = cityRestaurants[i].restaurant.location.latitude;
                var addressLon = cityRestaurants[i].restaurant.location.longitude;
                if (addressLat != 0 || addressLon != 0) {
                    locations().lat = parseFloat(addressLat);
                    locations().lng = parseFloat(addressLon);
                }
                var name = cityRestaurants[i].restaurant.name;
                var cuisine = cityRestaurants[i].restaurant.cuisines;
                var address = cityRestaurants[i].restaurant.location.address;
                var price = cityRestaurants[i].restaurant.price_range;
                switch (price) {
                    case 1:
                        price = '&#163;';
                        break;

                    case 2:
                        price = Array(3).join('&#163;');
                        break;

                    case 3:
                        price = Array(4).join('&#163;');
                        break;

                    case 4:
                        price = Array(5).join('&#163;');
                        break;

                    case 5:
                        price = Array(6).join('&#163;');
                        break;
                }

                var marker = new google.maps.Marker({
                    map: map,
                    position: locations(),
                    title: name,
                    address: address,
                    cuisine: cuisine,
                    price: price,
                    animation: google.maps.Animation.DROP,
                    //icon: defaultIcon,
                    id: i
                });
                markers.push(marker);

                marker.addListener('click', function() {
                    infoWindow(this, largeInfoWindow);
                })

            }
            showListings();
        })
    }
    var originIcon = makeMarkerIcon('0091ff');
    var largeInfoWindow = new google.maps.InfoWindow();
    var search = document.getElementById('search');
    var input = document.getElementById('places-search');
    var bounds = new google.maps.LatLngBounds();
    var options = {
        types: ['(regions)'],
        componentRestrictions: { country: "uk" }
    };

    map = new google.maps.Map(document.getElementById('map'), {
        //center: myLatLng,
        mapTypeControl: false
    });
    var marker = new google.maps.Marker({
        map: map,
        title: 'origin',
        position: myLatLng,
        animation: google.maps.Animation.DROP,
        icon: originIcon
    });
    markers.push(marker);
    marker.addListener('click', function() {
        populateInfoWindow(this, largeInfoWindow);
    });
    getRestaurants();
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(search);

    var autocomplete = new google.maps.places.Autocomplete(input, options);
    // Bind the map's bounds (viewport) property to the autocomplete object,
    // so that the autocomplete requests use the current map bounds for the
    // bounds option in the request.
    autocomplete.bindTo('bounds', map);

    autocomplete.addListener('place_changed', function() {
        //infowindow.close();
        hideMarkers(markers());
        marker.setVisible(false);
        markers([]);
        var place = autocomplete.getPlace();
        if (!place.geometry) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17); // Why 17? Because it looks good.
        }
        marker.setPosition(place.geometry.location);
        markers().push(marker);

        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfoWindow);
        })
        myLatLng.lat = place.geometry.location.lat();
        myLatLng.lng = place.geometry.location.lng();
        marker.setVisible(true);
        getRestaurants();
    })


    ko.applyBindings(new AppViewModel());
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 31 px wide by 44 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 44),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 44));
    return markerImage;
}

function infoWindow(marker, infoWindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infoWindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infoWindow.setContent('');
        infoWindow.marker = marker;
        // Make sure the marker property is cleared if the infowindow is closed.
        infoWindow.addListener('closeclick', function() {
            infoWindow.marker = null;
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(nearStreetViewLocation, marker.position);
                infoWindow.setContent('<div id="pano"></div><div><b>Restaurant name:</b> ' + marker.title + '</div><div><b>Address:</b> ' + marker.address + '</div><div><b>Cuisine:</b><br>' + marker.cuisine + '</div><div><b>Price range: </b>' + marker.price + '</div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 15
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infoWindow.setContent('<div>No Street View Found</div><div><b>Restaurant name:</b></div>' + marker.title + '</div>' +
                    '<div><b>Address:</b> ' + marker.address + '</div><div><b>Cuisine:</b><br>' + marker.cuisine + '</div><div><b>Price range: </b>' + marker.price + '</div>');
            }
        }
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
        infoWindow.open(map, marker);
    }
}

function populateInfoWindow(marker, infoWindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infoWindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infoWindow.setContent('');
        infoWindow.marker = marker;
        // Make sure the marker property is cleared if the infowindow is closed.
        infoWindow.addListener('closeclick', function() {
            infoWindow.marker = null;
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(nearStreetViewLocation, marker.position);
                infoWindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infoWindow.setContent('<div>' + marker.title + '</div>' +
                    '<div>No Street View Found</div>');
            }
        }
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
        infoWindow.open(map, marker);
    }
}

function hideMarkers(markers) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

function showListings() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers().length; i++) {
        markers()[i].setMap(map);
        bounds.extend(markers()[i].position);
    }
    map.fitBounds(bounds);
};


function AppViewModel() {
    var self = this;
    self.markers = markers;
    self.locations = locations;
}