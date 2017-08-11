//custom binding to fadeIn and fadeOut the reset button - from learn.knockoutjs.com

ko.bindingHandlers.fadeVisible = {
    init: function(element, valueAccessor) {
        // Start visible/invisible according to initial value
        var shouldDisplay = valueAccessor();
        $(element).hide(shouldDisplay);
    },
    update: function(element, valueAccessor) {
        // On update, fade in/out
        var shouldDisplay = valueAccessor();
        shouldDisplay ? $(element).fadeIn() : $(element).fadeOut();
    } 
};

function AppViewModel() {
    var self = this;
    var map, infoWindow;
    self.restaurantArrayFix = ko.observableArray(); // it holds a copy of the initial Array with the restaurants
    self.filterItem = ko.observable(''); // it holds the search field fileds' characters
    self.filteredList = ko.observableArray(); // array with the restaurants
    self.restaurant = ko.observableArray(); // restaurant arrays - only used to pass to filteredList and restaurantArrayFix
    self.markers = ko.observableArray(); // markers' array
    self.locations = ko.observableArray(); // holds the lat and lng of each restaurant
    self.cuisines = ko.observableArray(); // not in use
    self.names = ko.observableArray(); // not in use
    self.addresses = ko.observableArray(); // not in use
    self.prices = ko.observableArray(); // not in use
    self.filterItemLength = ko.observable(); // holds the value of the length of the restaurantArray
    var myLatLng = { lat: 51.283947, lng: -1.080868 };

    function initMap() {
        var getRestaurants = function() {
            // empty each array before pushing data
            self.markers([]);
            self.locations([]);
            self.cuisines([]);
            self.names([]);
            self.addresses([]);
            self.prices([]);
            $.get("https://developers.zomato.com/api/v2.1/geocode?lat=" + myLatLng.lat + "&lon=" + myLatLng.lng + "&apikey=c5c5699a30922c7c7d4b8500982d27fc", function(data, status) {
                // error handling - if success
                if (status === 'success'){
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
                    });
                    // pushing data to the restaurant array
                    self.restaurant.push({
                        cuisines: cuisine,
                        names: name,
                        addresses: address,
                        prices: price,
                        locations: self.locations(),
                        markers: self.marker
                    });
                    self.markers.push(self.marker);
                }
                self.filteredList(self.restaurant()); // it holds the restaurant Array for filtering
                self.restaurantArrayFix(self.restaurant()); // it holds the restaurant Array for filtering - fix values, no changes
                showListings();
                // error handling - if fails
                } else {
                    alert ('We could not fetch data. Please try again later!');
                }
            });
        };

        // infoWindow
        infoWindow = new google.maps.InfoWindow();
        map = new google.maps.Map(document.getElementById('map'), {
            center: myLatLng,
            mapTypeControl: false
        });
        getRestaurants(); // calls the getRestaurants method
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(search);

        var marker = new google.maps.Marker({
            map: map,
            animation: google.maps.Animation.DROP
        });

    }

    // shows the restaurants on the map
    self.showRestaurant = function(restaurant) {
        var clickedRestaurant = restaurant.addresses;
        for (var key in self.restaurant()) {
            if (clickedRestaurant === self.restaurant()[key].addresses) {
                map.panTo(self.restaurant()[key].markers.position); // centering the markers on the map
                //map.setZoom(14);
                infoWindow.setContent('<div><b>Restaurant name:</b> ' + self.restaurant()[key].names + '</div><div><b>Address:</b> ' + self.restaurant()[key].addresses + '</div><div><b>Cuisine:</b><br>' + self.restaurant()[key].cuisines + '</div><div><b>Price range: </b>' + self.restaurant()[key].prices + '</div>');
                infoWindow.open(map, self.restaurant()[key].markers);
            }
        }
    };

    // called by the reset to set everything to the initial state
    self.clear = function() {
        showListings();
        infoWindow.close(map);
        self.filterItem('');
        self.filteredList(self.restaurantArrayFix()); // updates the filteredList calling the restaurantArrayFix array
    };

    
    // filtering the list
    var tick = false;

    self.filter = ko.computed(function() {
        var filter = self.filterItem().toLowerCase();
        var restaurantArray = self.restaurant();
        self.filterItemLength(restaurantArray.length);
        if (!filter) {
            return self.markers();
        } else {
            self.filteredList([]); // empty the array before pushing the name of restaurants what contains the typed characters
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0, len = restaurantArray.length; i < len; i++) {
                self.filterItemLength(len);
                if (restaurantArray[i].names.toLowerCase().indexOf(filter) != -1) {
                    
                    restaurantArray[i].markers.setMap(map);
                    self.filteredList.push(restaurantArray[i]); // adding the restaurant array to update the menu with the available restaurants
                    bounds.extend(restaurantArray[i].locations);
                    map.fitBounds(bounds);
                    map.setZoom(14);
                    if (!tick){
                        restaurantArray[i].markers.setAnimation(google.maps.Animation.DROP);
                        tick = true;
                    }
                } else {
                    restaurantArray[i].markers.setMap(null);
                }
            }
        }
    });

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

    // places the markers on the map
    function showListings() {
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        for (var i = 0; i < self.markers().length; i++) {
            self.markers()[i].setMap(map);
            bounds.extend(self.markers()[i].position);
        }
        map.fitBounds(bounds);
        map.setZoom(14);
    }

    initMap();
}

ko.applyBindings(new AppViewModel());

// menu control
var moved = false;

$(function () {
    $('#menu').on('click', function () {
        if (!moved) {
            $('#search').css({ "-webkit-transform": "translateX(0px)" });
            $('#menu').css({ "-webkit-transform": "translateX(0px)" });
            moved = true;
        }
        else {
            $('#search').css({ "-webkit-transform": "translateX(-160px)" });
            $('#menu').css({ "-webkit-transform": "translateX(-160px)" });
            moved = false;
        }
    });
});