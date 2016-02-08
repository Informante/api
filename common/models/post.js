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

  Post.getApp(function(err, app) {
    var Ad = app.models.Ad;

    // latest posts
    Post.feed = function(skip, cb) {
      skip = skip || 0;

      Post.find({
        order: 'created_at DESC',
        limit: 15,
        skip: skip,
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
          });

          // added adsense item
          Ad.mediumRectangle(function(err, data) {
            allPost.splice(1, 0, data);
            cb(null, allPost);
          });

        }
        else {
          cb(null, []);
        }
      });
    };


    /**
    * Instance remote method feed
    */
    Post.remoteMethod('feed', {
      accepts: {
        arg: 'skip',
        type: 'number',
        required: false,
        http: {
          source: 'query'
        }
      },
      http: {
        verb: 'get'
      },
      returns: {
        root: true,
        type: 'object'
      }
    });
  });

  Post.generate = function(image, description, lat, lng, post_type_id, is_anonymous, cb) {
    // set current context
    var ctx = loopback.getCurrentContext();

    // get ip address based http request
    var ip = ctx.active.http.req.connection.remoteAddress;

    // convert string is_anonymous to boolean
    var isAnonymous = JSON.parse(is_anonymous);
    var enabled = (isAnonymous) ? false : true;

    var userId = '';
    var limitTime = 10;
    var limitRows = 1;
    var limitType = 'seconds';

    if (isAnonymous) {
      // User based anonymous user
      // https://www.facebook.com/profile.php?id=100010809870782
      userId = process.env.ANONYMOUS_USER;
    }
    else {
      // set userId based accessToken
      userId = ctx.active.http.req.accessToken.userId;
    }

    Post.find({
      'where': {
        'user_id': userId,
        'created_at': {
          gt: moment().subtract(limitTime, limitType)
        },
        'ip': ip
      }
    }, function(err, postExists) {
      if (err) {
        cb(err, null);
      }
      else if(postExists.length >= limitRows) {
        // create seconds based created_at and now
        var seconds = Math.abs(moment(postExists[0].created_at).twix(new Date()).count('seconds') - limitTime);
        var error = new Error('Debe esperar ' + seconds + ' segundos antes de agregar otro comentario.');
        error.status = 401;
        cb(error, null);
      }
      else {
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
          'ip': ip,
          'enabled': enabled,
          'created_at': new Date()
        }, cb);
      }
    });
  };

  // Added or remove likes to post
  Post.like = function(id, cb) {
    // set current context
    var ctx = loopback.getCurrentContext();
    // set userId based accessToken
    var userId = ctx.active.http.req.accessToken.userId;
    // find post by id
    Post.findById(id, function(err, post) {
      if (err) {
        cb(null, err);
      }
      else if (post) {
        var item = userId.toString();
        var position = post.likes.indexOf(item);
        if (position===-1) {
          post.likes.push(item);
          post.save(function(err) {
            cb(null, {
              message: post.likes.length
            });
          });
        }
        else {
          post.likes.splice(position, 1);
          post.save(function(err) {
            cb(null, {
              message: post.likes.length
            });
          });
        }
      }
      else {
        var error = new Error('Error al intentar comprobar la existencia de la publicación.');
        error.status = 409;
        cb(error, null);
      }
    });
  };

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
  };



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
      },
      {
        arg: 'is_anonymous',
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

};
