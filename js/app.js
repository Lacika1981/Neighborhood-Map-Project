var map, infoWindow, bounds;
var restaurant = [];
var markers = [];
var myLatLng = { lat: 51.517023, lng: -0.129071 };
var locations = [];
var zm = 17;

// Get the maximum restaurant information back
var url = [
  "https://developers.zomato.com/api/v2.1/search?lat=" + myLatLng.lat + "&lon=" + myLatLng.lng + "&start=0&count=20&apikey=c5c5699a30922c7c7d4b8500982d27fc",
  "https://developers.zomato.com/api/v2.1/search?lat=" + myLatLng.lat + "&lon=" + myLatLng.lng + "&start=20&count=20&apikey=c5c5699a30922c7c7d4b8500982d27fc",
  "https://developers.zomato.com/api/v2.1/search?lat=" + myLatLng.lat + "&lon=" + myLatLng.lng + "&start=40&count=20&apikey=c5c5699a30922c7c7d4b8500982d27fc",
  "https://developers.zomato.com/api/v2.1/search?lat=" + myLatLng.lat + "&lon=" + myLatLng.lng + "&start=60&count=20&apikey=c5c5699a30922c7c7d4b8500982d27fc",
  "https://developers.zomato.com/api/v2.1/search?lat=" + myLatLng.lat + "&lon=" + myLatLng.lng + "&start=80&count=20&apikey=c5c5699a30922c7c7d4b8500982d27fc"
];

function initMap() {
  bounds = new google.maps.LatLngBounds();
  var getRestaurants = function () {
    for (var i = 0; i < url.length; i++) {
      $.ajax({
        url: url[i]
      })
        .done(successfullFetch)
        .fail(failedFetch);
    }
  };


  // These to methods have to be moved out as they can not be inside a for loop
  var successfullFetch = function (data) {
    var cityRestaurants = data.restaurants;
    for (i = 0; i < cityRestaurants.length; i++) {
      var addressLat = cityRestaurants[i].restaurant.location.latitude;
      var addressLon = cityRestaurants[i].restaurant.location.longitude;
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
    appVM.restaurantArrayFix(restaurant);
    appVM.restaurant(restaurant);
    appVM.filteredList(restaurant);
    showListings();
  };

  var failedFetch = function () {
    alert("Could not fetch data. Please refresh your browser!");
  };

  var listenerFunction = function () {
    populateInfoWindow(this, infoWindow);
    this.setAnimation(google.maps.Animation.BOUNCE);
    stopAnimation(this);
  };

  // infoWindow
  infoWindow = new google.maps.InfoWindow();
  map = new google.maps.Map(document.getElementById('map'), {
    center: myLatLng,
    mapTypeControl: false,
    styles: style
  });
  getRestaurants(); // calls the getRestaurants method
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(search);

  var marker = new google.maps.Marker({
    map: map,
    animation: google.maps.Animation.DROP
  });
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
  //var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
  google.maps.event.addDomListener(window, 'resize', function () {
    map.fitBounds(bounds); // `bounds` is a `LatLngBounds` object
  });
};

// stop bouncing the marker
function stopAnimation(marker) {
  setTimeout(function () {
    marker.setAnimation(null);
  }, 1450);
}

var mapInitError = function () {
  alert('Could not fetch data from server! Please refresh your browser!');
};

function AppViewModel() {
  var self = this;
  self.restaurantArrayFix = ko.observableArray(); // it holds a copy of the initial Array with the restaurants
  self.filterItem = ko.observable(''); // it holds the search field's characters
  self.restaurant = ko.observableArray(); // restaurant array
  self.filteredList = ko.observableArray(); // array with the restaurants
  self.locations = ko.observableArray(locations); // holds the lat and lng of each restaurant
  self.filterItemLength = ko.observable(); // holds the value of the length of the restaurantArray
  self.visibleExample = ko.observable(false);

  // called by the reset to set everything to the initial state
  self.clear = function () {
    showListings();
    infoWindow.close(map);
    self.filterItem('');
    self.filteredList(self.restaurantArrayFix()); // updates the filteredList calling the restaurantArrayFix array
  };

  self.clickMenu = function () {
    self.visibleExample(!self.visibleExample());
    console.log('test');
  };

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

  self.filter = ko.computed(function () {
    var filter = self.filterItem().toLowerCase();
    var restaurantArray = self.restaurant();
    self.filterItemLength(restaurantArray.length);
    if (!filter) {
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
      }
      self.filteredList(self.restaurantArrayFix());
    } else {
      self.filteredList([]); // empty the array before pushing the restaurants what contains the typed characters
      //var bounds = new google.maps.LatLngBounds();
      for (var j = 0, len = self.filterItemLength(); j < len; j++) {
        if (restaurantArray[j].names.toLowerCase().indexOf(filter) != -1) {
          restaurantArray[j].markers.setMap(map);
          self.filteredList.push(restaurantArray[j]); // adding the restaurant array to update the menu with the available restaurants
          bounds.extend(restaurantArray[j].locations);
          map.fitBounds(bounds);
          map.setZoom(17);
        } else {
          restaurantArray[j].markers.setMap(null);
        }
      }
    }
  });

  self.showRestaurant = function (restaurant) {
    var clickedRestaurant = restaurant.addresses;
    self.restaurant().forEach(function (restaurant) {
      if (clickedRestaurant === restaurant.addresses) {
        restaurant.markers.setAnimation(google.maps.Animation.BOUNCE);
        stopAnimation(restaurant.markers); // calling the stopAnimation function to stop the marker bouncing
        map.panTo(restaurant.markers.position); // centering the markers on the map
        map.setZoom(19);
        infoWindow.setContent('<div><b>Restaurant name:</b> ' + restaurant.names + '</div><div><b>Address:</b> ' + restaurant.addresses + '</div><div><b>Cuisine:</b><br>' + restaurant.cuisines + '</div><div><b>Price range: </b>' + restaurant.prices + '</div>');
        infoWindow.open(map, restaurant.markers);
      }
    });
  };
}

appVM = new AppViewModel();

ko.applyBindings(appVM);