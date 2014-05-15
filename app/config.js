app.factory('config', function ($rootScope, $http) {
	var config = {
		fireRoot: 			'https://shoeboxed.firebaseio.com/',
		fireRef: 			new Firebase('https://shoeboxed.firebaseio.com/'),
		parseRoot: 			'https://api.parse.com/1/',
	 	parseAppId: 		'Iw9DHXLzR7zp5AvEPAE45Yfksz0wHutEoPPgLnoP',
	 	parseJsKey: 		'pNULiL0dewElGqCVQsRMYDWsjMSY1nrCDnXyPXqB',
	 	parseRestApiKey: 	'4PAokBweya2d7ACcfAOBWImB3UEVZXxU38HJsEK3',
	 	roles: 				['Admin','Moderator','Editor','ValidUser']
	};

	Parse.initialize(config.parseAppId, config.parseJsKey);
	 $http.defaults.headers.common['X-Parse-Application-Id'] = config.parseAppId;
	 $http.defaults.headers.common['X-Parse-REST-API-Key'] = config.parseRestApiKey;
	 $http.defaults.headers.common['Content-Type'] = 'application/json';

	return config;
});



app.factory('settings', function ($rootScope) {
	var settings = {
		
	};
	return settings;
});