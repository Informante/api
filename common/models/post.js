var loopback = require('loopback');
var moment = require('moment');
var numeral = require('numeral');
var _ = require("underscore");
moment.locale('es');

module.exports = function(Post) {

  // disable remote methods
  Post.disableRemoteMethod('__get__postType', false);
  Post.disableRemoteMethod('__get__user', false);
  Post.disableRemoteMethod('__findById__comments', false);
  Post.disableRemoteMethod('__destroyById__comments', false);
  Post.disableRemoteMethod('__updateById__comments', false);
  Post.disableRemoteMethod('__exists__comments', false);
  Post.disableRemoteMethod('__link__comments', false);
  Post.disableRemoteMethod('__get__comments', false);
  Post.disableRemoteMethod('__create__comments', false);
  Post.disableRemoteMethod('__update__comments', false);
  Post.disableRemoteMethod('__destroy__comments', false);
  Post.disableRemoteMethod('__unlink__comments', false);
  Post.disableRemoteMethod('__count__comments', false);
  Post.disableRemoteMethod('__delete__comments', false);

  Post.generate = function(image, description, lat, lng, post_type_id,  cb) {
    // set current context
    var ctx = loopback.getCurrentContext();
    // set userId based accessToken
    var userId = ctx.active.http.req.accessToken.userId;

    Post.create({
      'image': image,
      'description': description,
      'location': {
        lat: lat,
        lng: lng
      },
      'post_type_id': post_type_id,
      'user_id': userId,
      'likes': [],
      'created_at': new Date()
    }, cb);
  }

  Post.getApp(function(err, app) {
    var Report = app.models.Report;
    var UserIdentity = app.models.userIdentity;
    var Comment = app.models.Comment;

    // add comment
    Post.comment = function(id, message, cb) {

      // set current context
      var ctx = loopback.getCurrentContext();
      // set userId based accessToken
      var userId = ctx.active.http.req.accessToken.userId;

      Post.findById(id, function(err, post) {
        if (err) {
          cb(err, null);
        }
        else if(post) {
          Comment.find(
            {
              'where': {
                'post_id': id,
                'user_id': userId,
                'created_at': {
                  gt: moment().subtract(30, 'seconds')
                }
              }
            }, function(err, commentExists) {
              if (err) {
                cb(err, null);
              }
              else if(commentExists.length > 0) {
                cb(new Error('Debes esperar 30 segundos antes de agregar otro comentario.'), null);
              }
              else {
                Comment.create({
                  'message': message,
                  'user_id': userId,
                  'post_id': id,
                  'enabled': true,
                  'created_at': new Date()
                }, function(err, comment) {
                  if (err) {
                    cb(err, null);
                  }
                  else if(comment) {
                    Post.findById(id, {
                      include: [
                        {
                          relation: 'comments',
                          scope: {
                            include: { // include orders for the owner
                              relation: 'user',
                              scope: {
                                fields: [
                                  'id'
                                ],
                                include: { // include orders for the owner
                                  relation: 'identities',
                                  scope: {
                                    fields: [
                                      'profile'
                                    ]
                                  }
                                }
                              }
                            }
                          }
                        }
                      ]
                    }, function(err, postComment) {
                      if (err) {
                        cb(null, 'Error al intentar obtener los comentarios.');
                      }
                      else if (postComment) {
                        var postObject = postComment.toJSON();
                        var comments = [];
                        if (postObject.comments.length > 0) {
                          postObject.comments.forEach(function(comment) {
                            comment.created_at_format = moment(comment.created_at).fromNow();
                            comments.push(comment);
                          });
                          postObject.comments = comments;
                        }
                        cb(null, postObject.comments);
                      }
                      else {
                        cb(null, 'No existen comentarios.');
                      }
                    });
                  }
                  else {
                    cb('Error al intentar crear el comentario', null);
                  }
                })
              }
            });
          }
          else {
            cb(null, 'No existe una denuncia con el identificador enviado.');
          }
        });
      }

      Post.remoteMethod('comment', {
        accepts: [
          {
            arg: 'id',
            type: 'string',
            required: true
          },
          {
            arg: 'message',
            type: 'string',
            required: true
          }
        ],
        returns: {
          root: true,
          type: 'object'
        }
      });

      // Report a post
      Post.report = function(id, cb) {
        // set current context
        var ctx = loopback.getCurrentContext();
        // set userId based accessToken
        var userId = ctx.active.http.req.accessToken.userId;
        // find post by id
        Post.findById(id, function(err, post) {
          if (err) {
            cb(null, 'Error al intentar comprobar la existencia de la publicación.');
          }
          else if (post) {
            Report.find({
              where: {
                post_id: id,
                user_id: userId
              }
            }, function(err, report) {
              if (err) {
                cb(null, 'Error al intentar comprobar el reporte.');
              }
              else if (report.length > 0) {
                // report exists
                cb(null, 'Ya has reportado esta publicación.');
              }
              else {
                // create report
                Report.create({
                  post_id: id,
                  user_id: userId,
                  created_at: new Date()
                }, function(err, reportCreated) {
                  if (err) {
                    cb(null, 'Error al intentar crear el reporte.');
                  }
                  else if(reportCreated) {
                    cb(null, 'Tu reporte se ha generado.');
                  }
                });
              }
            });
          }
          else {
            cb(null, 'No existe la publicación.');
          }
        });
      }

      Post.remoteMethod('report', {
        accepts: {
          arg: 'id',
          type: 'string',
          required: true
        },
        returns: {
          root: true,
          type: 'string'
        }
      });
    });

    // Added or remove likes to post
    Post.like = function(id, cb) {
      // set current context
      var ctx = loopback.getCurrentContext();
      // set userId based accessToken
      var userId = ctx.active.http.req.accessToken.userId;
      // find post by id
      Post.findById(id, function(err, post) {
        if (err) {
          cb(null, 0);
        }
        else if (post) {
          var item = userId.toString();
          var position = post.likes.indexOf(item);
          if (position===-1) {
            post.likes.push(item);
            post.save(function(err) {
              cb(null, post.likes.length);
            });
          }
          else {
            post.likes.splice(position, 1);
            post.save(function(err) {
              cb(null, post.likes.length);
            });
          }
        }
        else {
          cb(null, 0);
        }
      });
    }

    // data
    Post.read = function(id, cb) {
      Post.findById(id, {
        include: [
          {
            relation: 'comments',
            scope: {
              include: { // include orders for the owner
                relation: 'user',
                scope: {
                  fields: [
                    'id'
                  ],
                  include: { // include orders for the owner
                    relation: 'identities',
                    scope: {
                      fields: [
                        'profile'
                      ]
                    }
                  }
                }
              }
            }
          },
          {
            relation: 'postType',
            scope: {
              fields: [
                'name'
              ]
            }
          },
          {
            relation: 'user', // include the owner object
            scope: { // further filter the owner object
              fields: [
                'name'
              ], // only show two fields
              include: { // include orders for the owner
                relation: 'identities',
                scope: {
                  fields: [
                    'profile'
                  ]
                }
              }
            }
          }
        ]
      }, function(err, post) {
        if (err) {
          cb(err, null);
        }
        else if (post) {
          var postObject = post.toJSON();
          var comments = [];
          postObject.countLike = numeral(postObject.likes.length).format('0a');
          postObject.countComment = numeral(postObject.comments.length).format('0a');
          postObject.created_at_format = moment(postObject.created_at).fromNow();
          if (postObject.comments.length > 0) {
            postObject.comments.forEach(function(comment) {
              comment.created_at_format = moment(comment.created_at).fromNow();
              comments.push(comment);
            });
            postObject.comments = comments;
          }
          cb(null, postObject);
        }
        else {
          cb(null, []);
        }
      });
    }

    // latest posts
    Post.feed = function(cb) {
      Post.find({
        order: 'created_at DESC',
        limit: 15,
        include: [
          {
            relation: 'comments'
          },
          {
            relation: 'postType',
            scope: {
              fields: [
                'name'
              ]
            }
          },
          {
            relation: 'user', // include the owner object
            scope: { // further filter the owner object
              fields: [
                'name'
              ], // only show two fields
              include: { // include orders for the owner
                relation: 'identities',
                scope: {
                  fields: [
                    'profile'
                  ]
                }
              }
            }
          }
        ]
      }, function(err, posts) {
        if (err) {
          cb(err, null);
        }
        else if (posts) {
          var allPost = [];
          posts.forEach(function(post) {
            var postObject = post.toJSON();
            postObject.countLike = numeral(postObject.likes.length).format('0a');
            postObject.countComment = numeral(postObject.comments.length).format('0a');
            postObject.created_at_format = moment(post.created_at).fromNow();
            allPost.push(postObject);
          })
          cb(null, allPost);
        }
        else {
          cb(null, []);
        }
      });
    }

    Post.remoteMethod('generate', {
      accepts: [
        {
          arg: 'image',
          type: 'string',
          required: true
        },
        {
          arg: 'description',
          type: 'string',
          required: true
        },
        {
          arg: 'lat',
          type: 'string',
          required: true
        },
        {
          arg: 'lng',
          type: 'string',
          required: true
        },
        {
          arg: 'post_type_id',
          type: 'string',
          required: true
        }
      ],
      returns: {
        root: true,
        type: 'number'
      }
    });

    Post.remoteMethod('like', {
      accepts: {
        arg: 'id',
        type: 'string',
        required: true
      },
      returns: {
        root: true,
        type: 'number'
      }
    });

    Post.remoteMethod('read', {
      accepts: {
        arg: 'id',
        type: 'string',
        required: true
      },
      http: {
        verb: 'get'
      },
      returns: {
        root: true,
        type: 'object'
      }
    });

    Post.remoteMethod('feed', {
      http: {
        verb: 'get'
      },
      returns: {
        root: true,
        type: 'object'
      }
    });

  };
