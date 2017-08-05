var map;
var infoWindow;
var myLatLng = { lat: 51.283947, lng: -1.080868 };
var searchedLatLng = {};
var markers = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: myLatLng,
        //styles: styles,
        mapTypeControl: false
    });
    var marker = new google.maps.Marker({
        map: map,
        position: myLatLng,
        animation: google.maps.Animation.DROP
    });

    marker.addListener('click', function () {
        populateInfoWindow(this, largeInfoWindow);
    })

    markers.push(marker);


    var largeInfoWindow = new google.maps.InfoWindow();

    var search = document.getElementById('search');
    var input = document.getElementById('places-search');
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(search);
    var bounds = new google.maps.LatLngBounds();


    var options = {
        componentRestrictions: { country: "uk" }
    };

    var autocomplete = new google.maps.places.Autocomplete(input, options);
    // Bind the map's bounds (viewport) property to the autocomplete object,
    // so that the autocomplete requests use the current map bounds for the
    // bounds option in the request.
    autocomplete.bindTo('bounds', map);

    autocomplete.addListener('place_changed', function () {
        //infowindow.close();
        marker.setVisible(false);
        hideMarkers(markers);
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
            map.setZoom(17);  // Why 17? Because it looks good.
        }
        marker.setPosition(place.geometry.location);
        myLatLng.lat = place.geometry.location.lat();
        myLatLng.lng = place.geometry.location.lng();
        ViewModel();
        marker.setVisible(true);
    })
}

function populateInfoWindow(marker, infoWindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infoWindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infoWindow.setContent('');
        infoWindow.marker = marker;
        // Make sure the marker property is cleared if the infowindow is closed.
        infoWindow.addListener('closeclick', function () {
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

var ViewModel = function () {
    this.restaurants = ko.observableArray([]);
    var locations = {};
    markers.length = 0;
    $.get("https://developers.zomato.com/api/v2.1/geocode?lat=" + myLatLng.lat + "&lon=" + myLatLng.lng + "&apikey=c5c5699a30922c7c7d4b8500982d27fc", function (data, status) {
        var cityRestaurants = data.nearby_restaurants;
        for (i = 0; i < cityRestaurants.length; i++) {
            var addressLat = cityRestaurants[i].restaurant.location.latitude;
            var addressLon = cityRestaurants[i].restaurant.location.longitude;
            if (addressLat != 0 || addressLon != 0) {
            locations.lat = parseFloat(addressLat);
            locations.lng = parseFloat(addressLon);
            }
            var title = cityRestaurants[i].restaurant.name;
            var marker = new google.maps.Marker({
                map: map,
                position: locations,
                title: title,
                animation: google.maps.Animation.DROP,
                //icon: defaultIcon,
                id: i
            });
            markers.push(marker);

            marker.addListener('click', function () {
                populateInfoWindow(this, largeInfoWindow);
            })
        }
        showListings();
    })
}

/* document.getElementById('show').addEventListener('click', function () {
    showListings();
}) */

function showListings() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
        console.log(markers);
    }
    map.fitBounds(bounds);
};


ko.applyBindings(ViewModel);