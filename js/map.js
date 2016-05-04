/**
 * map.js
 *
 * Implements a google map.
 */

// Max routing points allowed by google maps
var maxMarkers = 10;

// Max weather data allowed by openweathermap
var maxWeather = 14;

// Markers array
var gmarkers = [];

// Marker Array Size
var gmsize = 0;

// default latitude
var LATITUDE = 42.3745615030193;

// default longitude
var LONGITUDE = -71.11803936751632;

// global reference to 2D map
var map = null;

// global reference to google direction renderer
var directionsDisplay;

// global reference to google direction service
var directionsService;

// global reference to our infowindow
var infowindow;

// load version 3 of the Google Maps API
google.load("maps", "3", {other_params: "sensor=false"});

// once the window has loaded
$(window).load(function() {

    // load application
    load();
	
});


/**
 * Loads application.
 */
function load()
{
    // create our map
    var latlng = new google.maps.LatLng(LATITUDE, LONGITUDE);
    map = new google.maps.Map($("#map").get(0), {
        center: latlng,
        disableDefaultUI: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoom: 10,

    });
	// Instantiate directions service and renderer
	directionsService = new google.maps.DirectionsService();
	directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: false,
        suppressMarkers: true,
        map: map
    });
	// Instantiate infoWindow
	infowindow = new google.maps.InfoWindow();
	
	// Add listener for when clicking on the map
    google.maps.event.addListener(map, 'click', function(event) 
												{
													placeMarker(event.latLng); 
													infowindow.close(); 
												}
								  );
	

}

// Generates the routing service and renderers it on the map
function calcRoute() {
  if (gmsize > 1)
  {
	  var waypts = [];
	  var start = gmarkers[0].getPosition();
	  var end = gmarkers[gmsize - 1].getPosition();
	  if (gmsize > 2)
	  {
		  for (var i = 1; i <= gmsize - 2; i++) 
		  {
			  waypts.push({
				  location:gmarkers[i].getPosition(),
				  stopover:true
			  });
		  }
	  }
	  var request = {
		  origin:start,
		  destination:end,
		  waypoints: waypts,
      	  optimizeWaypoints: false,
		  travelMode: google.maps.TravelMode.DRIVING
	  };
	  directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
		  directionsDisplay.setDirections(response);
		  showSteps(response);
		}
	  });
  }
  else
  {
	showSingleStep(0);  
  }
}

// (Re)Generates the route info HTML as more stops get added
function showSingleStep(i) {
	var list_html = "<ul>";
	list_html += "<li>";
	list_html += gmarkers[i].title;
	list_html += "<br>";
	list_html += getOptionCode(i);
	list_html += GetWeathDiv(i);
	list_html += "</li>";
	list_html += "</ul>";
	$('#routeinfo').append(list_html);
}

// Returns a formatted HTML chunk for the weather data 
// that gets used in multiple locations
function getWeatherHTML(marker)
{
	var htmlcontent = getWeather(marker, 0);
	htmlcontent += "<br><div class='daytemp'>Day Temp: ";
	htmlcontent += getWeather(marker, 1);
	htmlcontent += "</div><div class='nighttemp'> Night Temp: ";
	htmlcontent += getWeather(marker, 2) + "</div>";
	return htmlcontent;
}

// Takes in an HTML object and returns the numeric 
// index value that is part of the dynamically created id
function myIdx(obj)
{
	var str = obj.id;
	var res = str.split("."); 
	return res[1];
}

// Updates the custom marker property numdays and the weather info.
// Gets called from the date select onChange.
function dayChange(obj)
{
	var idx = myIdx(obj);
	gmarkers[idx].numdays = obj.value;
	var myid = $("#dlist\\." + idx);
    myid.html(getWeatherHTML(gmarkers[idx]));
}

// a routine to generate our date select html
function getOptionCode(i)
{
	var temp_html = "<div><form>";
	temp_html += "<select class='form-control' id='slist." + i + "' size='1' onchange='dayChange(this);'>";
	var d = new Date();
	var selectedidx = gmarkers[i].numdays;
	for (var q = 0; q < maxWeather; q++)
	{
		if (selectedidx == q)
		{
			temp_html += "<option value='" + q.toString() + "' selected>" + d.toLocaleDateString() + "</option>";
		}
		else
		{
			
			temp_html += "<option value='" + q.toString() + "'>" + d.toLocaleDateString() + "</option>";
		}
		d.addDays();
	}
	temp_html += "</select>";
	temp_html += "</form></div>";	
	
	return temp_html;
}

