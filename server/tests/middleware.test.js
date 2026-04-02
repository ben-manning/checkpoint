const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/verifyToken');
const errorHandler = require('../middleware/errorHandler');

const makeReqRes = ({ authHeader } = {}) => {
  const req = { headers: {} };
  if (authHeader !== undefined) {
    req.headers['authorization'] = authHeader;
  }

  const res = {
    _status: null,
    _body: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
  };

  return { req, res };
};

describe('verifyToken middleware', () => {
  const SECRET = 'test-secret';

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  it('calls next() and attaches decoded payload when token is valid', () => {
    const { req, res } = makeReqRes({
      authHeader: `Bearer ${jwt.sign({ userId: 42 }, SECRET, { expiresIn: '1h' })}`,
    });
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ userId: 42 });
  });

  it('returns 401 when Authorization header is absent', () => {
    const { req, res } = makeReqRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body).toHaveProperty('message', 'No token provided');
  });

  it('returns 401 when scheme is not Bearer', () => {
    const { req, res } = makeReqRes({
      authHeader: `Token ${jwt.sign({ userId: 1 }, SECRET, { expiresIn: '1h' })}`,
    });
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body).toHaveProperty('message', 'No token provided');
  });

  it('returns 401 for an expired token', () => {
    const expiredToken = jwt.sign(
      { userId: 1, exp: Math.floor(Date.now() / 1000) - 10 },
      SECRET
    );
    const { req, res } = makeReqRes({ authHeader: `Bearer ${expiredToken}` });
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body).toHaveProperty('message', 'Invalid or expired token');
  });

  it('returns 401 for a token signed with a wrong secret', () => {
    const badToken = jwt.sign({ userId: 1 }, 'wrong-secret', { expiresIn: '1h' });
    const { req, res } = makeReqRes({ authHeader: `Bearer ${badToken}` });
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body).toHaveProperty('message', 'Invalid or expired token');
  });

  it('returns 401 for a malformed token string', () => {
    const { req, res } = makeReqRes({ authHeader: 'Bearer this.is.garbage' });
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body).toHaveProperty('message', 'Invalid or expired token');
  });
});

describe('errorHandler middleware', () => {
  it('responds with 500 and a generic message for any error', () => {
    const { req, res } = makeReqRes();
    const next = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(new Error('Something broke'), req, res, next);

    expect(res._status).toBe(500);
    expect(res._body).toHaveProperty('message', 'Internal server error');

    consoleSpy.mockRestore();
  });

  it('logs the error to console.error', () => {
    const { req, res } = makeReqRes();
    const next = jest.fn();
    const err = new Error('DB timeout');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(err, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith(err);
    consoleSpy.mockRestore();
  });
});
