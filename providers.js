module.exports = {
  'facebook-login': {
    provider: 'facebook',
    module: 'passport-facebook',
    clientID: process.env.INFORMANTE_FB_ID,
    clientSecret: process.env.INFORMANTE_FB_SECRET,
    callbackURL: '/auth/facebook/callback',
    authPath: '/auth/facebook',
    callbackPath: '/auth/facebook/callback',
    successRedirect: '/auth/account',
    failureRedirect: '/login',
    scope: [
      'email'
    ],
    failureFlash: true
  }
}
