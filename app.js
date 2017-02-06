var io = require('socket.io')(80);
var express = require('express');
var request = require('request');
var spotifyAPI = require('spotify-web-api-node');
var fs = require('jsonfile');
var data = [];
var TIME_BETWEEN_SONGS = 15000;
var HOST_ID = "1123320565";
var output_playlist = {"id": "5UnOPEtjdMUokmE3Y40WvY", "name": "spot-on-the-fly"}

//main settings
var settings = {
  clientId : "cab4b5b99f96426e9dfaf76d268f3871",
  clientSecret: "3000734987d6434a963489d900c65641",
  redirectUri: "http%3A%2F%2F129.31.219.167%3A8080%2Fauth%2Fconfirm"
};

//set up spotifyapi
var spot = new spotifyAPI(settings);

//set up express
var app = express();
app.use('/static', express.static('public'))

var userCount = 0;

//tokens list
var tokens = [];

var buf = [];

//on connection then
io.on('connection', function(socket){
  userCount++;
  socket.token = tokens[userCount - 1]
  console.log("User Connected...");
  console.log(tokens);


  socket.on('disconnect', function(){
    var index = tokens.indexOf(socket.token);
    tokens.splice(index, 1);
    userCount--;
    console.log('User Disconnected...');
    console.log(tokens);
  })
});

//send them the home page
app.get('/', function(req,res){
  res.sendfile("public/index.html");
});

//send them to the auth page for spotify
app.get('/auth/', function(req,res){
  var url = spot.createAuthorizeURL(['user-read-private', 'user-read-email', 'user-top-read','user-read-birthdate','user-library-modify','user-library-read','user-follow-read','user-follow-modify','playlist-modify-private','playlist-modify-public','playlist-read-collaborative','playlist-read-private'], "shitty-state");
  res.redirect(url);
});

//confirm the authentication and continue to get the token
app.get('/auth/confirm', function(req, res){
  var code = req.query.code;
  spot.authorizationCodeGrant(code)
  .then(function(data){

    // Set the access token on the API object to use it in later calls
    spot.setAccessToken(data.body['access_token']);
    spot.setRefreshToken(data.body['refresh_token']);

    spot.getMe().then(function(user){
      tokens.push({userID:user.body.id, token: data.body['access_token']});
      // console.log(tokens);
      res.sendfile('public/index2.html');
    });
  });
});

app.listen(8080, function(){
  console.log('listening on port 8080');
});

setInterval(fetch_songs, TIME_BETWEEN_SONGS);

function fetch_songs(){
  var data = [];
  if(tokens.length != 0){
  for(i = 0; i < tokens.length; i++){
    data.push(fetch(tokens[i].token, i));
  }
  // console.log(data);
  buf = rithm(data, buf);
  console.log(buf);
}else{
  console.log("no users connected!");
}
}

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

function fetch(access_token, i){
	var options = {
	  url: 'https://api.spotify.com/v1/me/top/artists',
	  headers: { 'Authorization': 'Bearer ' + access_token },
	  json: true
	};

	// use the access token to access the Spotify Web API

  request.get(options, function(error, response, body) {
    var top_artists = body.items
	  localStorage.setItem('TopArtists.json', JSON.stringify(top_artists));
	});

  var ta = JSON.parse(localStorage.getItem('TopArtists.json'));


	var options = {
	  url: 'https://api.spotify.com/v1/me/top/tracks',
	  headers: { 'Authorization': 'Bearer ' + access_token },
	  json: true
	};


	// use the access token to access the Spotify Web API
  request.get(options, function(error, response, body) {
    var top_tracks = body.items
	  localStorage.setItem('TopTracks.json', JSON.stringify(top_tracks));
	});

  var tt = JSON.parse(localStorage.getItem('TopTracks.json'));
	return {id: tokens[i].userID, ta: ta, tt: tt}
}












