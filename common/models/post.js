module.exports = function(Post) {

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

  Post.remoteMethod('feed',
  {
    http: {
      verb: 'get'
    },
    returns: {
      root: true,
      type: 'object'
    }
  }
);

};
