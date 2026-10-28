export function sendSuccess(res, status=200, msg="product", data=null) {
  return res.status(status).json({ success: true, msg, data });
}

export function sendFailure(res, status=500, msg) {
  return res.status(status).json({ success: false, msg, data: null });
}
