class Errors{
  static URI_UNDEF = "uri not defined"
}

function getRandomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

function sendError(req, res, message){
  res.json({success: false, error: message})
}

function sendSuccess(req, res, hash, message){
  return res.json({success: true, error: false, message: message})
}

function sendPayload(req, res, payload){
  return res.json({success: true, error: false, payload: payload})
}

module.exports = {
  Errors,
  getRandomString,
  sendError,
  sendPayload,
  sendSuccess
}
