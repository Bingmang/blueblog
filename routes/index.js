var express = require('express');
var crypto = require('crypto');
var multer = require('multer');
var User = require('../models/user');
var Post = require('../models/post');
var Comment = require('../models/comment');
var router = express.Router();

var upload = multer({
    dest: './public/images/',                      //文件上传所在目录
    rename: function (fieldname, filename) {        //修改上传后的文件名，这里设置为保持原来的文件名
        return filename;
    }
});
/*
 * req.query 处理get请求，获取get请求参数
 * req.params 处理/:xxx形式的get或post请求，获取请求参数
 * req.body 处理post请求，获取post请求体
 * req.param() 处理get和post请求，但查找优先级由高到低为req.params->req.body->req.query
*/

function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录！');
        res.redirect('/login');
    }
    next();                         //通过next()转移控制权
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登陆！');
        res.redirect('back');         //返回之前的页面
    }
    next();
}

/* GET home page. */
router.get('/', function (req, res, next) {
    // 判断是否是第一页，并把请求的页数转换成number类型，这里q是字符串形式，需要转换
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //查询并返回第page页的10篇文章
    Post.getTen(null, page, function (err, posts, total) {
        if (err) {
            posts = [];
        }
        res.render('index', {
            title: '主页',
            posts: posts,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 10 + posts.length) == total,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/reg', checkNotLogin);
router.get('/reg', function (req, res, next) {
    res.render('reg', {
        title: '注册',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/reg', checkNotLogin);
router.post('/reg', function (req, res, next) {
    var
        name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //检验用户两次输入的密码是否一致
    if (password_re != password) {
        req.flash('error', '两次输入的密码不一致');         //将后面的字符串赋值给success,error 并添加至session中
        return res.redirect('/reg');  //返回注册页
    }
    //生成密码的md5值
    var
        md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
        name: name,
        password: password,
        email: req.body.email
    });
    //检查用户名是否已经存在
    User.get(newUser.name, function (err, user) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        if (user) {
            req.flash('error', '用户已存在!');
            return res.redirect('/reg');  //返回注册页
        }
        //如果不存在则新增用户
        newUser.save(function (err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg'); //注册失败返回注册页
            }
            req.session.user = user;  //用户信息存入session
            req.flash('success', '注册成功！');
            res.redirect('/');        //注册成功后返回主页
        });
    });
});

router.get('/login', checkNotLogin)
router.get('/login', function (req, res, next) {
    res.render('login', {
        title: '登陆',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/login', checkNotLogin);
router.post('/login', function (req, res, next) {
    var
        md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name, function (err, user) {
        if (!user) {
            req.flash('error', '用户不存在！');
            return res.redirect('/login');        //用户不存在则跳转到登陆页
        }
        //检查密码是否一致
        if (user.password != password) {
            req.flash('error', '密码错误！');
            return res.redirect('/login');
        }
        req.session.user = user;                            //用户名密码都匹配后，将用户信息存入session
        req.flash('success', '登陆成功！');
        res.redirect('/');                                  //登陆成功后跳转到主页
    })
})

router.get('/post', checkLogin);
router.get('/post', function (req, res, next) {
    res.render('post', {
        title: '发表',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/post', checkLogin);
router.post('/post', function (req, res, next) {
    var currentUser = req.session.user,
        post = new Post(currentUser.name, req.body.title, req.body.post);
    post.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        req.flash('success', '发布成功！');
        res.redirect('/');  //发表成功跳转主页
    });
});

router.get('/logout', checkLogin);
router.get('/logout', function (req, res, next) {
    req.session.user = null;                   //通过把req.session.user赋值null丢掉session中用户的信息，实现用户的退出
    req.flash('success', '登出成功！');
    res.redirect('/');                         //登出成功后跳转到主页
});

router.get('/upload', checkLogin);
router.get('/upload', function (req, res, next) {
    res.render('upload', {
        title: '文件上传',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

//TODO
router.post('/upload', checkLogin);
router.post('/upload', upload.fields([
    { name: 'file1' },
    { name: 'file2' },
    { name: 'file3' },
    { name: 'file4' },
    { name: 'file5' }
]), function (req, res, next) {
    for (let i in req.files) {
        console.log(req.files[i]);
    }
    req.flash('success', '文件上传成功！');
    res.redirect('/upload');
});

router.get('/u/:name', function (req, res, next) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    //检查用户是否存在
    User.get(req.params.name, function (err, user) {
        if (!user) {
            req.flash('error', '用户不存在!');
            return res.redirect('/');
        }
        //查询并返回该用户第 page 页的 10 篇文章
        Post.getTen(user.name, page, function (err, posts, total) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.name,
                posts: posts,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 10 + posts.length) == total,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
});

router.get('/u/:name/:day/:title', function (req, res, next) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('article', {
            title: req.params.title,
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.get('/edit/:name/:day/:title', checkLogin);
router.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        res.render('edit', {
            title: '编辑',
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function (req, res, next) {
    var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
        var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
        if (err) {
            req.flash('error', err);
            return res.redirect(url);
        }
        req.flash('success', '修改成功！');
        res.redirect(url);          //修改成功，返回文章页
    });
});

router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function (req, res, next) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success', '删除成功！');
        res.redirect('/');
    });
});

router.post('/u/:name/:day/:title', checkLogin);
router.post('/u/:name/:day/:title', function (req, res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var comment = {
        name: req.body.name,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success', '留言成功!');
        res.redirect('back');
    });
});

module.exports = router;