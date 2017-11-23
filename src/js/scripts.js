const app = {};

app.map;

app.markers = [];

app.distanceRadius;

app.lat = 0;
app.lng = 0;
app.latLngString = '';
app.date = '';
app.distance = 0;
app.categories = [];

app.eventApiUrl = 'https://api.eventful.com/json';
app.eventApiKey = 'srQBgzwWJzXwZcrM';

// Generates the base map for the app
app.generateMap = function() {
  const mapContainer = $('.map')[0];

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

// Clears all markers and circles off the map
app.clearMap = function() {
  if(typeof app.markers[0] !== "undefined") {
    for(let i = 0; i < app.markers.length; i++) {
      app.markers[i].setMap(null);
    }

    app.markers.splice(0, app.markers.length);
  }
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

// Gets location via user input, adds address to input, generates marker, clears map first to avoid multiple sets of searches on the map at once
app.setLocation = function() {
  let location = $('.options__input--location').val();

  new google.maps.Geocoder().geocode({'address': location}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      app.clearMap();

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

			app.lat = homeMarker.position.lat();
			app.lng = homeMarker.position.lng();
      app.latLngString = `${app.lat},${app.lng}`;

			app.map.setCenter(homeMarker.position);
			app.map.setZoom(12);

      google.maps.event.addDomListener(window, 'resize', function() {
        app.map.setCenter(homeMarker.position);
      });
    } else {
      if(status === 'ZERO_RESULTS') {
        alert('Your search location could not be found. Please try again.')
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    }
  });
}

// Gets all categories from Eventful API
app.getCategories = function() {
	$.ajax({
		url: `${app.eventApiUrl}/categories/list`,
		method: 'GET',
		dataType: 'jsonp',
		data: {
			app_key: app.eventApiKey,
		}
	}).then(function(categories) {
		app.generateCategories(categories);
	});
}

app.generateCategories = function(categories) {
	for (let i in categories.category) {
		let id = categories.category[i].id;
		let name = categories.category[i].name;

		$('.options__checkbox-scroll').append(`<div><input type="checkbox" id="${id}" name="interests" value="${id}" class="accessible options__radio"><label for="${id}">${name}</label></div>`);
	}
}

// Gets info from Eventful API
app.getEvents = function() {
	app.date = $('input[name="date"]:checked').val();

	app.categories = $('input[name="interests"]:checked').map(function() {
		return this.value;
	}).get().join(',');

	$('.map__results-number').html('<i class="fa fa-spinner fa-pulse fa-fw"></i><span class="accessible">Loading...</span>');

	$.ajax({
		url: `${app.eventApiUrl}/events/search`,
		method: 'GET',
		dataType: 'jsonp',
		data: {
			app_key: app.eventApiKey,
      location: app.latLngString,
			date: app.date,
      within: app.distance,
			category: app.categories,
			units: 'km',
      include: 'price',
			page_size: 50,
      change_multi_day_start: true
		}
	}).then(function(events) {
		if(events.total_items === '0') {
			alert('Your search returned 0 results. Please try again with less strict restrictions.');
		} else {
			app.generateEvents(events);
		}
	});
};

// Draws distance radius, clear previous distance radius if applicable, and automatically fits to map
app.drawDistanceRadius = function() {
  if(typeof app.distanceRadius !== "undefined") {
    app.distanceRadius.setMap(null);
  }

	app.distance = $('.options__input--distance').val();

	let radius = parseInt(app.distance) * 1000;

	app.distanceRadius = new google.maps.Circle({
    strokeColor: '#ff751a',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#ff751a',
    fillOpacity: 0.35,
    map: app.map,
    center: {
			lat: app.lat,
			lng: app.lng
		},
    radius: radius
  });

	app.map.fitBounds(app.distanceRadius.getBounds());
}

// Generates event markers on map and removes spinner in Instructions tab
app.generateEvents = function(events) {
	let event = events.events.event;

  for (let i in event) {
    let eventMarker = new google.maps.Marker({
      map: app.map,
      position: {
				lat: parseFloat(event[i].latitude),
				lng: parseFloat(event[i].longitude)
			},
      icon: app.generateEventMarkerSymbol('#27b2d0')
    });

    app.markers.push(eventMarker);

		eventMarker.addListener('click', app.changeEventMarkerColour);

    eventMarker.addListener('click', function() {
      app.showEventInfoTab(this);
    });
  }

  $('.spinner').remove();
}

// Generates the event marker symbol
app.generateEventMarkerSymbol = function(colour) {
  return {
		path: fontawesome.markers.CIRCLE,
		scale: 0.35,
		strokeWeight: 0,
		fillColor: colour,
		fillOpacity: 1
  };
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
	let currentIndex = that.parent().index();
	let totalTabs = $('.options__tabs-item').length;

	if(currentIndex > totalTabs - 2) {
		currentIndex--;
	}

	$('.options__tabs-item').eq(currentIndex + 1).removeClass('options__tabs-item--disabled').click();
}

// Shows the Instructions tab and removes the active classes from other tabs
app.showInstructions = function() {
	$('.options__tabs-item').removeClass('options__tabs-item--active');
	$('.options__content-item').removeClass('options__content-item--active');

	$('.options__content-item[data-title="instructions"]').addClass('options__content-item--active');
}

// Shows the Event Info tab, removes the disabled class from the Directions tab, and removes the active class from other tabs
app.showEventInfoTab = function(that) {
	$('.options__tabs-item').removeClass('options__tabs-item--active');
	$('.options__content-item').removeClass('options__content-item--active');

	$('.options__tabs-item[data-title="directions"]').removeClass('options__tabs-item--disabled');
	$('.options__tabs-item[data-title="info"]').addClass('options__tabs-item--active').removeClass('options__tabs-item--disabled');
	$('.options__content-item[data-title="info"]').addClass('options__content-item--active');

  app.getSelectedVenueInfo(that);
}

// Gets info about a specific venue from the Eventful API
app.getSelectedVenueInfo = function(that) {
  let eventLatLngString = `${that.position.lat()},${that.position.lng()}`;

  $.ajax({
		url: `${app.eventApiUrl}/events/search`,
		method: 'GET',
		dataType: 'jsonp',
		data: {
			app_key: app.eventApiKey,
      location: eventLatLngString,
			date: app.date,
      within: 0.001,
			category: app.categories,
			units: 'km',
      include: 'price',
      page_size: 1,
      change_multi_day_start: true
		}
	}).then(function(selectedVenueEvent) {
    app.generateSelectedVenueEvents(selectedVenueEvent)
	});
}

// Generates 1 event going on at the selected venue and displays the info in the Event Info tab
app.generateSelectedVenueEvents = function(selectedVenueEvent) {
  let selectedEvent = selectedVenueEvent.events.event[0];
  let $selectedEventDiv = $('.options__event');

  $selectedEventDiv.append(`
    <h4>${selectedEvent.title}</h4>
    <p class="normal">${selectedEvent.venue_name}</p>
    <p>${selectedEvent.venue_address}, ${selectedEvent.city_name}</p>
    <p>${selectedEvent.description}</p>
    <a href="${selectedEvent.url}" class="button">More Info</button>
  `);

  if($selectedEventDiv.height() > 300) {
    $selectedEventDiv.addClass('options__event--scroll');
  }
}

// Disables next button if the input is empty
app.disableNextButton = function(that, type) {
	if(that.val() !== '') {
		$(`.options__button--${type}`).removeAttr('disabled');
	} else {
		$(`.options__button--${type}`).attr('disabled', 'disabled');
	}
}

// Initializes app
app.init = function() {
  app.generateMap();
	app.getCategories();

  $('.options__units--geolocate').on('click', function() {
    app.getGeolocation();
  });

  $('.options__input--location').on('keyup', function() {
		app.disableNextButton($(this), 'location');
  });

	$('.options__input--distance').on('keyup', function() {
		app.disableNextButton($(this), 'distance');
  });

  $('.options__button--location').on('click', function() {
    app.setLocation();
  });

	$('.options__button--distance').on('click', function() {
    app.drawDistanceRadius();
  });

	$('.options__button--submit').on('click', function() {
    app.showInstructions();
		app.getEvents(app.latLngString);
  });

  $('.options__tabs-item').on('click', function() {
    app.changeActiveTabClick($(this));
  });

	$('.options__button--next:not(.options__button--submit)').on('click', function() {
		app.changeActiveTabNext($(this));
	});
}

$(function() {
  app.init();
});
