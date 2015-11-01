module.exports = function(PostType) {

  PostType.all = function(id, cb) {
    PostType.find({}, cb);
  }

  PostType.remoteMethod('all', {
    http: {
      verb: 'get'
    },
    returns: {
      root: true,
      type: 'object'
    }
  });

};
