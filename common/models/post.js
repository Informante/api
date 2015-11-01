module.exports = function(Post) {

  Post.feed = function(cb) {
    Post.find({
      limit: 15,
      include: 'postType'
    }, cb);
  }

  Post.remoteMethod('feed',
    {
      returns: {
        http: {
          verb: 'get'
        },
        root: true,
        type: 'object'
      }
    }
  );

};
