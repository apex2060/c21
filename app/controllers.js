var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $routeParams, $location, $http, config, userService, dataService){
	$rootScope.action = $routeParams.action;
	$rootScope.view = $routeParams.view;
	$rootScope.id = $routeParams.id;
	$rootScope.config = config;
	$rootScope.moment = moment;

	function setup(){
		$scope.$on('$viewContentLoaded', function(event) {
			ga('send', 'pageview', $location.path());
		});
	}

	
	var tools = {
		user: userService,
		logout: function(){
			tools.user.logout();
			tools.setup();
		},
		url:function(){
			if($rootScope.user)
				return 'views/'+$routeParams.view+'.html';
			else
				return 'views/auth.html';
		},
		side:function(side, url){
			if(url)
				if(url=='show')
					$('#aside_'+side).addClass('show');
				else if(url=='hide')
					$('#aside_'+side).removeClass('show').addClass('hide');
				else
					$rootScope.side[side]=url;
			else
				return $rootScope.side[side]
		},
		setup:function(){
			userService.init();
			setup();
			$rootScope.data=	{};
			$rootScope.resource={};
			$rootScope.temp=	{};
			$rootScope.side=	{};
			$rootScope.mode=	'normal';
			tools.side('left','partials/sidebar.html')
			// tools.side('right','partials/sidebar.html')
		}
	}
	$scope.tools 			= tools;
	$rootScope.rootTools 	= tools;

	if(!$rootScope.data){
		tools.setup();
	}
	it.MainCtrl=$scope;
});







var MlsCtrl = app.controller('MlsCtrl', function($rootScope, $scope, $q, $http, config, dataService, userService){
	var listings = new dataService.resource('Listings', 'listings', true, true);
		// listings.setQuery('include=agent');
	listings.item.list().then(function(data){
		$rootScope.listings = data.results;
	})
	$rootScope.$on(listings.listenId, function(event, data){
		if(data)
			$rootScope.listings = data.results;
	})

	var tools = {
		focus:function(listing){
			$rootScope.temp.listing = listing;
		},
		add:function(){
			var listing = {
				mls: $rootScope.temp.newMls
			}
			tools.save(listing);
			$rootScope.temp.newMls = "";
		},
		save:function(listing){
			listings.item.save(listing).then(function(response){
				console.log('listing response', response)
			})
		}
	}

	$scope.tools = tools;
	it.MlsCtrl=$scope;
});












