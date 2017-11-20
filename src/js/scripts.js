const app = {};

app.map;

app.eventApiUrl = 'http://api.eventful.com/json/events/search';
app.eventApiKey = 'srQBgzwWJzXwZcrM';

app.placeApiUrl = 'https://api.foursquare.com/v2/venues/explore';
app.placeApiClientId = '1JM0YWOJPR4JMQ3VTCFJTHCOZIDYQQ1ZQICNZNQ2JPTVXO5B';
app.placeApiKey = '3P0H0ECHZUY2JQQTZWDGW4C4G1F1JPMBJQIPCMUTGHVWJI5W';

app.getEvents = function() {
	$.ajax({
		url: app.eventApiUrl,
		method: "GET",
		dataType: "jsonp",
		data: {
			app_key: app.eventApiKey,
      location: '43.641633,-79.382053',
      within: '5'
		}
	}).then(function(events) {
		console.log(events);
	});
};

app.getPlaces = function() {
	$.ajax({
		url: app.placeApiUrl,
		method: "GET",
		data: {
      client_id: app.placeApiClientId,
      client_secret: app.placeApiKey,
      ll: '43.641633,-79.382053',
      v: new Date().toISOString().slice(0,10).replace(/-/g,"")
		}
	}).then(function(places) {
		console.log(places);
	});
};

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

  let center = app.map.getCenter();

  google.maps.event.addDomListener(window, 'resize', function() {
    app.map.setCenter(center);
  });
}

// Resizes, centers, and zooms map around main marker
app.mapResizeCenterZoom = function(marker, markerPosition) {
  app.map.setZoom(13);
  app.map.setCenter(markerPosition);

  google.maps.event.addDomListener(app.map, 'idle', function() {
    app.map.getCenter();
  });

  google.maps.event.addDomListener(window, 'resize', function() {
    app.map.setCenter(markerPosition);
  });

  let clicks = 0;

  marker.addListener('click', function() {
    if(clicks % 2) {
      app.map.setZoom(13);
    } else {
      app.map.setZoom(16);
    }

    app.map.setCenter(this.position);

    clicks++;
  });
}

// Generates marker for base location
app.generateLocationMarker = function(marker, position) {
  marker = new google.maps.Marker({
    map: app.map,
    animation: google.maps.Animation.DROP,
    position: position,
    icon: {
      path: fontawesome.markers.THUMB_TACK,
      scale: 0.5,
      strokeWeight: 0,
      fillColor: '#ff751a',
      fillOpacity: 1
    }
  });

  app.mapResizeCenterZoom(marker, marker.position);
}

// Gets location via geolocation, adds address to location input, and calls function to generate marker
app.getLocationGeolocation = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      let myLatLng = {lat: position.coords.latitude, lng: position.coords.longitude};

      new google.maps.Geocoder().geocode({'location': myLatLng}, function(results, status) {
        $('.options__input--search').val(results[0].formatted_address);

        let marker;
        app.generateLocationMarker(marker, results[0].geometry.location);
      });
    });
  } else {
    alert('Error: The Geolocation service failed. Please enter your location manually.')
  }
}

// Gets location via user input and calls function to generate marker
app.getLocationSearch = function() {
  let location = $('.options__input--search').val();

  new google.maps.Geocoder().geocode({'address': location}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      let marker;
      app.generateLocationMarker(marker, results[0].geometry.location);
    } else {
      if(status === 'ZERO_RESULTS') {
        alert('Your search location could not be found. Please try again.')
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    }
  });
}

// Changes the active tab based on which tab was clicked
app.changeActiveTab = function(that) {
  let tabTitle = that.data('title');

  $('.options__tabs-item').removeClass('options__tabs-item--active');
  that.addClass('options__tabs-item--active');

  $('.options__content-item').removeClass('options__content-item--active');
  $('.options__content-item').each(function(i) {
    if($('.options__content-item').eq(i).data('title') === tabTitle) {
      $(this).addClass('options__content-item--active');
    }
  })
}

// Initializes app
app.init = function() {
  app.generateMap();

  $('.options__button--geolocate').on('click', function() {
    app.getLocationGeolocation();
  });

  $('.options__input--search').on('keypress', function(event) {
    if (event.keyCode === 13) {
      app.getLocationSearch();
    }
  });

  $('.options__button--search').on('click', function(event) {
    app.getLocationSearch();
  });

  $('.options__tabs-item').on('click', function() {
    app.changeActiveTab($(this));
  });
}

$(function() {
  app.init();
});
