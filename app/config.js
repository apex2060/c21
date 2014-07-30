app.factory('config', function ($rootScope, $http) {
	var config = {
		fireRoot: 			'https://c21.firebaseio.com/',
		fireRef: 			new Firebase('https://c21.firebaseio.com/'),
		parseRoot: 			'https://api.parse.com/1/',
	 	parseAppId: 		'ETt2DVlnzRdWvoVU1aBEM0V3ghRS9OJVk2Hk5VSL',
	 	parseJsKey: 		'YOUSUJIxB4r9ussJUrZxddnL2oMFHTxaFZvrXsDO',
	 	parseRestApiKey: 	'vEvnR29UIBtbpHFJ79zzFUw531BkGFfPq5xajdGu',
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

//Migrate to prod