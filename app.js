var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// ---以下是存储cookie需要使用到的模块,实现了将会话信息存储到mongodb中 --
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');                             //用于将信息写入flash，下一次显示完毕后即被清除，典型用于重定向，确保信息提供给下一个被渲染的页面

var settings = require('./settings');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();                                              //生成一个express实例app

app.set('views', path.join(__dirname, 'views'));                  //设置views文件夹为存放视图文件的目录，即存放模板文件的地方
app.set('view engine', 'ejs');                                    //设置视图模板引擎为ejs


// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));  //设置/public/favicon.ico为favicon图标
app.use(logger('dev'));                                           //加载日志中间件
app.use(bodyParser.json());                                       //加载解析json的中间件
app.use(bodyParser.urlencoded({ extended: false }));              //加载解析urlencoded请求体的中间件
app.use(cookieParser());                                          //加载解析cookie的中间件
app.use(express.static(path.join(__dirname, 'public')));          //设置public文件夹为存放静态文件的目录
app.use(flash());

// 将会话信息存储到mongodb中
app.use(session({
  secret: settings.cookieSecret,                                  //用于防止篡改cookie
  key: settings.db,                                               //cookie的名字
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 },                   //通过设定maxAge值设定cookie的生存周期，这里是30days
  store: new MongoStore({                                         //store参数为MongoStore的实例，把会话信息存储到数据库中，以避免丢失
    // db: settings.db,
    // host: settings.host,
    // port: settings.port
    url: settings.url                                            //新版写法，上面是旧版了
  })
}));


// 路由控制器
app.use('/', index);
app.use('/users', users);

// 捕捉404错误，并转发到错误处理器
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// 开发环境下的错误处理器，将错误信息渲染error模板并显示到浏览器中
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;                                               //导出app实例供其他模块调用
