const app = {};

app.directionsService;
app.directionsDisplay;

app.map;

app.initialClick = 0;

app.locationClicked = false;
app.distanceClicked = false;
app.submitClicked = false;

app.markers = [];

app.distanceUnits = 'km';
app.distanceRadius;

app.lat = 0;
app.lng = 0;
app.latLngString = '';
app.date = '';
app.distance = 0;
app.categories = [];

app.categoryIconNameArray = [];

app.selectedEventLatLngString = '';
app.selectedEventLatLngArray = [];

app.selectedEvent = {};

app.mode = '';
app.legs = {};

app.blue = '#27b2d0';
app.navy = '#14192d';
app.orange = '#ff751a';
app.googleBlue = '#3e91ce';

app.eventApiUrl = 'https://api.eventful.com/json';
app.eventApiKey = 'srQBgzwWJzXwZcrM';

app.emailApiUrl = 'https://api.elasticemail.com/v2/email/send';
app.emailApiKey = '5d043e12-0cbd-4da7-b0bb-ed5ec2a22030';

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
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false
  };

  app.map = new google.maps.Map(mapContainer, mapInfo);

  app.enableRoutes();
  app.enableAutocomplete();
}

// Enables address/location autocomplete from Google Maps Places API
app.enableAutocomplete = function() {
  let input = $('.options__input--location')[0];
  let searchBox = new google.maps.places.SearchBox(input);

  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }
  });
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

// Generates categories in Categories tab
app.generateCategories = function(categories) {
	for (let i in categories.category) {
		let id = categories.category[i].id;
		let name = categories.category[i].name;

		$('.options__categories').append(`<div><input type="checkbox" id="${id}" name="categories" value="${id}" class="accessible"><label for="${id}">${name}</label></div>`);

    let iconNameArray = ['music', 'users', 'smile-o', 'mortar-board', 'child', 'ticket', 'film', 'cutlery', 'usd', 'paint-brush', 'heartbeat', 'tree', 'book', 'fort-awesome', 'home', 'comments', 'glass', 'university', 'sitemap', 'sun-o', 'microphone', 'paw', 'hand-rock-o', 'shopping-cart', 'flask', 'bell', 'soccer-ball-o', 'desktop', 'asterisk'];

    app.categoryIconNameArray.push({icon: iconNameArray[i], name: name});
	}
}

// Generates an overlay
app.generateOverlay = function(text, email) {
  if(email) {
    $(`<div class="overlay overlay--email"><div class="overlay__content"><p>Please enter the email you would like the directions sent to!</p><input type="email" placeholder="e.g. example@gmail.com" class="overlay__input overlay__input--email"><button class="overlay__button overlay__button--email" disabled>Send</button><button class="overlay__button overlay__button--close">Cancel</button></div></div>`).hide().appendTo('body').fadeIn(500);
  } else {
    $(`<div class="overlay"><div class="overlay__content"><p class="overlay__text">${text}</p><button class="overlay__button overlay__button--close">Close</button></div></div>`).hide().appendTo('body').fadeIn(500);
  }
}

// Removes the overlay
app.removeOverlay = function(that) {
  $('.overlay').fadeOut(250, function() {
    $(this).remove();
  });

  if(that) {
    if(!that.parent().parent().hasClass('overlay--email')) {
      app.changeActiveTabClick($('.options__tabs-item:first-of-type'));
    }
  }
}

