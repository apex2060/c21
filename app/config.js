app.factory('config', function ($rootScope, $http) {
	var config = {
		fireRoot: 			'https://century21.firebaseio.com/',
		fireRef: 			new Firebase('https://century21.firebaseio.com/'),
		parseRoot: 			'https://api.parse.com/1/',
	 	parseAppId: 		'fjNPy7AsQcDEz9woamj15jrgs9xWMOQP0TiNF0V0',
	 	parseJsKey: 		'JdU2uRrOYZjdWBOYBvQoUENJhEIzNc60BoLh62O3',
	 	parseRestApiKey: 	'q6xFyspsTblr7qltEFr6Pb5NHaaXarZz29Tf4BYk',
	 	roles: 				['Admin','Broker','Agent','Editor']
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