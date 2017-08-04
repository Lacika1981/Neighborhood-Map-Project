var map;
var geocoder;
var infoWindow;
var locations = {};
var markers = [];

var arrayRestaurant = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        //styles: styles,
        mapTypeControl: false
    });

    var largeInfoWindow = new google.maps.InfoWindow();

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var latC = position.coords.latitude;
            var lonC = position.coords.longitude;

            /* infoWindow.setPosition(pos);
            infoWindow.setContent('Location found.');
            infoWindow.open(map); */

            map.setCenter(new google.maps.LatLng(latC, lonC));
            $.get("https://developers.zomato.com/api/v2.1/geocode?lat=" + latC + "&lon=" + lonC + "&apikey=c5c5699a30922c7c7d4b8500982d27fc", function (data, status) {
                var cityID = data.location.city_id;
                for (var i = 0; i < data.nearby_restaurants.length; i++){
                    arrayRestaurant.push(data.nearby_restaurants[i].restaurant.cuisines);
                    
                }


                

                console.log(arrayRestaurant);
                /* var text = document.getElementsByClassName('form-control');
                $.get("https://developers.zomato.com/api/v2.1/cuisines?city_id=" + cityID + "&apikey=c5c5699a30922c7c7d4b8500982d27fc", function (data) {
                    console.log(data.cuisines);
                    for (var i = 0; i < data.cuisines.length; i++) {
                        text[0].innerHTML += '<option value=' + data.cuisines[i].cuisine.cuisine_name + '>' + data.cuisines[i].cuisine.cuisine_name + '</option>';
                    }
                }) */
                var cityRestaurants = data.nearby_restaurants;
                console.log(cityRestaurants);
                for (i = 0; i < cityRestaurants.length; i++) {                    
                    var addressLat = cityRestaurants[i].restaurant.location.latitude;
                    var addressLon = cityRestaurants[i].restaurant.location.longitude;
                    locations.lat = parseFloat(addressLat);
                    locations.lng = parseFloat(addressLon);
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

            });
        },
            function () {
                handleLocationError(true, largeInfoWindow, map.getCenter());
            });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, largeInfoWindow, map.getCenter());
    }


    function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
            'Error: The Geolocation service failed.' :
            'Error: Your browser doesn\'t support geolocation.');
        infoWindow.open(map);
    }
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