// Handles slow async weather loading issues.
// Spits out a default message if the weather data
// isn't loaded yet ('undefined').
function getWeather(marker, type)
{
	// type 0 = description
	// type 1 = day temp
	// type 2 = night temp
	if (typeof marker.json === 'undefined') 
	{
		switch(type)
		{
			case 0: return "Weather loading";
			case 1: return "?";
			case 2: return "?";
			default: return "";
		}
		
	}
	else
	{
		switch(type)
		{
			case 0: return marker.json.list[marker.numdays].weather[0].description;
			case 1: return marker.json.list[marker.numdays].temp.day;
			case 2: return marker.json.list[marker.numdays].temp.night;
			default: return "";
		}
	}
}

// (Re)Generates the route info HTML as more stops get added
function showSteps(directionResult) {
	var myRoute = directionResult.routes[0];
	var list_html = "<ul>";
	var i;
	for (i = 0; i < myRoute.legs.length; i++)
	{
		list_html += "<li>Stop " + i + ": ";
		list_html += myRoute.legs[i].start_address; 
		list_html += "<br>";
		list_html += getOptionCode(i);
		list_html += GetWeathDiv(i);
		list_html += getDirections(myRoute.legs[i].steps, i);
		list_html += "</li>";
	}
	list_html += "<li>Stop " + i + ": ";
	list_html += myRoute.legs[myRoute.legs.length - 1].end_address;
	list_html += "<br>";
	list_html += getOptionCode(i);
	list_html += GetWeathDiv(i);
	list_html += "</li>";
	list_html += "</ul>";
	$('#routeinfo').html(list_html);
}

// Generate HTML for a hidden div to show or hide google directions
function getDirections(steps, i)
{
	var ret = "<div class='dirClick' id='steps." + i + "' onclick='toggleDirection(this);'>Click For Directions</div><div class='hidDir' id='mysteps." + i + "'>";
	for (var i = 0; i < steps.length; i++)
	{
		ret += steps[i].instructions + "<br>";
	}
	ret += "<br></div>";
	return ret;
}

// Toggles Visibility of turn by turn directions
// Gets called by onclick "Click For Directions"
function toggleDirection(obj)
{
	var myid = $("#mysteps\\." + myIdx(obj));
    myid.toggle();
}

// Embeds weather in a div with an id so we can dynamically update it
function GetWeathDiv(i)
{
	return "<div id='dlist." + i + "'>" + getWeatherHTML(gmarkers[i]) + "</div>";
}

// Fires when the user clicks on the map
// Generates the markers, bundles and stores the weather data
function placeMarker(location) {
	
	//If you are not a paying business user, then google maps limits you to 10 route points 
	if (gmsize >= maxMarkers)
	{
		alert("You are limited to 10 route markers");
		return;
	}
	
	// Create our marker, add it to the global markers array
	var marker = new google.maps.Marker({
	position: location,
	draggable:false,
	animation: google.maps.Animation.DROP,
	map: map,
	numdays: 0,
	title: "Stop " + gmsize + ": " + getAddr(location)
	});
	
	gmarkers.push(marker);
	gmsize++;
	
	// Get 14 days of weather from openweathermap.org for LatLng
	// Store it with the marker
	var my_url = "http://openweathermap.org/data/2.5/forecast/daily?lat=" + location.lat();  
	my_url += "&lon=" + location.lng() + "&cnt=" + maxWeather + "&mode=json&units=imperial&callback=?"
	document.body.style.cursor='wait';
	$.getJSON(my_url, function(data) 
					  { 
						var result = new Array();
						result = data;
						marker.json = result;
						calcRoute();
						document.body.style.cursor='auto';
					  });
	
	//Add a custom event listener for our infowindow, for when the user clicks a marker
	google.maps.event.addListener(marker, 'click', function()
		{
			popup(this);
		}
	);

}

// A function to pop up our infowindow
function popup(marker)
{
	var htmlcontent = "<strong>" + marker.json.city.name + "</strong>";
	htmlcontent += "<br>";
	htmlcontent += getWeatherHTML(marker);
	infowindow.setContent(htmlcontent);
    infowindow.open(map, marker);
}

// Adding functionality to Date object to increment days
Date.prototype.addDays = function(days)
{
    if (typeof days === 'undefined') 
	{ 
		days = 1; 
	}
	this.setDate(this.getDate() + days);
}


// Queries Google Maps for a formatted address string.
function getAddr(pos)
{
	htmlstr = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + pos.lat() + "," + pos.lng() + "&sensor=false";
    var result = new Array();
    var ret = "";
    
    $.ajax(
    {
        url: htmlstr,
        type: 'get',
        dataType: 'json',
        async: false,
        success: function(data) 
        {
            result = data;
        } 
    });
    
    for (var i = 0; i < result.results.length; i++) 
    {
      // Look for an address with a street number
      if (isFinite(result.results[i].formatted_address.substr(0,1)))
      {
        ret = result.results[i].formatted_address;
        break;
      }
    }
    
    // If we can't get a numeric address, grab the first one in results
    if (ret == "")
    {
        ret = result.results[0].formatted_address;
    }

    return ret + "";
}