const app = {};

app.directionsService;
app.directionsDisplay;

app.map;

app.buttonClicks = 0;

app.location = false;
app.distance = false;
app.submit = false;

app.markers = [];

app.distanceRadius;

app.lat = 0;
app.lng = 0;
app.latLngString = '';
app.date = '';
app.distance = 0;
app.categories = [];

app.categoryIconNameArray = [];

app.selectedEventLatLngString = '';

app.blue = '#27b2d0';
app.navy = '#14192d';
app.orange = '#ff751a';
app.googleBlue = '#3e91ce';

app.eventApiUrl = 'https://api.eventful.com/json';
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

  app.enableRoutes();
}

// Enables routes displaying on the map
app.enableRoutes = function() {
  app.directionsService = new google.maps.DirectionsService;
  app.directionsDisplay = new google.maps.DirectionsRenderer({
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: app.googleBlue,
      strokeWeight: 5,
      strokeOpacity: 0.75
    }
  });

  app.directionsDisplay.setMap(app.map);
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

// Generates categories in Interests tab
app.generateCategories = function(categories) {
	for (let i in categories.category) {
		let id = categories.category[i].id;
		let name = categories.category[i].name;

		$('.options__checkbox').append(`<div><input type="checkbox" id="${id}" name="interests" value="${id}" class="accessible options__radio"><label for="${id}">${name}</label></div>`);

    let iconNameArray = ['music', 'users', 'smile-o', 'mortar-board', 'child', 'ticket', 'film', 'cutlery', 'usd', 'paint-brush', 'heartbeat', 'tree', 'book', 'fort-awesome', 'home', 'comments', 'glass', 'university', 'sitemap', 'sun-o', 'microphone', 'paw', 'hand-rock-o', 'shopping-cart', 'flask', 'bell', 'soccer-ball-o', 'cogs', 'asterisk'];

    app.categoryIconNameArray.push({icon: iconNameArray[i], name: name});
	}
}

// Clears all markers and routes off the map and disables info tab
app.clearMap = function() {
  if(typeof app.markers[0] !== "undefined") {
    for(let i = 0; i < app.markers.length; i++) {
      app.markers[i].setMap(null);
    }

    app.markers.splice(0, app.markers.length);
  }

  app.clearRoute();

  $('.options__tabs-item[data-title="info"]').addClass('options__tabs-item--disabled');
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
        position: results[0].geometry.location,
        icon: {
          path: fontawesome.markers.MAP_MARKER,
          strokeWeight: 0,
          fillColor: app.orange,
          fillOpacity: 1
        }
      });

      app.markers.push(homeMarker);

			app.lat = homeMarker.position.lat();
			app.lng = homeMarker.position.lng();
      app.latLngString = `${app.lat},${app.lng}`;

			app.map.setCenter(homeMarker.position);
      if(app.buttonClicks === 0) {
        app.map.setZoom(15);
      }

      app.buttonClicks++;

      google.maps.event.addDomListener(window, 'resize', function() {
        app.map.setCenter(homeMarker.position);
      });

      if(app.distance) {
        app.drawDistanceRadius();
      }
    } else {
      if(status === 'ZERO_RESULTS') {
        alert('Your search location could not be found. Please try again.')
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    }
  });
}

// Draws distance radius, clear previous distance radius if applicable, and automatically fits to map
app.drawDistanceRadius = function() {
  if(typeof app.distanceRadius !== "undefined") {
    app.distanceRadius.setMap(null);
  }

	app.distance = $('.options__input--distance').val();

	let radius = (parseInt(app.distance) * 1000) + 100;

	app.distanceRadius = new google.maps.Circle({
    strokeColor: app.orange,
    strokeOpacity: 1,
    strokeWeight: 2,
    fillColor: app.orange,
    fillOpacity: 0.35,
    map: app.map,
    center: {
			lat: app.lat,
			lng: app.lng
		},
    radius: radius,
    zIndex: -1
  });

	app.map.fitBounds(app.distanceRadius.getBounds());
}

// Gets info from Eventful API
app.getEvents = function() {
	app.date = $('input[name="date"]:checked').val();

  app.distance = $('.options__input--distance').val();

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
      sort_order: 'popularity',
      within: app.distance,
			category: app.categories,
			units: 'km',
      include: 'price,categories',
			page_size: 100,
      change_multi_day_start: true
		}
	}).then(function(events) {
		if(events.total_items === '0') {
			alert('Your search returned 0 results. Please try again with less strict restrictions.');
		} else {
      app.removeDuplicateVenues(events);
		}
	});
};

// Removes duplicate venues from events before they are added to the map
app.removeDuplicateVenues = function(events) {
  let eventArray = [];
  let venueLatitudes = [];
  let venueLongitudes = [];

  for (let i in events.events.event) {
    eventArray.push(events.events.event[i]);
  }

  let uniqueEventArray = eventArray.filter(function(object) {
    if (venueLatitudes.indexOf(object.latitude) !== -1 && venueLongitudes.indexOf(object.longitude) !== -1) {
      return false;
    }

    venueLatitudes.push(object.latitude);
    venueLongitudes.push(object.longitude);

    return true;
  });

  app.generateLegend(uniqueEventArray);
}

