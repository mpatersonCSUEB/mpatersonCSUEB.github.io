// server/middleware/auth.js
// requireAuth: 401s the request if the user is not logged in.

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

module.exports = requireAuth;
