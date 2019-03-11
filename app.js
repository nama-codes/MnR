const express = require('express');
const path = require('path');
const port     = process.env.PORT || 8000;
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const redis = require('redis');
const mongoose = require('mongoose');
const Data = require('./data.js');

const app = express();
const client = redis.createClient();

//Mongoose Connection
mongoose.connect('mongodb://localhost/mnr');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

client.on('connect', function() {
  console.log('Redis client connected');
});

client.on('error', function (err) {
  console.log('Something went wrong ' + err);
});

app.get('/', (req, res) => {
  res.render('index.ejs');
})

app.post('/postdata', (req, res) => {
  client.set('data', JSON.stringify(req.body));
  client.get('data', function (error, data) {
    if (error) {
      console.log(error);
    }
    let newData = new Data(JSON.parse(data));
    newData.save().then(() => {
      client.del('data');
      res.send(true);
    }).catch((error) => {
      console.log(error);
    })
  });
})

app.get('/getdata', (req, res) => {
  Data.find({}).then((data) => {
    res.json(data);
  }).catch((error) => {
    console.log(error);
  })
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);
});

app.listen(port, function(){
  console.log('Server is now running at port: ' + port);
});

module.exports = app;