// Generates alphabetical legend with categories for returned events and icons for each category
app.generateLegend = function(events) {
  let categoriesNameArray = [];

  for (let i in events) {
    categoriesNameArray.push(events[i].categories.category[0].name);
  }

  let filteredCategoriesIconNameArray = app.categoryIconNameArray.filter(function(item) {
    return categoriesNameArray.indexOf(item.name) !== -1;
  });

  filteredCategoriesIconNameArray.sort(function(a, b) {
    if (a.name < b.name) {
      return -1;
    }

    if (a.name > b.name) {
      return 1;
    }

    return 0;
  });

  for (let i in filteredCategoriesIconNameArray) {
    $('.map__legend').append(`<div class="map__legend-item"><i class="fa fa-${filteredCategoriesIconNameArray[i].icon}" aria-hidden="true"></i> <span>${filteredCategoriesIconNameArray[i].name}</span></div>`).removeClass('map__legend--hidden');
  }

  app.generateEvents(events);
}

// Generates event markers on map, removes spinner in Instructions tab, and gets venue id of selected venue
app.generateEvents = function(events) {
  for (let i in events) {
    const icons = app.categoryIconNameArray.find(function(icon) {
      return icon.name === events[i].categories.category[0].name;
    });

    let iconName = icons.icon.replace(/-|\s/g,"_").toUpperCase();

    let eventMarker = new google.maps.Marker({
      map: app.map,
      position: {
        lat: parseFloat(events[i].latitude),
        lng: parseFloat(events[i].longitude)
      },
      icon: app.generateEventMarkerSymbol(app.blue, iconName),
      originalColor: app.blue,
      originalIcon: iconName
    });

    app.markers.push(eventMarker);

		eventMarker.addListener('click', function() {
      app.selectedEventLatLngString = `${events[i].latitude},${events[i].longitude}`;

      app.clearRoute();

      app.changeEventMarkerColour(this, app.navy, iconName);
      app.showEventInfoTab(events[i].venue_id);
    });
  }

  $('.spinner').hide();
}

// Redraws the distance radius (if applicable), hides the legend and removes the items, shows the spinner again, and clears event markers
app.clearEvents = function() {
  $('.map__legend').addClass('map__legend--hidden');
  $('.map__legend-item').remove();

  $('.spinner').show();

  for (var i = 1; i < app.markers.length; i++) {
    app.markers[i].setMap(null);
  }

  app.markers.splice(1);
}

// Generates the event marker symbol
app.generateEventMarkerSymbol = function(colour, iconName) {
  return {
		path: fontawesome.markers[iconName],
		scale: 0.35,
		strokeWeight: 0,
		fillColor: colour,
		fillOpacity: 1
  };
}

// Changes the colour of the active event marker
app.changeEventMarkerColour = function(that, colour, iconName) {
  app.restoreEventMarkerColour();

  that.setIcon(app.generateEventMarkerSymbol(colour, iconName));
}

// Restores the colour of the event marker when it isn't the active one
app.restoreEventMarkerColour = function() {
	for (var i = 1; i < app.markers.length; i++) {
  	app.markers[i].setIcon(app.generateEventMarkerSymbol(app.markers[i].originalColor, app.markers[i].originalIcon));
	}
}

// Shows the Instructions tab and removes the active classes from other tabs
app.showInstructions = function() {
	$('.options__tabs-item').removeClass('options__tabs-item--active');
	$('.options__content-item').removeClass('options__content-item--active');

	$('.options__content-item[data-title="instructions"]').addClass('options__content-item--active');
}

// Shows the Event Info tab and removes the active class from other tabs
app.showEventInfoTab = function(venueId) {
	$('.options__tabs-item').removeClass('options__tabs-item--active');
	$('.options__content-item').removeClass('options__content-item--active');

	$('.options__tabs-item[data-title="info"]').addClass('options__tabs-item--active').removeClass('options__tabs-item--disabled');
	$('.options__content-item[data-title="info"]').addClass('options__content-item--active');

  app.getSelectedVenueInfo(venueId);
}

// Gets info about selected venue from the Eventful API
app.getSelectedVenueInfo = function(venueId) {
  $.ajax({
		url: `${app.eventApiUrl}/events/search`,
		method: 'GET',
		dataType: 'jsonp',
		data: {
			app_key: app.eventApiKey,
      location: venueId,
			date: app.date,
      sort_order: 'popularity',
			category: app.categories,
			units: 'km',
      include: 'price,categories',
      page_size: 1,
      change_multi_day_start: true
		}
	}).then(function(selectedVenueEvent) {
    app.generateSelectedVenueEvents(selectedVenueEvent)
	});
}

