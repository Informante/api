var loopback = require('loopback');
var moment = require('moment');
var numeral = require('numeral');
moment.locale('es');

module.exports = function(Post) {

  Post.disableRemoteMethod('__get__postType', false);
  Post.disableRemoteMethod('__get__user', false);

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
              console.log(commentExists);
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
                    cb(null, comment);
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
        post.countLike = numeral(post.likes.length).format('0a');
        //post.countComment = numeral(post.comments.length).format('0a');
        post.created_at_format = moment(post.created_at).fromNow();
        cb(null, post);
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
          post.created_at_format = moment(post.created_at).fromNow();
          allPost.push(post);
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