var rithm = function(user, buffer){
  found = false;

while(!found){

    var artlist = [];
    var artrep = [];
    var playlist = [];
    var genres = [];
    var artists = [];
    var songs = [];
    //empty arrays to hole the artist list
    var itemadd = function(list, item, user){
        var add = false;
        //used to see if the id has been added to a repeated item
        for(var i = 0; i < list.length; i++){
            if(list[i].info.id == item.id){
                //if the user has the same item add their user id to the array of the user ids
                add = true;
                list[i].ids.push(user);
                //pusing the id into the array of ids
            }
        }
        if(!add){
            var tmp = new Object();
            tmp.ids = [user];
            //create a new entry for the item in the list and adds the user id to an array
            tmp.info = item;
            //adds the item information
            list.push(tmp);
            //pushes the new value into the array of songs or artists
        }
        return list;
        //returns the new list
    };

    var genrelist = function(artgen, genlength, gen){

        for(var i = 0; i < artgen.length; i++){
            var add = true;
            for(var j = 0 ; j < gen.length; j++){
                if(gen[j] == artgen[i]){
                    //if the genre is repeated between songs, increase the weighting of this genre relative to the id numbers of this genre
                    add = false;
                    gen[i].weight += genlength;
                }
            }
            if(add){
                var tmp = new Object();
                tmp.weight = genlength;
                tmp.gen = artgen[i];
                gen.push(tmp);
            }
        }
        return gen;
    }

    var songpick = function(list, played){
        var most = 0;
        var track = "";
        for(var i = 0; i < list.length; i++){
            var found = false;
            if(list[i].ids.length>most){
                for(var j = 0; j < played.length; j++){
                    if(list[i].info.name == played[j].name){
                        found = true;
                    }
                }
                if(!found){
                    most = list[i].ids.length;
                    track = list[i].info; //name
                }
            }
        }
        var tmp = new Object();
        tmp.name = track;
        played.push(tmp);
        return played;
    }

    var randomsong = function(list, played){
        var found = true;
        while(found){
            found = false;
            var number = Math.floor(Math.random()*list.length);
            for(var i = 0; i < played.length; i++){
                if(list[number].info.name == played[i].name){
                    found = true;
                }
            }
        }
        var tmp = new Object();
        tmp.name = list[number].info; //.name
        played.push(tmp);
        return played;
    }

    var artistpick = function(list, played){
        var most = 0;
        var artist = "";
        for(var i = 0; i < list.length; i++){
            var found = false;
            if(list[i].ids.length>most){
                for(var j = 0; j < played.length; j++){
                    if(list[i].info.name == played[j].name){
                        found = true;
                    }
                }
                if(!found){
                    most = list[i].ids.length;
                    artist = list[i].info.name;
                }
            }
        }
        var tmp = new Object();
        tmp.name = artist;
        played.push(tmp);
        return played;
    }


    for(var i=0; i<Object.keys(user).length; i++){

        for(var j=0; j<Object.keys(user[i].ta).length; j++){
             artists = itemadd(artists, user[i].ta[j], user[i].id);
        }
        for(var k=0; k<Object.keys(user[i].tt).length; k++){
            songs = itemadd(songs, user[i].tt[k], user[i].id);
        }
    }

    for(var i=0; i<artists.length; i++){
        genres = genrelist(artists[i].info.genres, artists[i].ids.length, genres);
        if(artists[i].ids.length > 1){
            var tmp = new Object();
            tmp.info = artists[i].info;
            artrep.push(tmp);

        }
    }



    var repArt = [];
    var toptracks = [];
    for(var i = 0; i < artrep.length; i++){
        spot.getArtistTopTracks(artrep[i].info.id, 'GB').then(function(data){

            var string = data.body.tracks;
            localStorage.setItem('test.json', JSON.stringify(string));
        });
    }
    //
    // var stupid = JSON.parse(localStorage.getItem('test.json'));

    for(var i = 0; i< Math.floor(songs.length/8); i++){
        playlist = randomsong(songs, playlist);
        playlist = songpick(songs, playlist);
    }
    //
    var full = playlist ;//stupid.concat(playlist);

    // for(var i = 0; i< full.length; i++){
    //     console.log([i+1] + " " + full[i].name);
    // }
    //return full as the array with the songs in it




      var rand = Math.random();
      //console.log(rand);
      index = Math.floor(rand*full.length);
      //console.log(index);

      output = full[index];
      found = true;
      for(var i = 0; i < buffer.length; i++){
        if(buffer[i].name.id == output.name.id){
            found = false;
        }
    }

}
//output
if(output!=0){
buffer.push(output);
add(output);
}

  return buffer;

}



function add(song){
  var host_token;
  for(i = 0; i < tokens.length; i++){
    if(tokens[i].userID == HOST_ID){
      host_token = tokens[i].token;
      console.log(host_token);
    }
  }


spot.setAccessToken(host_token);
    spot.addTracksToPlaylist(HOST_ID, output_playlist.id, [song.name.uri]).then(function(data) {
      console.log('Added '+ song.name.name);
    }).catch(function(err) {
      console.log('Something went wrong!', err.message);
    });
}