// Clears all markers and routes off the map and disables More Info tab
app.clearMap = function() {
  if(typeof app.markers[0] !== 'undefined') {
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
        if (status === 'OK') {
          $('.options__input--location').val(results[0].formatted_address);
        } else {
          app.generateOverlay('Geocoder failed due to: ' + status  + '. Please enter your location manually.');
        }
      });
    });
  } else {
    app.generateOverlay('The Geolocation service failed. Please enter your location manually.');
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
        draggable: true,
        icon: {
          path: fontawesome.markers.MAP_MARKER,
          strokeWeight: 0,
          fillColor: app.orange,
          fillOpacity: 1,
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(18, -5)
        }
      });

      let infoWindow = new google.maps.InfoWindow({
        content: `I'm draggable!`
      });

      if(app.initialClick === 0) {
        app.map.setZoom(13);

        homeMarker.setAnimation(google.maps.Animation.DROP);

        infoWindow.open(app.map, homeMarker);
      }

      app.initialClick = 1;

      app.markers.push(homeMarker);

			app.lat = homeMarker.position.lat();
			app.lng = homeMarker.position.lng();
      app.latLngString = `${app.lat},${app.lng}`;

			app.map.setCenter(homeMarker.position);

      if(app.distanceClicked) {
        app.drawDistanceRadius();
      }

      google.maps.event.addDomListener(window, 'resize', function() {
        app.map.setCenter(homeMarker.position);
      });

      homeMarker.addListener('dblclick', function() {
        app.zoomMarker(this);
      });

      homeMarker.addListener('dragend', function() {
        app.setNewMarkerLocation(this);
      });
    } else {
      if(status === 'ZERO_RESULTS') {
        app.generateOverlay('Your search location could not be found. Please try again.')
      } else {
        app.generateOverlay('Geocoder failed due to: ' + status  + '. Please enter your location manually.');
      }
    }
  });
}

// Sets new marker location and changes active tab to Categories if on Instructions tab
app.setNewMarkerLocation = function(that) {
  if(app.submitClicked) {
    app.clearEvents();
  }

  if(app.distanceClicked) {
    app.drawDistanceRadius();
  }

  app.map.setCenter(that.position);

  $('.options__input--location').val(`${that.position.lat()}, ${that.position.lng()}`);

  app.setLocation();

  if($('.options__content-item[data-title="instructions"]').hasClass('options__content-item--active')) {
    app.changeActiveTabClick($('.options__tabs-item[data-title="categories"]'));
  }
}

// Sets the distance units to kilometers or miles
app.setDistanceUnits = function(that) {
  app.distanceUnits = (app.distanceUnits === 'km' ? 'mi' : 'km');

  $('.options__content-item[data-title="distance"] .options__input-units label').text(app.distanceUnits);
}

// Generates dates in the select tags if Custom is selected for the date and sets selected date to current date
app.generateDates = function() {
  let currentDate = new Date();

  let currentYear = currentDate.getFullYear();
  let currentDay = currentDate.getDate();
  let currentMonth = currentDate.getMonth() + 1;

  let years = [];

  let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  for(let i = 1; i <= 12; i++) {
    let month = i;

    if(month < 10) {
      month = '0' + month;
    }

    $('.options__input--month').append(`<option value="${month}" ${i == currentMonth ? 'selected' : ''}>${months[i - 1]}</option>`);
  }

  for(let i = 1; i <= 31; i++) {
    let day = i;

    if(i < 10) {
      day = '0' + day;
    }

    $('.options__input--day').append(`<option value="${day}" ${i == currentDay ? 'selected' : ''}>${i}</option>`);
  }

  for(let i = 0; i <= 2; i++) {
    let year = currentYear + i;
    years.push(year);

    $('.options__input--year').append(`<option value="${years[i]}" ${years[i] == currentYear ? 'selected' : ''}>${years[i]}</option>`);
  }
}

// Shows the custom date boxes and disables the next button if Custom is selected for the date
app.showCustomDate = function(that) {
  let dateValue = that.val();

  if(dateValue === 'Custom') {
    $('.options__date').removeClass('options__date--hidden');
  } else {
    $('.options__date').addClass('options__date--hidden');
  }
}

// Shows the second date box so it is a date range
app.showCustomDateRange = function() {
  $('.options__date-end').toggleClass('options__date-end--hidden');
}

