var socket = io('http://192.168.1.124:3000/default_user');
	e_message_form = document.getElementById('message_form'),
	e_message_box = document.getElementById('messages'),
	e_userlist = document.getElementById('user-list'),
	user = {}, check_user = null;

// Chat class declaration
function Chat () {
	this.get_messages = function (raw) {
		var chat = JSON.parse(localStorage.getItem('chat'));
		chat = chat?chat:[];
		if (raw) {
			chat.sort(function(a,b){
			  return new Date(b.crtd_at) - new Date(a.crtd_at);
			});
		}
		return chat;
	};
	this.add_message = function (chat_obj) {
		var chat = JSON.parse(localStorage.getItem('chat'));
		chat = chat?chat:[];
		console.log('chat_obj--',chat_obj);
		chat.push(chat_obj);
		localStorage.setItem('chat', JSON.stringify(chat));
		return true;
	};
	this.get_user = function () {
		return JSON.parse(localStorage.getItem('user'));
	};
	this.set_user = function (user) {
		console.log('set_user',user);
		localStorage.setItem('user', JSON.stringify(user));
		console.log(JSON.stringify(user));
		return true;
	};
	this.reset = function (argument) {
		localStorage.setItem('user', null);
		localStorage.setItem('chat', null);
		return true;
	};
}

//instantiate Chat class
var chat_storage = new Chat();

//send message
e_message_form.addEventListener("submit", function(event) {
	var chat_sending = {
		'msg': e_message_form.m.value,
		'nick': user.nickname
	};
	socket.emit('chat_message', chat_sending);
	e_message_form.m.value = '';
	//save message locally
	append_a_message(chat_sending);
	chat_storage.add_message({
    	'type' : 'message',
    	'data' : chat_sending,
    	'crtd_at' : new Date()
    });
	event.preventDefault();
}, false);

//receive message
socket.on('chat_message', function(chat) {
	//save message locally
    append_a_message(chat);
    chat_storage.add_message({
    	'type' : 'message',
    	'data' : chat,
    	'crtd_at' : new Date()
    });
});

//someone connect
socket.on('user_connect', function(user) {
	console.log('use1',user);
	append_an_announcement(user);
    chat_storage.add_message({
    	'type' : 'announcement',
    	'data' : user,
    	'crtd_at' : new Date()
    });
});

//get current users
socket.on('get_current_users', function(users) {
	console.log('use1rs',users);
	e_userlist.innerHTML = '<div class="users-box-content"><a href="">' +users.nickname+ '</a></div>';
});

//connected!
socket.on('connected1', function(sid) {
	console.log('sid',sid);
	// init(sid);
});

//on close 
function closing (event) {
	console.log('event',event);
	alert('WTF');
    socket.emit('user_disconnect', {
		'nick': nickname
	});
}
//on close events
window.addEventListener("onbeforeunload", closing);
window.addEventListener("onunload", closing);

function append_an_announcement (user) {
	console.log("user");
	e_message_box.innerHTML = e_message_box.innerHTML + '<li class="announcement"><span class="msg"><b>'+user.nickname+'</b> is now connected.</span></li>';
	document.getElementById('popup-messages').scrollTop = document.getElementById('popup-messages').scrollHeight + 99999;
}

function append_a_message (chat) {
	var row_msg_class = "";
	if (chat.nick===user.nickname) {
		row_msg_class = 'self';
		e_message_box.innerHTML = e_message_box.innerHTML + '<li class="'+row_msg_class+'"><span class="msg">' + chat.msg + '</span></li>';
	}
    else {
    	row_msg_class = 'other';
    	e_message_box.innerHTML = e_message_box.innerHTML + '<li class="'+row_msg_class+'"><span class="nick">' + chat.nick + ': </span><span class="msg">' + chat.msg + '</span></li>';
    }
  	document.getElementById('popup-messages').scrollTop = document.getElementById('popup-messages').scrollHeight + 99999;
}

function refresh_page (e_message_box, chat_obj) {
	e_message_box.innerHTML = '';
	if (chat_obj) {
		chat_obj.forEach(function(chat) {
		    if (chat.type=='announcement') {
				append_an_announcement(chat.data);

			}
			else if (chat.type=='message') {
				append_a_message(chat.data);
			}
		});
	}
}

function reset_chat () {
	chat_storage.reset();
	e_message_box.innerHTML = '';
}

function get_current_users () {
	console.log('get_current_users');
	socket.emit('get_current_users', null);
}

//start
function init (sid) {
	check_user = chat_storage.get_user();
	if (check_user) {
		console.log('App use existing data');
		user = check_user;
		check_user = null;
		refresh_page(e_message_box, chat_storage.get_messages());
	}
	else {
		console.log('App Restarted');
		user.nickname = prompt("Nickname: ");
		if (user.nickname) {
			user.created_at = new Date();
			// user.id = sid;
			var random = Math.random().toString(36).slice(2);
			socket.emit('user_connect', {
				'id': random + 'bert',
				'nick': user.nickname
			});
			//append_an_announcement(user);
			chat_storage.set_user(user);
		}
	}
}
function toggleMessage(t){
	var divName = t.parentNode.getAttribute("id");
	
	if(document.getElementById(divName).classList.contains("hideMessage") == true){
		var newCl = String(document.getElementById(divName).classList).replace(/hideMessage/g,'');
		document.getElementById(divName).className = newCl;
		t.parentNode.getElementsByClassName("send-message")[0].style.display = "block";
	}
	else{
		document.getElementById(divName).className += " hideMessage";
		//console.log(t.parentNode.getElementsByClassName("send-message")[0]);
		t.parentNode.getElementsByClassName("send-message")[0].style.display = "none";
	}
}
init();