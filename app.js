var express    = require('express'),
    app        = express(),
	bodyParser = require('body-parser'),
	path = require('path'),
	uniqid = require('uniqid'),
	spotAPI	   = require('spotify-web-api-node'),
    request    = require('request');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");


//Spotify BPM App config
var clientId = 'e3f3bf9192fe4f608f8774bbd45ea912',
	clientSecret = 'ba12b9cb4f7c4071b492a8ceffc8ac7b',
	redirectUri = 'http://localhost:3000/callback';


//ROUTES
//Landing page for app
app.get("/", function( req, res){
   res.render("landing"); 
});

//redirect user to spotify for AuthN
app.get('/login', function(req, res) {
	var spotifyApi = new spotAPI({
		clientId: clientId,
		clientSecret: clientSecret,
		redirectUri: redirectUri
  	});

	var scopes = 'user-read-private user-read-email playlist-modify-public playlist-modify-private user-library-read user-top-read';
	res.redirect('https://accounts.spotify.com/authorize' +
	  	'?response_type=code' +
	  	'&client_id=' + spotifyApi._credentials.clientId +
	  	(scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
	  	'&redirect_uri=' + spotifyApi._credentials.redirectUri +
	  	'&state=' + '13131313131313131313131313131313'
	);
});



/**
 * AuthN return from Spotify
 * 
 */
app.get("/callback", function( req, res){
	var spotifyApi = new spotAPI({
		clientId: clientId,
		clientSecret: clientSecret,
		redirectUri: redirectUri
  	});
	var code = req.query.code || null,
		state = req.query.state || null;

	//Prepare to redeem code for token
    var authOptions = {
      	url: 'https://accounts.spotify.com/api/token',
      	form: {
        	code: code,
        	redirect_uri: spotifyApi._credentials.redirectUri,
        	grant_type: 'authorization_code'
      	},
      	headers: {
        	'Authorization': 'Basic ' + (new Buffer(spotifyApi._credentials.clientId + ':' + spotifyApi._credentials.clientSecret).toString('base64'))
      	},
      	json: true
    };


    //Redeem Code for Token AuthZ-ish
	request.post(authOptions, function(error, response, body) {

		//Redirect to /playlistCreator with the access Token
		console.log("Redeemed code for token: "+ body.access_token);
		res.redirect("./playlistCreator?accessToken="+body.access_token);

	});


});

//Render playlist creation page
app.get("/playlistCreator", function (req, res){
	res.render("playlistCreator", {accessToken: req.query.accessToken});
});


//Get recommendations from the spotify API
app.get("/recommendations", function (req, res){
	var spotifyApi = new spotAPI({
		clientId: clientId,
		clientSecret: clientSecret,
		redirectUri: redirectUri,
		accessToken: req.query.accessToken
  	});

	var searchOptions = {
		target_tempo: req.query.bpmRequested,
		seed_genres: req.query.genre
	};

	spotifyApi.getRecommendations(searchOptions)
		.then(function(results) {
			res.json(results);
			console.log(results);
		});	
});

/**
 * Get genres using spotAPI
 */
app.get("/genres", function (req, res){
	var spotifyApi = new spotAPI({
		clientId: clientId,
		clientSecret: clientSecret,
		redirectUri: redirectUri,
		accessToken: req.query.accessToken
  	});

	spotifyApi.getAvailableGenreSeeds()
		.then(function(results) {
			res.json(results);
			console.log(results);
		});	
});


/**
 * Test function to make sure all spotify API requirements are avaialble.
 */
function getSpotProperties(){
	console.log('The access token is ' + spotifyApi.getAccessToken());
	console.log('The refresh token is ' + spotifyApi.getRefreshToken());
	console.log('The redirectURI is ' + spotifyApi.getRedirectURI());
	console.log('The client ID is ' + spotifyApi.getClientId());
	console.log('The client secret is ' + spotifyApi.getClientSecret());
}

//START EXPRESS SERVER
//Server must run on port 3000 to for redirect UI (localhost:3000/callback)
app.listen(3000, function(){
    console.log("BPM Server Started.");
});