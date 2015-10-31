var loopback = require('loopback');
var querystring = require('querystring');
var boot = require('loopback-boot');
var app = module.exports = loopback();

// Passport configurators..
var loopbackPassport = require('loopback-component-passport');
var PassportConfigurator = loopbackPassport.PassportConfigurator;
var passportConfigurator = new PassportConfigurator(app);

/*
* body-parser is a piece of express middleware that
*   reads a form's input and stores it as a javascript
*   object accessible through `req.body`
*
*/
var bodyParser = require('body-parser');

/**
* Flash messages for passport
*
* Setting the failureFlash option to true instructs Passport to flash an
* error message using the message given by the strategy's verify callback,
* if any. This is often the best approach, because the verify callback
* can make the most accurate determination of why authentication failed.
*/
var flash      = require('express-flash');

// attempt to build the providers/passport config
var config = {};
try {
	config = require('../providers');
} catch (err) {
	console.trace(err);
	process.exit(1); // fatal
}

// -- Add your pre-processing middleware here --

// Setup the view engine (jade)
var path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// boot scripts mount components like REST API
boot(app, __dirname);

// to support JSON-encoded bodies
app.middleware('parse', bodyParser.json({limit: '10mb'}));
// to support URL-encoded bodies
app.middleware('parse', bodyParser.urlencoded({
	extended: true,
	limit: '10mb'
}));

// The access token is only available after boot
app.middleware('auth', loopback.token({
	model: app.models.accessToken
}));

app.middleware('session:before', loopback.cookieParser(app.get('cookieSecret')));
app.middleware('session', loopback.session({
	secret: 'kitty',
	saveUninitialized: true,
	resave: true
}));
passportConfigurator.init();

// We need flash messages to see passport errors
app.use(flash());

passportConfigurator.setupModels({
	userModel: app.models.user,
	userIdentityModel: app.models.userIdentity,
	userCredentialModel: app.models.userCredential
});
for (var s in config) {
	var c = config[s];
	c.session = c.session !== false;
	passportConfigurator.configureProvider(s, c);
}
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

app.get('/', function (req, res, next) {
	res.render('pages/index', {user:
		req.user,
		url: req.url
	});
});

app.get('/auth/account', ensureLoggedIn('/login'), function (req, res, next) {

	var accessToken = req.accessToken.id;
	var userId = req.accessToken.userId.toString();
	var profileId = req.user.profiles[0].profile.id;
	var profileName = req.user.profiles[0].profile.displayName;

	var urlQueryString = querystring.stringify({
		accessToken: accessToken,
		profileId: profileId,
		profileName: profileName,
		userId: userId
	});

	res.redirect('callback://app?' + urlQueryString);
});

app.get('/login', function (req, res, next) {
	res.redirect('/auth/facebook');
});

app.get('/auth/logout', function (req, res, next) {
	req.logout();
	res.redirect('/');
});

// -- Mount static files here--
// All static middleware should be registered at the end, as all requests
// passing the static middleware are hitting the file system
// Example:
var path = require('path');
app.use(loopback.static(path.resolve(__dirname, '../client/public')));

// Requests that get this far won't be handled
// by any middleware. Convert them into a 404 error
// that will be handled later down the chain.
app.use(loopback.urlNotFound());

// The ultimate error handler.
app.use(loopback.errorHandler());

app.use(loopback.token());

app.start = function() {
	// start the web server
	return app.listen(function() {
		app.emit('started');
		console.log('Web server listening at: %s', app.get('url'));
	});
};

// start the server if `$ node server.js`
if (require.main === module) {
	app.start();
}
