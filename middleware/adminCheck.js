const adminCheck = async (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).send('Access Denied: Admins only');
    }
    next();
  };

  module.exports = adminCheck;