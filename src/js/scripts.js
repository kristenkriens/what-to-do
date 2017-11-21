const app = {};

app.map;

app.markers = [];

app.eventApiUrl = 'http://api.eventful.com/json/events/search';
app.eventApiKey = 'srQBgzwWJzXwZcrM';

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
}

// Gets location via geolocation and adds address to location input
app.getGeolocation = function() {
	$('.options__button--location').attr('disabled', 'disabled');
  $('.options__units--geolocate').html('<i class="fa fa-spinner fa-pulse fa-fw"></i><span class="accessible">Loading...</span>');

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      let myLatLng = {lat: position.coords.latitude, lng: position.coords.longitude};

      let checkInput = setInterval(function() {
        let location = $('.options__input--location').val();

        if(location !== '') {
          clearInterval(checkInput);
          $('.options__units--geolocate').html('<i class="fa fa-location-arrow" aria-hidden="true"></i><span class="accessible">Use Current Location</span>')
          $('.options__button--location').removeAttr('disabled');
        }
      }, 500);

      new google.maps.Geocoder().geocode({'location': myLatLng}, function(results, status) {
        $('.options__input--location').val(results[0].formatted_address);
      });
    });
  } else {
    alert('Error: The Geolocation service failed. Please enter your location manually.')
  }
}

// Gets location via user input, adds address to input, and generates marker
app.setLocation = function() {
  let location = $('.options__input--location').val();

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
          fillOpacity: 1,
					origin: new google.maps.Point(0, 0)
        }
      });

      app.markers.push(homeMarker);

      let latLngString = `${homeMarker.position.lat()},${homeMarker.position.lng()}`;

			app.getEvents(latLngString);

      google.maps.event.addDomListener(app.map, 'idle', function() {
        app.map.getCenter();
      });

      google.maps.event.addDomListener(window, 'resize', function() {
        app.map.setCenter(homeMarker.position);
      });

      app.mapZoomClick(homeMarker);
    } else {
      if(status === 'ZERO_RESULTS') {
        alert('Your search location could not be found. Please try again.')
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    }
  });
}

// Gets info from Eventful API
app.getEvents = function(location) {
	$.ajax({
		url: app.eventApiUrl,
		method: 'GET',
		dataType: 'jsonp',
		data: {
			app_key: app.eventApiKey,
      location: location,
      within: '100',
			units: 'km',
			page_size: 100
		}
	}).then(function(events) {
		app.generateEvents(events);
	});
};

// Generates event markers on map and fills out number of results in overlay
app.generateEvents = function(events) {
	let event = events.events.event;
	console.log(event)
  for (let i in event) {
    let eventMarker = new google.maps.Marker({
      map: app.map,
      position: {
				lat: parseFloat(event[i].latitude),
				lng: parseFloat(event[i].longitude)
			},
			label: {
	      text: (parseInt(i) + 1).toString(),
	      color: 'white',
	    },
      icon: app.generateEventMarkerSymbol('#27b2d0')
    });

    app.markers.push(eventMarker);

		app.fitMapToMarkers();

    app.mapZoomClick(eventMarker);

		eventMarker.addListener('click', app.changeEventMarkerColour);
  }

	let totalItems = event.length;
  $('.map__results-number').text(totalItems);
}

// Generates the event marker symbol
app.generateEventMarkerSymbol = function(colour) {
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

// Automatically adjusts map so all markers fit on screen
app.fitMapToMarkers = function() {
	let newBoundary = new google.maps.LatLngBounds();

	for(let index in app.markers){
		let position = app.markers[index].position;
		newBoundary.extend(position);
	}

	app.map.fitBounds(newBoundary);
}

// Zooms map and centers around marker on click
app.mapZoomClick = function(marker) {
  marker.addListener('click', function() {
    app.map.setZoom(18);
    app.map.setCenter(this.position);
  });
}

// Changes the colour of the active event marker
app.changeEventMarkerColour = function() {
  app.restoreEventMarkerColour();
  this.setIcon(app.generateEventMarkerSymbol('#14192d'));
}

// Restores the colour of the event marker when it isn't the active one
app.restoreEventMarkerColour = function() {
	for (var i = 1; i < app.markers.length; i++) {
  	app.markers[i].setIcon(app.generateEventMarkerSymbol('#27b2d0'));
	}
}

// Changes the active tab based on which tab was clicked
app.changeActiveTabClick = function(that) {
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

// Changes the active tab based on which tab was clicked and enables disabled tabs once they have been active
app.changeActiveTabNext = function(that) {
	let tabs = $('.options__tabs').children();
	let currentIndex = that.parent().index();

	tabs.eq(currentIndex + 1).removeClass('options__tabs-item--disabled').click();
}

// Initializes app
app.init = function() {
  app.generateMap();

  $('.options__units--geolocate').on('click', function() {
    app.getGeolocation();
  });

  $('.options__input--location').on('keypress', function() {
    $('.options__button--location').removeAttr('disabled');
  });

  $('.options__button--location').on('click', function() {
    app.setLocation();
  });

  $('.options__tabs-item').on('click', function() {
    app.changeActiveTabClick($(this));
  });

	$('.options__button--next').on('click', function() {
		app.changeActiveTabNext($(this));
	});
}

$(function() {
  app.init();
});
