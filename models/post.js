var mongodb = require('./db');
var markdown = require('markdown').markdown;
var async = require('async');
class Post {
    constructor(name, title, post) {
        this.name = name;
        this.title = title;
        this.post = post;
    }
    
    save(callback) {
        var date = new Date();
        // 存储各种时间格式，方便以后扩展
        var time = {
            date: date,
            year: date.getFullYear(),
            month: date.getFullYear() + "-" + (date.getMonth() + 1),
            day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
            minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        }
        // 要存入数据库的document
        var post = {
            name: this.name,
            time: time,
            title: this.title,
            post: this.post,
            comments: []
        };
        async.waterfall([
            function (callback) {
                //打开数据库
                mongodb.open(function (err, db) {
                    callback(err, db);
                });
            },
            function (db, callback) {
                //读取posts集合
                db.collection('posts', function (err, collection) {
                    callback(err, collection);
                });
            },
            function (collection, callback) {
                //将文档插入posts集合
                collection.insert(post, { safe: true }, function (err) {
                    callback(err);
                });
            }
        ], function (err) {
            mongodb.close();
            callback(err);
        });
    }

    //QUESTION    
    //读取文章及其相关信息，一次获取十篇文章
    static getTen(name, page, callback) {
        //打开数据库
        mongodb.open(function (err, db) {
            if (err) {
                return callback(err);
            }
            //读取 posts 集合
            db.collection('posts', function (err, collection) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                var query = {};
                if (name) {
                    query.name = name;
                }
                //使用 count 返回特定查询的文档数 total
                collection.count(query, function (err, total) {
                    //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
                    collection.find(query, {
                        skip: (page - 1) * 10,
                        limit: 10
                    }).sort({
                        time: -1
                    }).toArray(function (err, docs) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                        //解析 markdown 为 html
                        docs.forEach(function (doc) {
                            doc.post = markdown.toHTML(doc.post);
                        });
                        callback(null, docs, total);
                    });
                });
            });
        });
    }

    static getOne(name, day, title, callback) {
        async.waterfall([
            function (callback) {
                // 打开数据库
                mongodb.open(function (err, db) {
                    callback(err, db);
                });
            },
            function (db, callback) {
                // 读取posts collection
                db.collection('posts', function (err, collection) {
                    callback(err, collection);
                });
            },
            function (collection, callback) {
                //根据用户名、发表日期及文章名进行查询
                collection.findOne({
                    "name": name,
                    "time.day": day,
                    "title": title
                }, function (err, doc) {
                    callback(err, doc);
                });
            }
        ], function (err, doc) {
            mongodb.close();
            //解析markdown为html
            if (doc) {
                doc.post = markdown.toHTML(doc.post);
                // 将每个评论也解析为html
                if (!doc.comments) {
                    // 原始数据库中没有comments字段，防止取出后是undefined
                    doc.comments = [];
                }
                doc.comments.forEach(function (comment) {
                    comment.content = markdown.toHTML(comment.content);
                });
            }
            callback(err, doc);
        });
    }

    static edit(name, day, title, callback) {
        async.waterfall([
            function (callback) {
                // 打开数据库
                mongodb.open(function (err, db) {
                    callback(err, db);
                });
            },
            function (db, callback) {
                // 读取posts collection
                db.collection('posts', function (err, collection) {
                    callback(err, collection);
                });
            },
            function (collection, callback) {
                // 找到要编辑的文章并返回
                collection.findOne({
                    "name": name,
                    "time.day": day,
                    "title": title
                }, function (err, doc) {
                    callback(err, doc);
                });
            }
        ], function (err, doc) {
            mongodb.close();
            callback(err, doc);
        });
    }

    static update(name, day, title, post, callback) {
        async.waterfall([
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
                collection.update({
                    "name": name,
                    "time.day": day,
                    "title": title
                }, { $set: { post: post } }, function (err) {
                    callback(err);
                });
            }
        ], function (err) {
            mongodb.close();
            callback(err);
        });
    }

    static remove(name, day, title, callback) {
        async.waterfall([
            function (callback) {
                mongodb.open(function (err, db) {
                    callback(err, db);
                });
            },
            function (db, callback) {
                db.collection('posts', function (err, posts) {
                    callback(err, posts);
                });
            },
            function (collection, callback) {
                // 根据用户名、日期和标题查找并删除一篇文章
                collection.remove({
                    "name": name,
                    "time.day": day,
                    "title": title
                }, { justOne: true }, function (err) {
                    callback(err);
                });
            }
        ], function (err) {
            mongodb.close();
            callback(err);
        });
    }
};

module.exports = Post;