var map, infoWindow;
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
    zoomNumber();
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
    styles:
    [
      {
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#ebe3cd"
          }
        ]
      },
      {
        "elementType": "geometry.fill",
        "stylers": [
          {
            "weight": 1
          }
        ]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#523735"
          }
        ]
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [
          {
            "color": "#f5f1e6"
          }
        ]
      },
      {
        "featureType": "administrative",
        "elementType": "geometry.stroke",
        "stylers": [
          {
            "color": "#c9b2a6"
          }
        ]
      },
      {
        "featureType": "administrative.land_parcel",
        "elementType": "geometry.stroke",
        "stylers": [
          {
            "color": "#dcd2be"
          }
        ]
      },
      {
        "featureType": "administrative.land_parcel",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#ae9e90"
          }
        ]
      },
      {
        "featureType": "landscape.natural",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#dfd2ae"
          }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#dfd2ae"
          }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#93817c"
          }
        ]
      },
      {
        "featureType": "poi.attraction",
        "elementType": "geometry.fill",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry.fill",
        "stylers": [
          {
            "color": "#a5b076"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#447530"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#f5f1e6"
          }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#fdfcf8"
          }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "geometry.fill",
        "stylers": [
          {
            "color": "#747678"
          },
          {
            "weight": 2
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#f8c967"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
          {
            "color": "#e9bc62"
          }
        ]
      },
      {
        "featureType": "road.highway.controlled_access",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#e98d58"
          }
        ]
      },
      {
        "featureType": "road.highway.controlled_access",
        "elementType": "geometry.stroke",
        "stylers": [
          {
            "color": "#db8555"
          }
        ]
      },
      {
        "featureType": "road.local",
        "elementType": "geometry.fill",
        "stylers": [
          {
            "color": "#747678"
          },
          {
            "weight": 4.5
          }
        ]
      },
      {
        "featureType": "road.local",
        "elementType": "geometry.stroke",
        "stylers": [
          {
            "weight": 6.5
          }
        ]
      },
      {
        "featureType": "road.local",
        "elementType": "labels.text",
        "stylers": [
          {
            "color": "#747678"
          }
        ]
      },
      {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#feee0a"
          }
        ]
      },
      {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#dfd2ae"
          }
        ]
      },
      {
        "featureType": "transit.line",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#8f7d77"
          }
        ]
      },
      {
        "featureType": "transit.line",
        "elementType": "labels.text.stroke",
        "stylers": [
          {
            "color": "#ebe3cd"
          }
        ]
      },
      {
        "featureType": "transit.station",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#dfd2ae"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [
          {
            "color": "#24e2e5"
          },
          {
            "saturation": -45
          },
          {
            "lightness": -40
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#92998d"
          }
        ]
      }
    ]
  });
  getRestaurants(); // calls the getRestaurants method
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(search);

  var marker = new google.maps.Marker({
    map: map,
    animation: google.maps.Animation.DROP
  });
}

// checking the screen width to determine the zoom number
var zoomNumber = function () {
  if (window.innerWidth > 700) {
    zm = 17;
  }
  if (window.innerWidth > 600) {
    zm = 16;
  } else {
    zm = 15;
  }
};

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
  map.setZoom(zm);
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

  // called by the reset to set everything to the initial state
  self.clear = function () {
    showListings();
    infoWindow.close(map);
    self.filterItem('');
    self.filteredList(self.restaurantArrayFix()); // updates the filteredList calling the restaurantArrayFix array
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
      return markers;
    } else {
      self.filteredList([]); // empty the array before pushing the restaurants what contains the typed characters
      var bounds = new google.maps.LatLngBounds();
      for (var i = 0, len = self.filterItemLength(); i < len; i++) {
        if (restaurantArray[i].names.toLowerCase().indexOf(filter) != -1) {
          restaurantArray[i].markers.setMap(map);
          self.filteredList.push(restaurantArray[i]); // adding the restaurant array to update the menu with the available restaurants
          bounds.extend(restaurantArray[i].locations);
          map.fitBounds(bounds);
          map.setZoom(zm);
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
        map.setZoom(zm + 2);
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

appVM = new AppViewModel();

ko.applyBindings(appVM);