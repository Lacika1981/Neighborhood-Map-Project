function AppViewModel() {
    var self = this;
    var map, infoWindow;
    self.filterItem = ko.observable('');
    self.filteredList = ko.observableArray();
    self.markers = ko.observableArray();
    self.locations = ko.observableArray();
    self.cuisines = ko.observableArray();
    self.names = ko.observableArray();
    self.addresses = ko.observableArray();
    self.prices = ko.observableArray();
    var myLatLng = { lat: 51.283947, lng: -1.080868 };
    console.log(self.filterItem());

    function initMap() {
        var getRestaurants = function () {
            self.markers([]);
            self.locations([]);
            self.cuisines([]);
            self.names([]);
            self.addresses([]);
            self.prices([]);
            $.get("https://developers.zomato.com/api/v2.1/geocode?lat=" + myLatLng.lat + "&lon=" + myLatLng.lng + "&apikey=c5c5699a30922c7c7d4b8500982d27fc", function (data, status) {
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

                    self.cuisines.push(cuisine);
                    self.names.push(name);
                    self.addresses.push(address);
                    self.prices.push(price);

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
                    self.markers.push(self.marker);
                }
                showListings();
            })
            console.log(self.markers());
        }

        infoWindow = new google.maps.InfoWindow();
        map = new google.maps.Map(document.getElementById('map'), {
            center: myLatLng,
            mapTypeControl: false
        });
        getRestaurants();
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(search);
    }

    self.showRestaurant = function (restaurant) {
        var clickedRestaurant = restaurant.address;
        console.log(clickedRestaurant);
        console.log('--------------------');
        for (var key in self.markers()) {
            console.log(self.markers());
            if (clickedRestaurant === self.markers()[key].address) {
                map.panTo(self.markers()[key].position);
                map.setZoom(18);
                infoWindow.setContent('<div><b>Restaurant name:</b> ' + self.markers()[key].title + '</div><div><b>Address:</b> ' + self.markers()[key].address + '</div><div><b>Cuisine:</b><br>' + self.markers()[key].cuisine + '</div><div><b>Price range: </b>' + self.markers()[key].price + '</div>');
                infoWindow.open(map, this);
            }
        }
    };

    self.clear = function(){
        showListings();
        infoWindow.close(map);
        self.filterItem('');
    }

    self.filter = ko.computed(function() {
    var filter = self.filterItem().toLowerCase();
    if (!filter) {
        return self.markers();
    } else {
        self.filteredList([]);
        var bounds = new google.maps.LatLngBounds();
        //console.log(self.filterItem());
        for (var i = 0; i < self.markers().length; i++) {
            if (self.markers()[i].title.toLowerCase().indexOf(filter) != -1) {
                console.log(self.markers()[i].title);
                self.filteredList.push(self.markers()[i].title);
                console.log(self.filteredList());
                self.markers()[i].setMap(map);
                bounds.extend(self.markers()[i].position);
            }  else {
                self.clear;
            }
            map.fitBounds(bounds);
        }
    }
})

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
    };

    initMap();
}

ko.applyBindings(new AppViewModel());