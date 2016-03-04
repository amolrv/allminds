mindMapService = App.MindMapService.getInstance();
//Meteor.publish('mindmap', function (id) {
//   return Mindmaps.find({$or:[{_id:id},{rootId:id}]});
Meteor.publish('mindmap', function (id, user_email_id) {
  var readPermitted = acl.findOne({user_id: { $in: [user_email_id, "*"] }, mind_map_id: id});
  if(readPermitted)
    return Mindmaps.find({$or:[{_id:id},{rootId:id}]});
  else
    return Mindmaps.find({_id: null});
   //return Mindmaps.find({});
});
Meteor.publish('userdata', function () {
  return Meteor.users.find(this.userId);
});
Meteor.publish('myRootNodes', function(emailId) {
  return rootNodesOfMyMaps(emailId);
});

var rootNodesOfMyMaps = function(emailId) {
  var permissions = acl.find({ user_id: emailId }).fetch();
  var myMapIds = permissions.map(function(element) { return element.mind_map_id });
  return Mindmaps.find({_id: { $in: myMapIds }});
};

Meteor.methods({
  //Only Meteor can delete the documents - Not permitted for client
  deleteNode: function (id) {
    mindMapService.deleteNode(id);
  },

  countMaps: function () {
    return Mindmaps.find({parentId: null}).count();
  },
  countNodes: function() {
     return Mindmaps.find({}).count();
  },
  findTree: function (id) {
    return mindMapService.findTree(id);
  },
  addMapToUser: function(emailId, mindMapId, permisson) {
    App.DbService.addUser(emailId, mindMapId, permisson);
  },
  iterateOverNodesList: function(){
          var AllNodes= Mindmaps.find({}).fetch();
          generateData(AllNodes);
    },
  isWritable: function (mindMapId, emailId) {
      var b = acl.find({mind_map_id: mindMapId, user_id: {$in: [emailId, "*"]}, permissions: "w"}).fetch().length > 0;
      return b;
  }});