// Draws distance radius, clears previous distance radius if applicable, and automatically fits to map
app.drawDistanceRadius = function() {
  if(typeof app.distanceRadius !== 'undefined') {
    app.distanceRadius.setMap(null);
  }

	app.distance = $('.options__input--distance').val();

  let distanceMultiplier;

  if(app.distanceUnits === 'km') {
    distanceMultiplier = 1000;
  } else {
    distanceMultiplier = 1000 * 1.60934;
  }

	let radius = (parseFloat(app.distance) * distanceMultiplier) + 100;

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

// Gets dates from select boxes if Custom is selected for the date
app.getCustomDate = function() {
  let startDay = $('.options__date-start .options__input--day').val();
  let startMonth = $('.options__date-start .options__input--month').val();
  let startYear = $('.options__date-start .options__input--year').val();

  let endDay = startDay;
  let endMonth = startMonth;
  let endYear = startYear;

  if($('.options__date input[type="checkbox"]').is(':checked')) {
    endDay = $('.options__date-end .options__input--day').val();
    endMonth = $('.options__date-end .options__input--month').val();
    endYear = $('.options__date-end .options__input--year').val();
  }

  app.date = `${startYear}${startMonth}${startDay}00-${endYear}${endMonth}${endDay}00`;

  return app.date;
}

// Gets info from Eventful API
app.getEvents = function() {
	app.date = $('input[name="date"]:checked').val();

  if(app.date === 'Custom') {
    app.getCustomDate();
  }

  app.distance = $('.options__input--distance').val();

  if($('.options__categories input:checked').val() === 'No Preference') {
    app.categories = '';
  } else {
    app.categories = $('input[name="categories"]:checked').map(function() {
  		return this.value;
  	}).get().join(',');
  }

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
			units: app.distanceUnits,
      include: 'price,categories',
			page_size: 100
		}
	}).then(function(events) {
		if(events.total_items === '0') {
			app.generateOverlay('Your search returned no results. Please try again with less restrictions or a wider search area.');
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

    window.setTimeout(function() {
      let eventMarker = new google.maps.Marker({
        map: app.map,
        position: {
          lat: parseFloat(events[i].latitude),
          lng: parseFloat(events[i].longitude)
        },
        animation: google.maps.Animation.DROP,
        icon: app.generateEventMarkerSymbol(app.blue, iconName),
        originalColor: app.blue,
        originalIcon: iconName
      });

      app.markers.push(eventMarker);

  		eventMarker.addListener('click', function() {
        app.selectedEventLatLngString = `${events[i].latitude},${events[i].longitude}`;

        app.selectedEventLatLngArray.push(app.selectedEventLatLngString);
        app.selectedEventLatLngArray.splice(0, app.selectedEventLatLngArray.length - 2);

        if(app.selectedEventLatLngArray[0] !== app.selectedEventLatLngArray[1]) {
          app.clearRoute();
          app.showEventInfoTab(events[i].venue_id);
        }

        app.changeEventMarkerColour(this, app.navy, iconName);
      });

      eventMarker.addListener('dblclick', function() {
        app.zoomMarker(this);
      });
    }, i * 50);
  }

  $('.spinner').hide();
}

// Hides the legend and removes the items, shows the spinner again, and clears event markers
app.clearEvents = function() {
  $('.map__legend').addClass('map__legend--hidden');
  $('.map__legend-item').remove();

  $('.spinner').show();

  for (var i = 1; i < app.markers.length; i++) {
    app.markers[i].setMap(null);
  }

  app.markers.splice(1);
}

// Zooms map in to selected marker if it isn't already zoomed in further than 16
app.zoomMarker = function(that) {
  if(app.map.getZoom() < 16) {
    app.map.setZoom(16);
  }

  app.map.setCenter(that.getPosition());
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
			units: app.distanceUnits,
      include: 'price,categories',
      page_size: 1
		}
	}).then(function(selectedVenueEvent) {
    app.generateSelectedVenueEvents(selectedVenueEvent)
	});
}

// Converts date from what is returned by Eventful API to plain English
app.convertEventDate = function(date) {
  let months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  date = date.match(/^(\S+)\s(.*)/).slice(1);

  let day = date[0];
  let time = date[1];

  day = day.split('-');

  day = months[parseInt(day[1])] + ' ' + day[2] + ', ' + day[0];

  time = time.split(':');

  let hour = parseInt(time[0]);
  let minute = time[1];
  let period = '';

  if(hour > 12) {
    hour = hour - 12;
    period = 'pm';
  } else {
    period = 'am'
  }

  time = `${hour}:${minute}${period}`;

  if (hour !== 0) {
    date = `${day} at ${time}`;
  } else {
    date = day;
  }

  return date;
}

