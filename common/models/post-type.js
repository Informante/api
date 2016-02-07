module.exports = function(PostType) {

  PostType.allData = function(cb) {
    PostType.find({
      order: ['name ASC']
    }, cb);
  };

  PostType.remoteMethod('allData', {
    http: {
      path: '/all',
      verb: 'get'
    },
    returns: {
      root: true,
      type: 'object'
    }
  });

};
