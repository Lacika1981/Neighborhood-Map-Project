//custom binding to fadeIn and fadeOut the reset button - from learn.knockoutjs.com

ko.bindingHandlers.fadeVisible = {
    init: function (element, valueAccessor) {
        // Start visible/invisible according to initial value
        var shouldDisplay = valueAccessor();
        $(element).hide(shouldDisplay);
    },
    update: function (element, valueAccessor) {
        // On update, fade in/out
        var shouldDisplay = valueAccessor();
        shouldDisplay ? $(element).fadeIn() : $(element).fadeOut();
    }
};

var map, infoWindow;
var restaurant = [];
var markers = [];
var myLatLng = { lat: 51.517023, lng: -0.129071 };
var locations = [];

function initMap() {
    var getRestaurants = function () {
        $.get("https://developers.zomato.com/api/v2.1/search?lat=" + myLatLng.lat + "&lon=" + myLatLng.lng + "&apikey=c5c5699a30922c7c7d4b8500982d27fc", function (data, status) {
            // error handling - if success

            if (status === 'success') {
                var cityRestaurants = data.restaurants;
                for (i = 0; i < cityRestaurants.length; i++) {
                    var addressLat = cityRestaurants[i].restaurant.location.latitude;
                    var addressLon = cityRestaurants[i].restaurant.location.longitude;
                    console.log(addressLat, addressLon);
                    locations.lat = parseFloat(addressLat);
                    locations.lng = parseFloat(addressLon);
                    var name = cityRestaurants[i].restaurant.name;
                    var cuisine = cityRestaurants[i].restaurant.cuisines;
                    var address = cityRestaurants[i].restaurant.location.address;
                    var price = cityRestaurants[i].restaurant.price_range;

                    var marker = new google.maps.Marker({
                        map: map,
                        position: locations,
                        title: name,
                        address: address,
                        cuisine: cuisine,
                        price: price,
                        animation: google.maps.Animation.DROP,
                        //icon: defaultIcon,
                        id: i
                    });

                    marker.addListener('click', listenerFunction);
                    // pushing data to the restaurant array
                    restaurant.push({
                        cuisines: cuisine,
                        names: name,
                        addresses: address,
                        prices: price,
                        locations: locations,
                        markers: marker
                    });
                    markers.push(marker);
                }
                /* self.filteredList(self.restaurant()); // it holds the restaurant Array for filtering
                self.restaurantArrayFix(self.restaurant()); // it holds the restaurant Array for filtering - fix values, no changes */
                showListings();
                // error handling - if fails
            } else {
                alert('We could not fetch data. Please try again later!');
            }
        });
    };

    var listenerFunction = function () {
        self.populateInfoWindow(this, infoWindow);
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

    ko.applyBindings(new AppViewModel());
}

var populateInfoWindow = function (marker, infoWindow) {
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
};

// places the markers on the map
var showListings = function () {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
    map.setZoom(16);
};

// stop bouncing the marker
function stopAnimation(marker) {
    setTimeout(function () {
        marker.setAnimation(null);
    }, 1500);
};

function AppViewModel() {
    var self = this;
    self.restaurantArrayFix = ko.observableArray(restaurant); // it holds a copy of the initial Array with the restaurants
    self.filterItem = ko.observable(''); // it holds the search field's characters
    self.restaurant = ko.observableArray(restaurant); // restaurant arrays - only used to pass to filteredList and restaurantArrayFix
    self.filteredList = ko.observableArray(); // array with the restaurants
    self.locations = ko.observableArray(locations); // holds the lat and lng of each restaurant
    self.filterItemLength = ko.observable(); // holds the value of the length of the restaurantArray
    console.log(self.restaurant());

    // called by the reset to set everything to the initial state
    self.clear = function () {
        showListings();
        infoWindow.close(map);
        self.filterItem('');
        self.filteredList(self.restaurantArrayFix()); // updates the filteredList calling the restaurantArrayFix array
    };


    // filtering the list
    var tick = false;

    self.filter = ko.computed(function () {
        var filter = self.filterItem().toLowerCase();
        var restaurantArray = self.restaurant();
        self.filterItemLength(restaurantArray.length);
        if (!filter) {
            return markers;
        } else {
            self.filteredList([]); // empty the array before pushing the restaurants what contains the typed characters
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0, len = self.filterItemLength(); i < len; i++) {
                console.log(self.filterItemLength());
                tick = false;
                if (restaurantArray[i].names.toLowerCase().indexOf(filter) != -1) {
                    restaurantArray[i].markers.setMap(map);
                    self.filteredList.push(restaurantArray[i]); // adding the restaurant array to update the menu with the available restaurants
                    bounds.extend(restaurantArray[i].locations);
                    map.fitBounds(bounds);
                    map.setZoom(17);
                    if (!tick) {
                        restaurantArray[i].markers.setAnimation(google.maps.Animation.DROP);
                        tick = true;
                    }
                } else {
                    restaurantArray[i].markers.setMap(null);
                }
            }
        }
    });

    // shows the restaurants on the map
    self.showRestaurant = function (restaurant) {
        var clickedRestaurant = restaurant.addresses;
        for (var key in self.restaurant()) {
            if (clickedRestaurant === self.restaurant()[key].addresses) {
                self.restaurant()[key].markers.setAnimation(google.maps.Animation.BOUNCE);
                stopAnimation(self.restaurant()[key].markers); // calling the stopAnimation function to stop the marker bouncing
                map.panTo(self.restaurant()[key].markers.position); // centering the markers on the map
                map.setZoom(18);
                infoWindow.setContent('<div><b>Restaurant name:</b> ' + self.restaurant()[key].names + '</div><div><b>Address:</b> ' + self.restaurant()[key].addresses + '</div><div><b>Cuisine:</b><br>' + self.restaurant()[key].cuisines + '</div><div><b>Price range: </b>' + self.restaurant()[key].prices + '</div>');
                infoWindow.open(map, self.restaurant()[key].markers);
            }
        }
    };
}

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
            $('#search').css({ "-webkit-transform": "translateX(-170px)" });
            $('#menu').css({ "-webkit-transform": "translateX(-170px)" });
            moved = false;
        }
    });
});