// Generates an event going on at the selected venue, displays the info in the Event Info tab, and converts the returned date and time to a human-readable form
app.generateSelectedVenueEvents = function(selectedVenueEvent) {
  $('.options__event').empty();

  app.selectedEvent = selectedVenueEvent.events.event[0];

  app.selectedEvent.start_date = app.convertEventDate(app.selectedEvent.start_time);
  app.selectedEvent.stop_date;
  app.selectedEvent.date;

  if(app.selectedEvent.stop_time === null) {
    app.selectedEvent.stop_date = '';
    app.selectedEvent.date = app.selectedEvent.start_date;
  } else {
    app.selectedEvent.stop_date = app.convertEventDate(app.selectedEvent.stop_time);
    app.selectedEvent.date = `${app.selectedEvent.start_date} - ${app.selectedEvent.stop_date}`;
  }

  $(`<a href="${app.selectedEvent.url}" target="_blank"><h4>${app.selectedEvent.title}</h4></a><p class="normal">${app.selectedEvent.venue_name}</p><p class="normal">${app.selectedEvent.venue_address}, ${app.selectedEvent.city_name}</p><p class="normal">${app.selectedEvent.date}</p><div class="options__event-description">${app.selectedEvent.description}</div><a href="${app.selectedEvent.url}" target="_blank" class="options__event-link">More Info <i class="fa fa-chevron-right" aria-hidden="true"></i></a>`).hide().appendTo('.options__event').fadeIn(500);

  if(app.selectedEvent.description === null) {
    app.selectedEvent.description = 'No event description found';

    $('.options__event-description').remove();
  }

  if($('.options__event-description').height() > 140) {
    $('.options__event-description').addClass('options__event-description--scroll');
  }
}

// Gets users mode of transportation selection and calls function that gets directions
app.getTransportationMode = function() {
  app.mode = $('input[name="transportation"]:checked').val();

  app.getDirectionsRoute();
}