// Generates an event going on at the selected venue, displays the info in the Event Info tab, and converts the returned date and time to a human-readable form
app.generateSelectedVenueEvents = function(selectedVenueEvent) {
  $('.options__event').empty();

  let selectedEvent = selectedVenueEvent.events.event[0];

  selectedEvent.start_time = selectedEvent.start_time.slice(0, -3);

  let months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let selectedEventDate = selectedEvent.start_time.match(/^(\S+)\s(.*)/).slice(1);
  let selectedEventDay = selectedEventDate[0];
  let selectedEventTime = selectedEventDate[1];

  selectedEventDay = selectedEventDay.split('-');
  selectedEventDay = months[selectedEventDay[1]] + ' ' + selectedEventDay[2] + ', ' + selectedEventDay[0];

  selectedEventTime = selectedEventTime.split(':');

  let selectedEventHour = parseInt(selectedEventTime[0]);
  let selectedEventMinute = selectedEventTime[1];
  let selectedEventPeriod = '';

  if(selectedEventHour > 12) {
    selectedEventHour = selectedEventHour - 12;
    selectedEventPeriod = 'pm';
  } else {
    selectedEventPeriod = 'am'
  }

  $('.options__event').append(`<a href="${selectedEvent.url}" target="_blank"><h4>${selectedEvent.title}</h4></a><p class="normal">${selectedEvent.venue_name}</p><p class="normal">${selectedEvent.venue_address}, ${selectedEvent.city_name}</p><p class="normal">${selectedEventDay} at ${selectedEventHour}:${selectedEventMinute}${selectedEventPeriod}</p><div class="options__event-description">${(selectedEvent.description ? selectedEvent.description : '')}</div><a href="${selectedEvent.url}" target="_blank" class="options__event-link">More Info <i class="fa fa-chevron-right" aria-hidden="true"></i></button>`);

  if($('.options__event-description').height() > 160) {
    $('.options__event-description').addClass('options__event-description--scroll');
  }
}

// Gets users mode of transportation selection and calls function that gets directions
app.getTransportationMode = function() {
  let mode = $('input[name="transportation"]:checked').val();

  app.getDirectionsRoute(mode);
}

// Gets directions and route from home location to selected event
app.getDirectionsRoute = function(mode) {
  app.directionsService.route({
    origin: app.latLngString,
    destination: app.selectedEventLatLngString,
    travelMode: mode.toUpperCase()
  }, function(results, status) {
    if (status === 'OK') {
      app.generateRoute(results);
      app.generateDirections(results, mode);
    } else {
      alert('Directions request failed due to ' + status);
    }
  });
}

// Generates the route from home location to selected event on the map
app.generateRoute = function(route) {
  app.directionsDisplay.setDirections(route);
}

// Clears route on map and disables transportation and directions tabs
app.clearRoute = function() {
  app.directionsDisplay.setMap(null);

  app.enableRoutes();

  $('.options__tabs-item[data-title="transportation"], .options__tabs-item[data-title="directions"]').addClass('options__tabs-item--disabled');
}

// Generates the directions from home location to selected event in the directions tab
app.generateDirections = function(directions, mode) {
  $('.options__directions-info').empty();
  $('.options__directions-items').empty();

  $('.options__directions-info').append('<p><span class="normal">Mode:</span> <span class="mode"></span></p><p><span class="normal">Distance:</span> <span class="distance"></span></p><p><span class="normal">Time:</span> <span class="time"></span></p>');

  $('.mode').text(mode);

  let steps = directions.routes[0].legs[0].steps;

  for (let i in steps) {
    $('.distance').text(steps[i].distance.text);
    $('.time').text(steps[i].duration.text);
    $('.options__directions-items').append(`<p>${parseInt(i) + 1}. ${steps[i].instructions}</p>`);
  }

  if($('.options__directions-items').height() > 235) {
    $('.options__directions-items').addClass('options__directions-items--scroll');
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

	if(currentIndex > totalTabs - 3) {
		currentIndex--;
	}

	$('.options__tabs-item').eq(currentIndex + 1).removeClass('options__tabs-item--disabled').click();
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
    app.location = true;
  });

	$('.options__button--distance').on('click', function() {
    app.drawDistanceRadius();
    app.distance = true;
  });

	$('.options__button--submit').on('click', function() {
    app.showInstructions();
		app.getEvents();
    app.submit = true;
  });

  $('.options__button--transportation').on('click', function() {
    app.getTransportationMode();
  });

  $('.options__tabs-item').on('click', function() {
    app.changeActiveTabClick($(this));
  });

  $('.options__tabs-item:not([data-title="info"], [data-title="transportation"], [data-title="directions"])').on('click', function() {
    if(app.location) {
      app.setLocation();
    }

    if(app.submit) {
      app.clearEvents();
    }
  });

	$('.options__button--next:not(.options__button--submit)').on('click', function() {
		app.changeActiveTabNext($(this));
	});
}

$(function() {
  app.init();
});
