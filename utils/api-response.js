export function sendSuccess(res, status, msg, data) {
  return res.status(status).json({ success: true, msg, data });
}

export function sendFailure(res, status, msg) {
  return res.status(status).json({ success: false, msg, data: null });
}