var CallCtrl = app.controller('CallCtrl', function($rootScope, $scope, $q, $http, config, dataService, userService, noteService, siteSettings){
	var directory = new dataService.resource('Directory', 'directory', true, true);
		directory.setQuery('include=agent');
	directory.item.list().then(function(data){
		$rootScope.directory = data.results;
	})
	$rootScope.$on(directory.listenId, function(event, data){
		if(data)
			$rootScope.directory = data.results;
	})

	var clientListDefer = $q.defer();
	userService.user().then(function(user){
		var clients = new dataService.resource('Clients', 'clientList', true, true);
		clientListDefer.resolve(clients);
		clients.item.list().then(function(data){
			$rootScope.clients = data.results;
		})
		$rootScope.$on(clients.listenId, function(event, data){
			if(data)
				$rootScope.clients = data.results;
		})
	});
	var clientListPromise = clientListDefer.promise;


	var callListDefer = $q.defer();
	userService.user().then(function(user){
		var calls = new dataService.resource('Calls', 'callList', true, true);
			calls.setQuery('order=-updatedAt&limit=10&include=agent');
		callListDefer.resolve(calls);
		calls.item.list().then(function(data){
			$rootScope.calls = data.results;
			tools.formatAll($rootScope.calls);
		})
		$rootScope.$on(calls.listenId, function(event, data){
			if(data){
				$rootScope.calls = data.results;
				tools.formatAll($rootScope.calls);
			}
		})
	});
	var callListPromise = callListDefer.promise;

	var tools = {
		siteSettings: siteSettings,
		init:function(){
			$rootScope.rootTools.side('left', 'partials/side/call.html')
		},
		setSetting: function(){
			console.log(siteSettings)
			it.ss = siteSettings;
		},
		saveNote: function(note){
			if($rootScope.temp.client && $rootScope.temp.client.objectId){
				var clientId = $rootScope.temp.client.objectId;
				noteService.save(note).then(function(results){
					$rootScope.temp.note = '';
					noteService.promise.then(function(clientNoteResource){
						$rootScope.$on(clientNoteResource.listenId, function(event, data){
							noteService.list(clientId).then(function(clientNotes){
								$rootScope.temp.clientNotes = clientNotes;
							})
						})
					});
				})
			}
		},
		deleteNote: function(note){
			if($rootScope.temp.client && $rootScope.temp.client.objectId){
				var clientId = $rootScope.temp.client.objectId;
				noteService.promise.then(function(clientNoteResource){
					clientNoteResource.item.remove(note).then(function(results){
						$rootScope.$on(clientNoteResource.listenId, function(event, data){
							noteService.list(clientId).then(function(clientNotes){
								$rootScope.temp.clientNotes = clientNotes;
							});
						});
					});
				})
			}
		},
		client:{
			init: function(call){
				tools.client.get(call).then(function(client){
					if(client.status != 'error'){
						$rootScope.temp.client = client;
						noteService.list(client.objectId).then(function(clientNotes){
							$rootScope.temp.clientNotes = clientNotes;
						})
					}else{
						$rootScope.temp.client = {
							phone: call.extNumber,
							name: call.name
						}
					}
				})
			},
			add: function(client){
				clientListPromise.then(function(clientResource){
					clientResource.item.save(client).then(function(response){
						$rootScope.$on(clientResource.listenId, function(event, data){
							clientResource.item.list().then(function(data){
								console.log('add new list', data)
								tools.formatAll($rootScope.calls);
							});
						})
					});
				})
			},
			get: function(call){
				var defer = $q.defer();
				clientListPromise.then(function(clientResource){
					clientResource.item.list().then(function(data){
						var clients = data.results;
						for(var i=0; i<clients.length; i++){
							if(clients[i].phone == call.extNumber)
								defer.resolve(clients[i]);
						}
						defer.resolve({status:'error', message:'No client found.'});
					})
				})
				return defer.promise;
			}
		},
		formatAll:function(calls){
			// $rootScope.temp.current = false;
			for(var i=0; i<calls.length; i++){
				tools.format(calls[i]);
			}
		},
		format:function(call){
			tools.client.get(call).then(function(client){
				if(client.status != 'error')
					call.info = client;
				else 
					call.info = false;
				if(call.status != 'completed'){
					// $rootScope.temp.current = call;
					tools.client.init(call);
				}
			})
		},
		display:function(call){
			if(call)
				if(call.info)
					return call.info.name;
				else
					return call.extNumber;
		},
		focus:function(call){
			$rootScope.temp.call = call;
			tools.client.init(call);
		},
		status: function(call){
			if(call.params && call.params.CallStatus != 'completed')
				return 'Active'
			else
				return 'Old Call'
		},
		time: function(call){
			if(call)
				return moment(call.updatedAt).fromNow();
		},
		call: function(number){
			if(!number)
				number = prompt('Please enter then number you would like to call.');
			if(number && number.length > 7){
				$http.post(config.parseRoot+'functions/call', {to: number})
				.success(function(response){
					console.log('Success response: ', response)
				})
				.error(function(response){
					console.log('Error response: ', response)
				})
			}else{
				alert('The number you entered had an error in it.')
			}
		},
		takeFloor: function(){
			$http.post(config.parseRoot+'functions/takeFloor', {})
			.success(function(response){
				console.log('Success response: ', response)
			})
			.error(function(response){
				console.log('Error response: ', response)
			})
		},
		redirect: function(call, agent){
			$http.post(config.parseRoot+'functions/redirect', {sid:call.sid, toNumber:agent.phone, agentId: agent.objectId})
			.success(function(response){
				console.log('Success response: ', response)
			})
			.error(function(response){
				console.log('Error response: ', response)
			})
		},
		twilio:{
			token:function(){
				return $http.post(config.parseRoot+'functions/clientKey', {})
			},
			init:function(){
				$scope.twilio = {
					status: 'connecting',
					callStatus: 'ended',
					connection: {},
					presence: []
				}
				tools.twilio.token().success(function(response){
					var data = response.result;
					Twilio.Device.setup(data.token);

					Twilio.Device.ready(function (device) {
						$scope.twilio.device = device;
						$scope.twilio.status = 'ready';
					});
					Twilio.Device.offline(function (device) {
						$scope.twilio.device = device;
						$scope.twilio.status = 'offline';
					});
					Twilio.Device.error(function (error) {
						$scope.twilio.error = error;
					});

					Twilio.Device.incoming(function(connection) {
						$scope.$apply(function(){
							$scope.twilio.call = connection.parameters;
							console.log(connection.parameters)
							$scope.twilio.callStatus = 'incoming';
							$scope.twilio.connection = connection;
						});
					});
					Twilio.Device.connect(function(connection) {
						$scope.$apply(function(){
							$scope.twilio.call = connection.parameters;
							console.log(connection.parameters)
							$scope.twilio.callStatus = 'connected';
							// $scope.twilio.connection = connection.parameters;
						});
					});
					Twilio.Device.disconnect(function(connection) {
						$scope.twilio.call = connection.parameters;
						console.log(connection.parameters)
						$scope.twilio.callStatus = 'ended';
						$scope.twilio.connection = connection.parameters;
					});
					Twilio.Device.presence(function(presenceEvent) {
						$scope.$apply(function(){
							$scope.twilio.presence.push(presenceEvent)
						});
					});
				})
			},
			accept:function(){
				$scope.twilio.connection.accept();
			},
			hangup:function(){
				Twilio.Device.disconnectAll();
			},
			call:function(number){
				$scope.twilio.connection = Twilio.Device.connect({
					"PhoneNumber": number,
					"CallerName": $rootScope.user.fullName,
					"AgentId": $rootScope.user.objectId
				});
			}
		}
	}

	callListPromise.then(function(myCalls){
		it.myCalls = myCalls;
		tools.item = myCalls.item;
	})
	$scope.tools = tools;
	it.CallCtrl=$scope;
});




















