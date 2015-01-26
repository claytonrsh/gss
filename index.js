/****************
    INITIALIZE
****************/

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var jf = require('jsonfile');
var util = require('util');

// start server
http.listen(3000, function(){
  console.log('listening on *:3000');
});

/****************************
    ROUTES
*****************************/

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

/****************************
    REAL TIME DATA FEED
*****************************/

io.on('connection', function(socket){
    console.log('a client connected');
    /*socket.on('disconnect', function(){
        console.log('user disconnected');
    });*/
    io.emit('base data', tripLines); // send base data to client(s) on connection
    
    socket.on('chat message', function(msg){
        //console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
});

// also one time data processing done below for line creation

/*****************************
    DATA PROCESSING - move to 'model' section to follow MVC framework
******************************/

var file = 'data/boiling-inferno-6943-routes-export.json'; // file to read in

var tripLines = { "type": "FeatureCollection", "features": [] }; // global variable for (initial) base data

jf.readFile(file, function(err, obj) {
  //console.log(util.inspect(obj))
    if (err) {
        console.log('error! this one: ', err);
        return err;
    } else {
        //console.log(typeof obj, obj.length); // returns: object undefined
        for ( var routes in obj) {
            
           // var route = obj[routes]; // simply place holder, can remove
            
            for (var trip in obj[routes]) {
                if (obj[routes][trip]['geometry'] && Object.keys(obj[routes][trip]['geometry']).length > 100) {
                    // upload has geometry with >100 pings, ~= 3.5 minutes (5 sec/ping * 100 pings / 60 sec)
                    //console.log('geom length is ', Object.keys(obj[routes][trip]['geometry']).length, ' trip value is ', trip.toString(), ' val of geom[0][0] is ', Object.keys(obj[routes][trip]['geometry'])[0]);
                    var geoms = obj[routes][trip]['geometry'];
                    var tripLine = { type: "Feature", geometry: { type: "LineString", coordinates: [] },
                                    properties: { // make dynamic for input
                                        created: obj[routes][trip]['created'], routeID: obj[routes][trip]['routeID'], 
                                        username: obj[routes][trip]['username'] }
                    };
                    //console.log('tripLine initialized as: ', JSON.stringify(tripLine));
                    for (var geom in geoms) {
                        //this version ignores time, need to keep as points to properly maintain with geoJSON structure?
                        tripLine.geometry.coordinates.push([obj[routes][trip]['geometry'][geom].lat, obj[routes][trip]['geometry'][geom].lng]);
                    }
                    //console.log('tripLine with geoms is: ', JSON.stringify(tripLine));
                    //io.emit('new trip line', tripLine); // emit this trip to socket - no good, should expose funciton / variable to client probably not via socket...
                    tripLines.features.push(tripLine);
                    console.log('new trip line added to tripLines global variable');
                } else {
                    // console.log('trip has no geometry or geom.length is < 100 (~3.5 mins)');
                    console.log('trip not logged, has keys: ', Object.keys(obj[routes][trip]).toString());
                }
            }
        }
        var testMarker = { type: "Feature", geometry: { type: "Point", coordinates: [] },
                                    properties: { // make dynamic for input
                                        created: 1232, stopID: 'test stop', 
                                        username: 'this user' }
                    };
        testMarker.geometry.coordinates.push(9.936068, -84.097512);
        tripLines.features.push(testMarker);
        console.log('tripLines has ', tripLines.features.length, ' features');
    }
});