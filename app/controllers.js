var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $routeParams, $location, $http, config, userService, dataService){
	$rootScope.action = $routeParams.action;
	$rootScope.view = $routeParams.view;
	$rootScope.id = $routeParams.id;
	$rootScope.config = config;

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
















var CallCtrl = app.controller('CallCtrl', function($rootScope, $scope, $q, config, dataService, userService){
	var callListDefer = $q.defer();
	userService.user().then(function(user){
		var calls = new dataService.resource('Calls', 'callList', true, true);
		// var calls = new dataService.resource('Calls', user.objectId+'/calls', true, true);
			// calls.setQuery('where={"shoeBox":"'+$rootScope.id+'"}');
		callListDefer.resolve(calls);
		calls.item.list().then(function(data){
			$scope.calls = data.results;
		})
		$rootScope.$on(calls.listenId, function(event, data){
			$scope.calls = data.results;
		})
	});
	var callListPromise = callListDefer.promise;

	var tools = {
		focus:function(call){
			$rootScope.temp.current = call;
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
			if(call.params.CallStatus != 'complete')
				return 'Active'
			else
				return 'Old Call'
		}
	}

	callListPromise.then(function(myCalls){
		it.myCalls = myCalls;
		tools.item = myCalls.item;
	})
	$scope.tools = tools;
	it.CallCtrl=$scope;
});
















var ItemListCtrl = app.controller('ItemListCtrl', function($rootScope, $scope, $q, config, dataService, fileService, userService, qrService){
	var itemListDefer = $q.defer();
	userService.user().then(function(user){
		var mitm = new dataService.resource('item', user.objectId+'/allItems', true, true);
			// mitm.setQuery('where={"shoeBox":"'+$rootScope.id+'"}');
		itemListDefer.resolve(mitm);
		mitm.item.list().then(function(data){
			$scope.myItems = data;
		})
		$rootScope.$on(mitm.listenId, function(event, data){
			$scope.myItems = data;
		})
	});
	var itemListPromise = itemListDefer.promise;

	var shoeBoxListDefer = $q.defer();
	userService.user().then(function(user){
		var msb = new dataService.resource('shoeBox', user.objectId+'/shoeBoxList', true, true);
		shoeBoxListDefer.resolve(msb);
			// msb.setQuery('where={"category":"apple"}');
		msb.item.list().then(function(data){
			$scope.myShoeBoxes = data;
		})
		$rootScope.$on(msb.listenId, function(event, data){
			$scope.myShoeBoxes = data;
		})
	});
	var ShoeBoxListPromise = shoeBoxListDefer.promise;

	var tools = {
		getShoeBox:function(objectId){
			for(var i=0; i<$scope.myShoeBoxes.results.length; i++)
				if($scope.myShoeBoxes.results[i].objectId == objectId)
					return $scope.myShoeBoxes.results[i]
		}
	}

	itemListPromise.then(function(myItems){
		it.myItems = myItems;
		tools.item = myItems.item;
	})
	$scope.tools = tools;
	it.ItemListCtrl=$scope;
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