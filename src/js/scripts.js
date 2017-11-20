const app = {};

app.map;

app.markers = [];

app.totalItems = 0;

app.placeApiUrl = 'https://api.foursquare.com/v2/venues/search';
app.placeApiClientId = '1JM0YWOJPR4JMQ3VTCFJTHCOZIDYQQ1ZQICNZNQ2JPTVXO5B';
app.placeApiKey = '3P0H0ECHZUY2JQQTZWDGW4C4G1F1JPMBJQIPCMUTGHVWJI5W';

// Gets info from Foursquare API
app.getPlaces = function(location) {
	$.ajax({
		url: app.placeApiUrl,
		method: "GET",
		data: {
      client_id: app.placeApiClientId,
      client_secret: app.placeApiKey,
      ll: location,
      v: new Date().toISOString().slice(0,10).replace(/-/g,""),
      limit: 50
		}
	}).then(function(places) {
    console.log(places);

    app.generatePlaces(places);
	});
};

// Generates the base map for the app
app.generateMap = function() {
  const mapContainer = $('.map__map')[0];

  const mapStyle = [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#333333"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#fefefe"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#fefefe"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":20}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":21}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#a0d683"},{"lightness":21}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#ffffff"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#f2f2f2"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#b2e2f0"}]}];

  const mapInfo = {
    center: {
      lat: 50,
      lng: -100
    },
    scrollwheel: false,
    zoom: 3,
    styles: mapStyle,
    disableDefaultUI: true,
    zoomControl: true
  };

  app.map = new google.maps.Map(mapContainer, mapInfo);

  let center = app.map.getCenter();

  google.maps.event.addDomListener(window, 'resize', function() {
    app.map.setCenter(center);
  });
}

// Gets location via geolocation and adds address to location input
app.getGeolocation = function() {
  $('.options__units--geolocate').html('<i class="fa fa-spinner fa-pulse fa-fw"></i><span class="accessible">Loading...</span>');

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      let myLatLng = {lat: position.coords.latitude, lng: position.coords.longitude};

      let checkInput = setInterval(function() {
        let location = $('.options__search input#location').val();

        if(location !== '') {
          clearInterval(checkInput);
          $('.options__units--geolocate').html('<i class="fa fa-location-arrow" aria-hidden="true"></i><span class="accessible">Use Current Location</span>')
          $('.options__button--search').removeAttr('disabled');
        }
      }, 500);

      new google.maps.Geocoder().geocode({'location': myLatLng}, function(results, status) {
        $('.options__search input#location').val(results[0].formatted_address);
      });
    });
  } else {
    alert('Error: The Geolocation service failed. Please enter your location manually.')
  }
}

// Gets location via user input, adds address to input, and generates marker
app.setLocation = function() {
  let location = $('.options__search input#location').val();

  new google.maps.Geocoder().geocode({'address': location}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      if(typeof app.markers[0] !== "undefined") {
				for(let i = 0; i < app.markers.length; i++) {
					app.markers[i].setMap(null);
				}

				app.markers.splice(0, app.markers.length);
      }

      let homeMarker = new google.maps.Marker({
        map: app.map,
        animation: google.maps.Animation.DROP,
        position: results[0].geometry.location,
        icon: {
          path: fontawesome.markers.MAP_MARKER,
          strokeWeight: 0,
          fillColor: '#ff751a',
          fillOpacity: 1
        }
      });

      app.markers.push(homeMarker);

      let latLngString = `${homeMarker.position.lat()},${homeMarker.position.lng()}`;

      app.map.setZoom(16);
      app.map.setCenter(homeMarker.position);

      google.maps.event.addDomListener(app.map, 'idle', function() {
        app.map.getCenter();
      });

      google.maps.event.addDomListener(window, 'resize', function() {
        app.map.setCenter(homeMarker.position);
      });

      app.mapZoomClick(homeMarker);

      app.getPlaces(latLngString);
    } else {
      if(status === 'ZERO_RESULTS') {
        alert('Your search location could not be found. Please try again.')
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    }
  });
}

// Generates place markers on map and fills out number of results in overlay
app.generatePlaces = function(places) {
  for (let i in places.response.venues) {
    let placeMarker = new google.maps.Marker({
      map: app.map,
      position: places.response.venues[i].location,
			label: {
	      text: (parseInt(i) + 1).toString(),
	      color: 'white',
	    },
      icon: app.generatePlaceMarkerSymbol('#27b2d0')
    });

		placeMarker.addListener('click', app.changePlaceMarkerColour);

    app.markers.push(placeMarker);

    app.mapZoomClick(placeMarker);
  }

	app.totalItems = places.response.venues.length;
  $('.map__results-number').text(app.totalItems);
}

// Zooms map and centers around marker on click
app.mapZoomClick = function(marker) {
  marker.addListener('click', function() {
    app.map.setZoom(18);
    app.map.setCenter(this.position);
  });
}

// Changes the colour of the active place marker
app.changePlaceMarkerColour = function() {
  app.restorePlaceMarkerColour();
  this.setIcon(app.generatePlaceMarkerSymbol('#14192d'));
}

// Generates the place marker symbol
app.generatePlaceMarkerSymbol = function(colour) {
  return {
		path: fontawesome.markers.CIRCLE,
		scale: 0.5,
		strokeWeight: 0,
		fillColor: colour,
		fillOpacity: 1,
		origin: new google.maps.Point(0, 0),
		labelOrigin: new google.maps.Point(27,-33)
  };
}

// Restores the colour of the place marker when it isn't the active one
app.restorePlaceMarkerColour = function() {
	for (var i = 1; i < app.markers.length; i++) {
  	app.markers[i].setIcon(app.generatePlaceMarkerSymbol('#27b2d0'));
	}
}

// Changes the active tab based on which tab was clicked
app.changeActiveTab = function(that) {
  let tabTitle = that.data('title');

  if(tabTitle) {
    $('.options__tabs-item').removeClass('options__tabs-item--active');
    that.addClass('options__tabs-item--active');

    $('.options__content-item').removeClass('options__content-item--active');
    $('.options__content-item').each(function(i) {
      if($('.options__content-item').eq(i).data('title') === tabTitle) {
        $(this).addClass('options__content-item--active');
      }
    });
  }
}

// Initializes app
app.init = function() {
  app.generateMap();

  $('.options__units--geolocate').on('click', function() {
    $('.options__button--search').attr('disabled', 'disabled');
    app.getGeolocation();
  });

  $('.options__search input#location').on('keypress', function() {
    $('.options__button--search').removeAttr('disabled');
  });

  $('.options__button--search').on('click', function() {
    app.setLocation();
  });

  $('.options__tabs-item').on('click', function() {
    app.changeActiveTab($(this));
  });
}

$(function() {
  app.init();
});