var AdminCtrl = app.controller('AdminCtrl', function($rootScope, $scope, $http, $q, config, initSetupService, roleService){
	var tools = {
		email:function(fun){
			$http.post(config.parseRoot+'functions/'+fun, {}).success(function(data){
				$scope.response = data;
			}).error(function(error, data){
				$scope.response = {error:error,data:data};
			});
		},
		setup:function(){
			roleService.detailedRoles().then(function(roles){
				$rootScope.data.roles = roles;
				roleService.unassigned().then(function(unassigned){
					$rootScope.data.unassigned = unassigned;
				})
			})
		},
		userRoles:roleService,
		user:{
			editRoles:function(user){
				$rootScope.temp.user = user;
				$('#adminUserModal').modal('show');
				// ga('send', 'event', 'admin', 'editRoles');
			}
		},
		roles:{
			setup:function(){	//This is a one time only thing - used to initiate the website roles.
				initSetupService.setup($rootScope.user,config.roles).then(function(results){
					$rootScope.data.roles = results;
				})
			}
		}
	}

	tools.setup();
	$scope.$on('authenticated', function() {
		tools.setup();
	})
	$rootScope.$on('role-reassigned', function(event,unassigned){
		$rootScope.data.unassigned = unassigned;
	})
	$scope.tools = tools;
	it.AdminCtrl=$scope;
});