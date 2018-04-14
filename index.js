const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const passport = require('passport');

var messageID = {};
var users = {};
var counter = 0;

app.use(express.static("public"));

app.get('/', function(req, res){

});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('join room', function(id){
    socket.join(id.roomId);
    if(!users[socket.id]) {
      users[socket.id] = { name: id.name };
    }
    io.to(id).emit('room msg', {msg: 'Welcome to the room'});
  });
  socket.on('interim', obj => {
    if(!messageID[socket.id]) {
      messageID[socket.id] = counter++;
    }
    var roomID = Object.keys(socket.rooms)[1];
    io.to(roomID).emit('interim update', { string: obj, id: messageID[socket.id], user: users[socket.id], target: socket.id} );
  });
  socket.on('final', obj => {
    var roomID = Object.keys(socket.rooms)[1];
    io.to(roomID).emit('final update', { string: obj, id: messageID[socket.id], user: users[socket.id], target: socket.id} );
    messageID[socket.id] = undefined;
  });
});

var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: "998277289939-80n1rq3l9uhjr643ugutnedj2ln01st6.apps.googleusercontent.com",
    clientSecret: "auiz-QSfxKC6I6LyJ_VkTzR0",
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    /*User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });*/

    return profile;
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', successRedirect: '' }));

if (process.env.PRODUCTION == 1) {
  const opts = {
		key: fs.readFileSync("/etc/letsencrypt/live/ahirst.com/privkey.pem"),
		cert: fs.readFileSync("/etc/letsencrypt/live/ahirst.com/fullchain.pem")
	};

	// Set the app to listen on port 80
	https.createServer(opts, app).listen(444, () => {
		console.log("Listening on 444");
	});

	// Redirect http to https
	const http = express();
	http.get("*", (req, res) => {
		res.redirect("https://" + req.headers.host + req.url);
	});
	http.listen(3000, () => console.log("Redirecting from port 3000"));
} else {
  http.listen(3000, () => {
      console.log("listening on 3000");
  })
}
