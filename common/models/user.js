var facebook = require('sd-expires');

module.exports = function(user) {

  user.disableRemoteMethod('find', true);
  user.disableRemoteMethod('upsert', true);
  user.disableRemoteMethod('create', true);
  //user.disableRemoteMethod('findById', true);
  user.disableRemoteMethod('exists', true);
  user.disableRemoteMethod('deleteById', true);
  user.disableRemoteMethod('updateAll', true);
  user.disableRemoteMethod('findOne', true);
  user.disableRemoteMethod('count', true);
  user.disableRemoteMethod('createChangeStream', true);
  user.disableRemoteMethod('updateAttributes', false);

  user.disableRemoteMethod('login', true);
  user.disableRemoteMethod('logout', true);
  user.disableRemoteMethod('resetPassword', true);
  user.disableRemoteMethod('confirm', true);
  user.disableRemoteMethod('__delete__accessTokens', false);
  user.disableRemoteMethod('__create__accessTokens', false);
  user.disableRemoteMethod('__get__accessTokens', false);
  user.disableRemoteMethod('__findById__accessTokens', false);
  user.disableRemoteMethod('__updateById__accessTokens', false);
  user.disableRemoteMethod('__destroyById__accessTokens', false);
  user.disableRemoteMethod('__count__accessTokens', false);

  user.disableRemoteMethod('__delete__identities', false);
  user.disableRemoteMethod('__create__identities', false);
  user.disableRemoteMethod('__get__identities', false);
  user.disableRemoteMethod('__findById__identities', false);
  user.disableRemoteMethod('__updateById__identities', false);
  user.disableRemoteMethod('__destroyById__identities', false);
  user.disableRemoteMethod('__count__identities', false);

  user.disableRemoteMethod('__delete__credentials', false);
  user.disableRemoteMethod('__create__credentials', false);
  user.disableRemoteMethod('__get__credentials', false);
  user.disableRemoteMethod('__findById__credentials', false);
  user.disableRemoteMethod('__updateById__credentials', false);
  user.disableRemoteMethod('__destroyById__credentials', false);
  user.disableRemoteMethod('__count__credentials', false);

  user.getApp(function(error, app) {
    var userIdentity = app.models.userIdentity;

    // metod search
    user.expires_in = function(userId, cb) {
      // get userIdentity based userId
      userIdentity.findOne({
        where: {
          userId: userId
        }
      }, function(err, data) {
        if (err) {
          cb(err, null);
        }
        else if(data) {
          // get accessToken info based facebook accessToken
          facebook.expires({
            access_token: data.credentials.accessToken
          }, function(accessToken) {
            if (accessToken.expires_in > 0) {
              cb(null, {
                active: true
              });
            }
            else {
              cb(null, {
                active: false
              });
            }

          });
        }
        else {
          var error = new Error('El usuario no existe');
          cb(error, null);
        }
      });
    }

    // definde remote method
    user.remoteMethod(
      'expires_in',
      {
        accepts: {
          arg: 'userId',
          type: 'string'
        },
        returns: {
          root: true,
          type: 'object'
        }
      }
    );
  });
};
