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
		url:function(){
			return 'views/'+$routeParams.view+'.html';
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
	$scope.tools = tools;

	if(!$rootScope.data){
		tools.setup();
	}
	it.MainCtrl=$scope;
});
















var CallCtrl = app.controller('CallCtrl', function($rootScope, $scope, $q, $http, config, dataService, userService){
	var clientListDefer = $q.defer();
	userService.user().then(function(user){
		var clients = new dataService.resource('Clients', 'clientList', true, true);
		// var clients = new dataService.resource('clients', user.objectId+'/clients', true, true);
			// clients.setQuery('where={"shoeBox":"'+$rootScope.id+'"}');
		clientListDefer.resolve(clients);
		clients.item.list().then(function(data){
			$scope.clients = data.results;
		})
		$rootScope.$on(clients.listenId, function(event, data){
			$scope.clients = data.results;
		})
	});
	var clientListPromise = clientListDefer.promise;


	var callListDefer = $q.defer();
	userService.user().then(function(user){
		var calls = new dataService.resource('Calls', 'callList', true, true);
		// var calls = new dataService.resource('Calls', user.objectId+'/calls', true, true);
			// calls.setQuery('where={"shoeBox":"'+$rootScope.id+'"}');
			calls.setQuery('order=updatedAt');
			calls.setQuery('limit=10');
		callListDefer.resolve(calls);
		calls.item.list().then(function(data){
			$scope.calls = data.results;
			tools.formatAll($scope.calls);
		})
		$rootScope.$on(calls.listenId, function(event, data){
			$scope.calls = data.results;
			tools.formatAll($scope.calls);
		})
	});
	var callListPromise = callListDefer.promise;

	var tools = {
		client:{
			init: function(call){
				tools.client.get(call).then(function(client){
					if(client.status != 'error')
						$rootScope.temp.client = client;
					else{
						if(call.direction == 'inbound')
							$rootScope.temp.client = {
								phone: call.from
							}
						else
							$rootScope.temp.client = {
								phone: call.to
							}
					}
				})
			},
			add: function(client){
				clientListPromise.then(function(clientResource){
					clientResource.item.save(client).then(function(response){
						alert('Client Saved.');
					});
				})
			},
			get: function(call){
				var defer = $q.defer();
				clientListPromise.then(function(clientResource){
					clientResource.item.list().then(function(data){
						var clients = data.results;
						for(var i=0; i<clients.length; i++){
							if(call.direction == 'inbound'){
								if(clients[i].phone == call.from)
									defer.resolve(clients[i]);
							}else{
								if(clients[i].phone == call.to)
									defer.resolve(clients[i]);
							}

						}
						defer.resolve({status:'error', message:'No client found.'});
					})
				})
				return defer.promise;
			}
		},
		formatAll:function(calls){
			$rootScope.temp.current = false;
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
				if(call.direction == 'inbound' && call.status != 'completed'){
					$rootScope.temp.current = call;
					tools.client.init(call);
				}
			})
		},
		display:function(call){
			if(call.direction=='inbound')
				if(call.info)
					return call.info.name;
				else
					return call.from;
			else
				if(call.info)
					return call.info.name;
				else
					return call.to;
		},
		focus:function(call){
			$rootScope.temp.call = call;
			tools.client.init(call);
		},
		getAgent:function(agentId){
			var agents = [
				'Russell Crosby',
				'Becky Crosby',
				'Brandi Snider',
				'Brenda Ciminski'
			]
			return agents[agentId];
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
			$http.post(config.parseRoot+'functions/call', {to: number})
			.success(function(response){
				console.log('Success response: ', response)
			})
			.error(function(response){
				console.log('Error response: ', response)
			})
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