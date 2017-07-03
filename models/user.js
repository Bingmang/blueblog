var mongodb = require('./db');
var async = require('async');

class User {
    constructor(user) {
        this.name = user.name;
        this.password = user.password;
        this.email = user.email;
    };

    //存储用户信息    
    save(callback) {
        //要存入数据库的document
        var user = {
            name: this.name,
            password: this.password,
            email: this.email
        };
        async.waterfall([
            function (callback) {
                //打开数据库
                mongodb.open(function (err, db) {
                    callback(err, db);
                });
            },
            function (db, callback) {
                //读取users collection
                db.collection('users', function (err, collection) {
                    callback(err, collection);
                });
            },
            function (collection, callback) {
                //将用户数据插入users集合
                collection.insert(user, { safe: true }, function (err, user) {
                    callback(err, user);
                });
            }
        ], function (err, user) {
            mongodb.close();
            callback(err, user[0]);
        });
    }

    static get(name, callback) {
        async.waterfall([
            function (callback) {
                // 打开数据库
                mongodb.open(function (err, db) {
                    callback(err, db);
                });
            },
            function (db, callback) {
                // 读取users集合
                db.collection('users', function (err, collection) {
                    callback(err, collection);
                });
            },
            function (collection, callback) {
                // 查找用户名
                collection.findOne({
                    name: name
                }, function (err, user) {
                    callback(err, user)
                });
            }
        ], function (err, user) {
            mongodb.close();
            callback(err, user);
        });
    };
};

module.exports = User;