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
        root: true,
        type: 'object'
      }
    }
  );

};
