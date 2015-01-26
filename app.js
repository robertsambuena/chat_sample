//dependencies
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');

//connect to database
mongoose.connect('mongodb://localhost/chat_db');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  console.log('callback');
  var users_schema = mongoose.Schema({
      id: String,
      nickname: String,
      created_at: Date,
      sockets: []
  });
  var user_model = mongoose.model('users', users_schema);
  var new_user = new user_model({
    id: 12,
    nickname: 'testboys',
    created_at: new Date(),
    sockets: ['h929svnert0fsdfo', 'urbvpn0378djqpbso3']
  });
  console.log('new_user',new_user);
  new_user.save(function (err, res) {
    if (err) return console.error(err);
    console.log('new_user res',res);
  });
  user_model.find(function (err, new_user) {
    if (err) return console.error(err);
    console.log('find_all', new_user);
  });
  user_model.find({ name: /^testdata/ }, function (err, res) {
    if (err) return console.error(err);
    console.log('find', res);
  });
});


//custom variables
var __current_users = {};

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/js', function(req, res){
  res.sendFile(__dirname + '/index.js');
});
app.get('/css', function(req, res){
  res.sendFile(__dirname + '/index.css');
});

//convert object to array
function obj_to_array (obj) {
  if ( obj!== null && typeof obj === 'object')
    return Object.keys(obj).map(function (key) {return obj[key]});
  return false;
}


// SOCKET DECLARATION
var User = io.of('/default_user');
User.on('connection', function(socket) {
  //join default_room
  socket.join('default_room');

  /* Catch events from client */
  //connect
  socket.on('connect', function(user){
    console.log('user connected');
  });

  //disconnect
  socket.on('disconnect', function() {

    console.log('user disconnected', __current_users);
  });


  //someone connected
  socket.on('user_connect', function(user) {
    //send to everyone except the sender
    if (!user.sockets) user.sockets = []; //initialize if not declared user.sockets
    if (user && user.id) {
      var specific_user = chatuser.get(user.id);
      user.sockets.push(socket.id); //save new socket to user
      if (specific_user) user = specific_user;
      else chatuser.edit(user.id, user);
    }
    socket.in('default_room').emit('user_connect', user); //send event
  });

  //someone sent a message
  socket.on('chat_message', function(chat) {
    //send to everyone except the sender
    socket.in('default_room').emit('chat_message', chat);
  });

  socket.on('get_current_users', function(chat) {
    //send to everyone except the sender
    check_all_user_status();
  });
});

//user resource
//__current_users will be replaced with a real database resource
function ChatUser () {
  this.get = function (id) {
    if (id) return __current_users;
    else return __current_users[id] || false
  };
  this.add = function (user) {
    return __current_users[user.id] = user;
  };
  this.edit = function (id, user) {
    if (__current_users[id]) return __current_users[id].user = user;
    return false;
  };
  this.get_by_socket = function (sid) {
    //get current online users
    var __current_users_arr = obj_to_array(__current_users);
    return __current_users_arr.filter(function (arr) {
         return !!~arr.sockets.indexOf(sid);
    });
  };
  this.remove_socket = function (sid) {
    //get current online users
    var __current_users_arr = obj_to_array(__current_users);
    return __current_users_arr.filter(function (arr) {
        var result = arr.sockets.indexOf(sid)
        if (!!~result){
          __current_users[__current_users_arr.id].sockets[result].splice(result, 1);
        }
        return true;
    });
  };
}

var chatuser = new ChatUser();

//get current online users
function check_all_user_status() {
  console.log('User.adapter.rooms[]',User.adapter.rooms['default_room']);
  var socket_ids = Object.keys(User.adapter.rooms['default_room'] || {}),
      online_users = [],
      __current_users_arr = obj_to_array(chatuser.get());
      console.log('__current_users',__current_users);
  //check the socket_ids from users
  socket_ids.forEach(function(sid) {
    online_users.push(chatuser.get_by_socket(sid));
    console.log('online_users', online_users.length);
  });
  console.log('send event \'current online\': ' + __current_users_arr.length);
  //send to all sockets
  io.of('/default_user').in('default_room').emit('get_current_users', online_users);
}

setInterval(check_all_user_status, 5000);

http.listen(3000, function(){
  console.log('listening on *:3000');
});