var loopback = require('loopback');

module.exports = function(Report) {

  Report.getApp(function(err, app) {
    // Report a post
    Report.add = function(id, cb) {
      var Post = app.models.Post;

      // set current context
      var ctx = loopback.getCurrentContext();
      // set userId based accessToken
      var userId = ctx.active.http.req.accessToken.userId;
      // find post by id
      Post.findById(id, function(err, post) {
        if (err) {
          var error = new Error('Error al intentar comprobar la existencia de la publicación.');
          error.status = 409;
          cb(error, null);
        }
        else if (post) {
          Report.find({
            where: {
              post_id: id,
              user_id: userId
            }
          }, function(err, report) {
            if (err) {
              var error = new Error('Error al intentar comprobar el reporte.');
              error.status = 409;
              cb(error, null);
            }
            else if (report.length > 0) {
              // report exists
              var customError = new Error('Ya has reportado esta publicación.');
              customError.status = 409;
              cb(customError, null);
            }
            else {
              // create report
              Report.create({
                post_id: id,
                user_id: userId,
                created_at: new Date()
              }, function(err, reportCreated) {
                if (err) {
                  var error = new Error('Error al intentar crear el reporte.');
                  error.status = 409;
                  cb(error, null);
                }
                else if(reportCreated) {
                  cb(null, {
                    message: 'Tu reporte se ha generado.'
                  });
                }
              });
            }
          });
        }
        else {
          var customError = new Error('No existe la publicación.');
          customError.status = 409;
          cb(customError, null);
        }
      });
    };

    Report.remoteMethod('add', {
      accepts: {
        arg: 'id',
        type: 'string',
        required: true
      },
      returns: {
        root: true,
        type: 'object'
      }
    });
  });
};
