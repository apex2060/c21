Parse.Cloud.beforeSave("shoeBox", function(request, response) {
    var userId = Parse.User.current().id;
    var profileACL = new Parse.ACL();
    profileACL.setReadAccess(userId, true);
    profileACL.setWriteAccess(userId, true);
    request.object.set('ACL', profileACL);
    response.success();
});
 
Parse.Cloud.beforeSave("item", function(request, response) {
    var userId = Parse.User.current().id;
    var profileACL = new Parse.ACL();
    profileACL.setReadAccess(userId, true);
    profileACL.setWriteAccess(userId, true);
    request.object.set('ACL', profileACL);
    response.success();
});