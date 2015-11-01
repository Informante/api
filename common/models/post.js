var loopback = require('loopback');

module.exports = function(Post) {

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

  // latest posts
  Post.feed = function(cb) {
    Post.find({
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
    }, cb);
  }

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
