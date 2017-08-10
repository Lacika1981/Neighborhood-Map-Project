function AppViewModel() {
    var self = this;
    var map, infoWindow;
    self.restaurantArrayFix = ko.observableArray();
    self.filterItem = ko.observable('');
    self.filteredList = ko.observableArray();
    self.restaurant = ko.observableArray();
    self.markers = ko.observableArray();
    self.locations = ko.observableArray();
    self.cuisines = ko.observableArray();
    self.names = ko.observableArray();
    self.addresses = ko.observableArray();
    self.prices = ko.observableArray();
    var myLatLng = { lat: 51.283947, lng: -1.080868 };

    function initMap() {
        var getRestaurants = function() {
            self.markers([]);
            self.locations([]);
            self.cuisines([]);
            self.names([]);
            self.addresses([]);
            self.prices([]);
            $.get("https://developers.zomato.com/api/v2.1/geocode?lat=" + myLatLng.lat + "&lon=" + myLatLng.lng + "&apikey=c5c5699a30922c7c7d4b8500982d27fc", function(data, status) {
                var cityRestaurants = data.nearby_restaurants;
                for (i = 0; i < cityRestaurants.length; i++) {
                    var addressLat = cityRestaurants[i].restaurant.location.latitude;
                    var addressLon = cityRestaurants[i].restaurant.location.longitude;
                    if (addressLat != 0 || addressLon != 0) {
                        self.locations().lat = parseFloat(addressLat);
                        self.locations().lng = parseFloat(addressLon);
                    }
                    var name = cityRestaurants[i].restaurant.name;
                    var cuisine = cityRestaurants[i].restaurant.cuisines;
                    var address = cityRestaurants[i].restaurant.location.address;
                    var price = cityRestaurants[i].restaurant.price_range;

                    self.marker = new google.maps.Marker({
                        map: map,
                        position: self.locations(),
                        title: name,
                        address: address,
                        cuisine: cuisine,
                        price: price,
                        animation: google.maps.Animation.DROP,
                        //icon: defaultIcon,
                        id: i
                    });

                    self.marker.addListener('click', function () {
                        populateInfoWindow(this, infoWindow);
                    })

                    self.restaurant.push({
                        cuisines: cuisine,
                        names: name,
                        addresses: address,
                        prices: price,
                        locations: self.locations(),
                        markers: self.marker
                    })
                    self.markers.push(self.marker);
                }
                self.filteredList(self.restaurant());
                self.restaurantArrayFix(self.restaurant());
                showListings();
            })
        }

        infoWindow = new google.maps.InfoWindow();
        map = new google.maps.Map(document.getElementById('map'), {
            center: myLatLng,
            mapTypeControl: false
        });
        getRestaurants();
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(search);

        var marker = new google.maps.Marker({
            map: map,
            animation: google.maps.Animation.DROP
        });

    }

    self.showRestaurant = function(restaurant) {
        var clickedRestaurant = restaurant.addresses;
        console.log(clickedRestaurant);
        console.log('--------------------');
        for (var key in self.restaurant()) {
            if (clickedRestaurant === self.restaurant()[key].addresses) {
                console.log(self.restaurant()[key].markers.position);
                map.panTo(self.restaurant()[key].markers.position);
                //map.setZoom(14);
                infoWindow.setContent('<div><b>Restaurant name:</b> ' + self.restaurant()[key].names + '</div><div><b>Address:</b> ' + self.restaurant()[key].addresses + '</div><div><b>Cuisine:</b><br>' + self.restaurant()[key].cuisines + '</div><div><b>Price range: </b>' + self.restaurant()[key].prices + '</div>');
                infoWindow.open(map, self.restaurant()[key].markers);
            }
        }
    };

    self.clear = function() {
        showListings();
        infoWindow.close(map);
        self.filterItem('');
        self.filteredList(self.restaurantArrayFix());
    }

    self.hideMarkers = function(markers) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
    }

    var tick = false;

    self.filter = ko.computed(function() {
        var filter = self.filterItem().toLowerCase();
        var restaurantArray = self.restaurant();
        if (!filter) {
            return self.markers();
        } else {
            self.filteredList([]);
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0, len = restaurantArray.length; i < len; i++) {
                if (restaurantArray[i].names.toLowerCase().indexOf(filter) != -1) {
                    console.log(restaurantArray[i].names)
                    restaurantArray[i].markers.setMap(map);
                    self.filteredList.push(restaurantArray[i]);
                    bounds.extend(restaurantArray[i].locations);
                    map.fitBounds(bounds);
                    map.setZoom(14);
                    if (!tick){
                        restaurantArray[i].markers.setAnimation(google.maps.Animation.DROP);
                        tick = true;
                    }
                    console.log(self.restaurantArrayFix());
                } else {
                    restaurantArray[i].markers.setMap(null);
                }
            }
        }
    })

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

            infoWindow.setContent('<div><b>Restaurant name:</b> ' + marker.title + '</div><div><b>Address:</b> ' + marker.address + '</div><div><b>Cuisine:</b><br>' + marker.cuisine + '</div><div><b>Price range: </b>' + marker.price + '</div>');

        }
        infoWindow.open(map, marker);
    }




    /* self.filter = ko.computed(function () {
        var filter = self.filterItem().toLowerCase();
        var array = self.restaurant();
        if (!filter) {
            return self.markers();
        } else {
            self.filteredList([]);
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0; i < array.length; i++) {
                if (array[i].names.toLowerCase().indexOf(filter) != -1) {
                    self.filteredList.push(self.restaurant()[i].names);
                    self.filteredList()[i].markers.setMap(map);
                    bounds.extend(self.filteredList()[i].locations);
                } else {
                    self.filteredList()[i].markers.setMap(null);
                }
                map.fitBounds(bounds);
                map.setZoom(14);
            }
        }
    }) */

    console.log(self.restaurant());

    function hideMarkers(markers) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
    }

    function showListings() {
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        for (var i = 0; i < self.markers().length; i++) {
            self.markers()[i].setMap(map);
            bounds.extend(self.markers()[i].position);
        }
        map.fitBounds(bounds);
        map.setZoom(14);
    };

    initMap();
}

ko.applyBindings(new AppViewModel());






















/*      var search = document.getElementById('search');
    var input = document.getElementById('places-search');
    var bounds = new google.maps.LatLngBounds();
    var options = {
        types: ['(regions)'],
        componentRestrictions: { country: "uk" }
    };

     var autocomplete = new google.maps.places.Autocomplete(input, options);
    // Bind the map's bounds (viewport) property to the autocomplete object,
    // so that the autocomplete requests use the current map bounds for the
    // bounds option in the request.
    autocomplete.bindTo('bounds', map);

    autocomplete.addListener('place_changed', function() {
        //infowindow.close();
        self.hideMarkers(self.markers());
        self.marker.setVisible(false);
        self.markers([]);
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
        self.marker.setPosition(place.geometry.location);
        self.markers().push(marker);

        self.marker.addListener('click', function() {
            populateInfoWindow(this, largeInfoWindow);
        })
        myLatLng.lat = place.geometry.location.lat();
        myLatLng.lng = place.geometry.location.lng();
        self.marker.setVisible(true);
        getRestaurants();
    }) */