// Gets directions and route from home location to selected event
app.getDirectionsRoute = function() {
  app.directionsService.route({
    origin: app.latLngString,
    destination: app.selectedEventLatLngString,
    travelMode: app.mode.toUpperCase(),
    unitSystem: (app.distanceUnits === 'km' ? google.maps.UnitSystem.METRIC : google.maps.UnitSystem.IMPERIAL)
  }, function(results, status) {
    if (status === 'OK') {
      app.generateRoute(results);
      app.generateDirections(results);
    } else {
      app.generateOverlay('Directions request failed due to: ' + status);
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
app.generateDirections = function(directions) {
  $('.options__directions-info').empty();
  $('.options__directions-items').empty();

  $('.options__directions-info').append('<p><span class="normal">Mode:</span> <span class="mode"></span></p><p><span class="normal">Distance:</span> <span class="distance"></span></p><p><span class="normal">Time:</span> <span class="time"></span></p>');

  $('.mode').text(app.mode);

  app.legs = directions.routes[0].legs[0];

  $('.distance').text(app.legs.distance.text);
  $('.time').text(app.legs.duration.text);

  for (let i in app.legs.steps) {
    $('.options__directions-items').append(`<p>${parseInt(i) + 1}. ${app.legs.steps[i].instructions} (${app.legs.steps[i].distance.text} - ${app.legs.steps[i].duration.text})</p>`);
  }

  if($('.options__directions-items').height() > 235) {
    $('.options__directions-items').addClass('options__directions-items--scroll');
  }
}

// Checks if email address is valid
app.checkEmail = function(email) {
  let testEmail = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;

  if(testEmail.test(email) && email !== '') {
    return true;
  } else {
    return false;
  }
}

// Sends email to user with directions
app.sendEmail = function() {
  let email = $('.overlay__input--email').val();

  let directionsList = '';

  for (let i in app.legs.steps) {
    directionsList = directionsList + `<p>${parseInt(i) + 1}. ${app.legs.steps[i].instructions} (${app.legs.steps[i].distance.text} - ${app.legs.steps[i].duration.text})</p>`;
  }

  $.ajax({
    type: 'POST',
    url: app.emailApiUrl,
    dataType: 'json',
    data: {
      apikey: app.emailApiKey,
      subject: `Directions to ${app.selectedEvent.title}`,
      from: 'kristen@kristenkriens.com',
      fromName: 'What To Do',
      to: email,
      template: 'What To Do',
      merge_eventname: app.selectedEvent.title,
      merge_eventvenue: app.selectedEvent.venue_name,
      merge_eventaddress: `${app.selectedEvent.venue_address}, ${app.selectedEvent.city_name}`,
      merge_eventdate: app.selectedEvent.date,
      merge_eventinfo: app.selectedEvent.description,
      merge_eventlink: app.selectedEvent.url,
      merge_homeaddress: app.legs.start_address,
      merge_mode: app.mode,
      merge_distance: app.legs.distance.text,
      merge_time: app.legs.duration.text,
      merge_directions: directionsList
    }
  }).done(function() {
    app.removeOverlay();
    app.generateOverlay(`Your email has been sent to ${email}!`);
  });
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

// Changes the active tab based on which next button was clicked and enables disabled tabs once they have been active
app.changeActiveTabNext = function(that) {
	let currentIndex = that.parent().index();
	let totalTabs = $('.options__tabs-item').length;

	if(currentIndex > totalTabs - 3) {
		currentIndex--;
	}

	$('.options__tabs-item').eq(currentIndex + 1).removeClass('options__tabs-item--disabled').click();
}

// Disables next button if the input is empty
app.disableButton = function(that, type) {
  if(type === 'email') {
    if(app.checkEmail(that.val())) {
      $(`.overlay__button--email`).removeAttr('disabled');
  	} else {
      $(`.overlay__button--email`).attr('disabled', 'disabled');
  	}
  } else {
    if(that.val() !== '') {
  		$(`.options__button--${type}`).removeAttr('disabled');
  	} else {
  		$(`.options__button--${type}`).attr('disabled', 'disabled');
  	}
  }
}

// Initializes app
app.init = function() {
  app.generateMap();
	app.getCategories();
  app.generateDates();

  $('button').on('click', function(e) {
    e.preventDefault();
  });

  $('.options__units--geolocate').on('click', function() {
    app.getGeolocation();
  });

  $('.options__input--location').on('keyup', function() {
		app.disableButton($(this), 'location');
  });

	$('.options__input--distance').on('keyup', function() {
		app.disableButton($(this), 'distance');
  });

  $('body').on('keyup', '.overlay__input--email', function() {
		app.disableButton($(this), 'email');
  });

  $('input[name="date"]').on('click', function() {
		app.showCustomDate($(this));
  });

  $('.options__date input[type="checkbox"]').on('click', function() {
		app.showCustomDateRange();
  });

  $('.options__button--location').on('click', function() {
    app.setLocation();
    app.locationClicked = true;
  });

  $('.options__content-item[data-title="distance"] input[type="checkbox"]').on('click', function() {
    app.setDistanceUnits($(this));
  })

	$('.options__button--distance').on('click', function() {
    app.drawDistanceRadius();
    app.distanceClicked = true;
  });

  $('.options__categories').on('click', 'input', function() {
    $('.options__categories input#noCategoryPreference').prop('checked', false).removeAttr('checked');
  });

  $('.options__categories').on('click', 'input#noCategoryPreference', function() {
    $('.options__categories input').prop('checked', false).removeAttr('checked');
    $(this).prop('checked', true).attr('checked', 'checked');
  });

	$('.options__button--submit').on('click', function() {
    app.showInstructions();
		app.getEvents();
    app.submitClicked = true;
  });

  $('.options__button--transportation').on('click', function() {
    app.getTransportationMode();
  });

  $('body').on('change', '.options__question input:not([name="transportation"]), .options__question select', function() {
    if(app.locationClicked) {
      app.setLocation();
    }

    if(app.submitClicked) {
      app.clearEvents();
    }
  });

  $('.options__tabs-item').on('click', function() {
    app.changeActiveTabClick($(this));
  });

	$('.options__button--next:not(.options__button--submit)').on('click', function() {
		app.changeActiveTabNext($(this));
	});

  $('.options__button--email').on('click', function() {
    app.generateOverlay('', true);
  });

  $('body').on('click', '.overlay__button--close', function() {
    app.removeOverlay($(this));
  });

  $('body').on('click', '.overlay__button--email', function() {
    app.sendEmail();
  });
}

$(function() {
  app.init();
});
