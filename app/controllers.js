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










var ShoeBoxCtrl = app.controller('ShoeBoxCtrl', function($rootScope, $scope, $q, config, dataService, fileService, userService, qrService){
	var myShoeBoxDefer = $q.defer();
	userService.user().then(function(user){
		var msb = new dataService.resource('shoeBox', user.objectId+'/shoeBoxList', true, true);
			// msb.setQuery('where={"category":"apple"}');
		myShoeBoxDefer.resolve(msb);
		msb.item.list().then(function(data){
			$scope.myShoeBoxes = data;
		})
		$rootScope.$on(msb.listenId, function(event, data){
			$scope.myShoeBoxes = data;
		})
	});
	var myShoeBoxPromise = myShoeBoxDefer.promise;

	var tools = {
		qr: qrService,
		initInd: function(){
			myShoeBoxPromise.then(function(myShoeBoxes){
				myShoeBoxes.item.get($rootScope.id).then(function(shoeBox){
					console.log('Current Shoebox: ',shoeBox)
					$scope.temp.currentShoeBox = shoeBox;
				})
			})
		},
		focus: function(shoeBox){
			$rootScope.temp.currentShoeBox = shoeBox;
		},
		setPicture: function(details,src){
			if(!$rootScope.temp.currentShoeBox)
				$rootScope.temp.currentShoeBox = {};
			$rootScope.$apply(function(){
				$rootScope.temp.currentShoeBox.picture = {
					temp: true,
					status: 'uploading',
					class: 'grayscale',
					name: 'Image Uploading...',
					src: src
				};
			})

			fileService.upload(details,src,function(data){
				$rootScope.$apply(function(){
					$rootScope.temp.currentShoeBox.picture = {
						name: data.name(),
						src: data.url()
					}
				})
			});
		},
		add: function(shoeBox){
			myShoeBoxPromise.then(function(myShoeBoxes){
				myShoeBoxes.item.save(shoeBox)
			})
			$scope.temp.shoeBox = {};
		},
		create: function(){
			var shoeBox = {
				title: 'Untitled ShoeBox',
				location: 'Unknown Location'
			}
			ga('send', 'event', 'shoebox', 'create');
			myShoeBoxPromise.then(function(myShoeBoxes){
				myShoeBoxes.item.save(shoeBox).then(function(response){
					window.location.hash = '#/shoebox/'+response.objectId
				})
			})
		}
	}
	myShoeBoxPromise.then(function(myShoeBoxes){
		it.myShoeBoxes = myShoeBoxes;
		tools.shoeBox = myShoeBoxes.item;
	})
	$scope.tools = tools;
	it.ShoeBoxCtrl=$scope;
});










var ShoeBoxItemCtrl = app.controller('ShoeBoxItemCtrl', function($rootScope, $scope, $q, config, dataService, fileService, userService, qrService){
	var myItemDefer = $q.defer();
	userService.user().then(function(user){
		var mitm = new dataService.resource('item', user.objectId+'/shoeBoxItems/'+$rootScope.id, true, true);
			mitm.setQuery('where={"shoeBox":"'+$rootScope.id+'"}');
			mitm.addLiveStream(user.objectId+'/allItems')
		myItemDefer.resolve(mitm);
		mitm.item.list().then(function(data){
			$scope.myItems = data;
		})
		$rootScope.$on(mitm.listenId, function(event, data){
			$scope.myItems = data;
		})
	});
	var myItemPromise = myItemDefer.promise;

	var tools = {
		qr: qrService,
		focus: function(item){
			$rootScope.temp.currentItem = item;
		},
		remove: function(item, action){
			if(!action){
				$rootScope.temp.currentItem = item;
				$('#itemRemoveModal').modal('show');
			}else{
				ga('send', 'event', 'item', 'remove', action);
				if(action=='temp')
					$rootScope.temp.currentItem.inBox = false;
				else if(action == 'fromBox')
					$rootScope.temp.currentItem.shoeBox = null;
				else if(action == 'permanent')
					tools.item.remove($rootScope.temp.currentItem)
				$('#itemRemoveModal').modal('hide');
			}
		},
		create: function(){
			var item = {
				title: 'Untitled Item',
				shoeBox: $rootScope.id,
				inBox: true
			}
			ga('send', 'event', 'item', 'create');
			myItemPromise.then(function(myItems){
				myItems.item.save(item).then(function(response){
					// window.location.hash = '#/item/'+response.objectId
					// alert('Item Created');
					console.log('Item Created',response)
				})
			})
		}
	}
	myItemPromise.then(function(myItems){
		it.myItems = myItems;
		tools.item = myItems.item;
	})
	$scope.tools = tools;
	it.ShoeBoxItemCtrl=$scope;
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