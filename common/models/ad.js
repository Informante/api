module.exports = function(Ad) {
  Ad.banner = function(cb) {
    Ad.findOne({
      where: {
        type: 'BANNER'
      }
    }, cb);
  };

  Ad.remoteMethod('banner', {
    http: {
      verb: 'get'
    },
    returns: {
      root: true,
      type: 'object'
    }
  });

  Ad.mediumRectangle = function(cb) {
    Ad.findOne({
      where: {
        type: 'MEDIUM_RECTANGLE'
      }
    }, cb);
  };

  Ad.remoteMethod('mediumRectangle', {
    isStatic: true,
    http: {
      verb: 'get'
    },
    returns: {
      root: true,
      type: 'object'
    }
  });
};
