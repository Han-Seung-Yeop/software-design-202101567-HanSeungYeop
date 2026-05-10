const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      // OAuth 응답을 표준화해서 callback 컨트롤러로 전달
      const oauthProfile = {
        provider: 'google',
        provider_id: profile.id,
        email: profile.emails?.[0]?.value?.toLowerCase(),
        email_verified: profile.emails?.[0]?.verified !== false,
        name: profile.displayName || profile.name?.givenName || '사용자',
      };
      return done(null, oauthProfile);
    }
  )
);

// 세션을 사용하지 않으므로 serialize/deserialize는 단순히 통과만
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

module.exports = passport;
