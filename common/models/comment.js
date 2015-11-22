var loopback = require('loopback');
var moment = require('moment');
require('twix');
moment.locale('es');

var limitSeconds = 10;

module.exports = function(Comment) {
  // disableRemoteMethod
  Comment.disableRemoteMethod('__get__user', false);

  Comment.getApp(function(err, app) {
    var Post = app.models.Post;

    // remoteMethod add
    Comment.add = function(id, message, cb) {
      // set current context
      var ctx = loopback.getCurrentContext();
      // set userId based accessToken
      var userId = ctx.active.http.req.accessToken.userId;

      Post.findById(id, function(err, post) {
        if (err) {
          cb(err, null);
        }
        else if(post) {
          // set filter query
          var filter = {
            'order': 'created_at DESC',
            'where': {
              'post_id': id,
              'user_id': userId,
              'created_at': {
                gt: moment().subtract(limitSeconds, 'seconds')
              }
            }
          };

          // find
          Comment.find(filter, function(err, commentExists) {
            if (err) {
              cb(err, null);
            }
            else if(commentExists.length > 0) {
              // create seconds based created_at and now
              var seconds = Math.abs(moment(commentExists[0].created_at).twix(new Date()).count('seconds') - limitSeconds);
              var error = new Error('Debe esperar ' + seconds + ' segundos antes de agregar otro comentario.');
              error.status = 401;
              cb(error, null);
            }
            else {
              // create
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
                  // set filter query
                  var filterComment = {
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
                  };

                  // findById
                  Comment.findById(comment.id, filterComment, function(err, commentCreated) {
                    commentCreated.created_at_format = moment(commentCreated.created_at).fromNow();
                    cb(null, commentCreated);
                  });
                }
                else {
                  var error = new Error('Error al intentar crear el comentario.');
                  error.status = 409;
                  cb(error, null);
                }
              });
            }
          });
        }
        else {
          var error = new Error('No existe la denuncia a la que desea agregar el comentario.');
          error.status = 409;
          cb(error, null);
        }
      });
    }

    Comment.remoteMethod('add', {
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
  });
};
