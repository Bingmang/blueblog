var mongodb = require('./db');
var async = require('async');
class Comment{
    constructor(name, day, title, comment) {
        this.name = name;
        this.day = day;
        this.title = title;
        this.comment = comment;
    }

    save(callback) {
        var
            name = this.name,
            day = this.day,
            title = this.title,
            comment = this.comment;
        async.waterfall([
            // 打开数据库
            function (callback) {
                mongodb.open(function (err, db) {
                    callback(err, db);
                });
            },
            function (db, callback) {
                db.collection('posts', function (err, collection) {
                    callback(err, collection);
                });
            },
            function (collection, callback) {
                //通过用户名、时间及标题查找文档，并把一条留言对象添加到该文档的comments数组里
                collection.update({
                    "name": name,
                    "time.day": day,
                    "title": title
                }, { $push: { "comments": comment } }, function (err) {
                    callback(err);
                });
            }
        ], function (err) {
            mongodb.close();
            callback(err);
        });
    }

}

module.exports = Comment;