// --------------------------------------------
// API
// --------------------------------------------
// API routes for external servers.

// Modules
const express = require("express"),
      api = express.Router(),
      crypto = require("crypto");


// --------------------------------------------
// Middleware
// --------------------------------------------

const apiMiddleware = function(req, res, next) {
  
  // If req.body_data exists, scan through it and check
  // for keys that are required.
  if (res.body_data) {
  console.log(res.body_data)
    // Loop over body_data.
    Object.keys(req.body_data).forEach(key => {
        var key_init = res.body_data[key]

        if (key_init["required"] && typeof key_init["data"] === "undefined") {
          return res.status(400).json({
            message: `${key} is required and it's missing.`
        });
      }
    })
  }
  
  
}
// do u understand it
// yes but i gotta pee bitch go
// im back
api.use(express.json())



// --------------------------------------------
// CONTENT-AUTHORIZATION
// --------------------------------------------
// Generate content-authorization cookies for given :mapName
api.post("/v1/content-authorization", (req, res) => {

  res.body_data = {
    mapName: {
      data: req.body.mapName,
      required: true
    }
  }
  
  
  // https://jd-s3.akamaized.net/private/map/Monster/Monster_ULTRA.hd.webm/9003377118af6650cc8aac8d98f6b00b.webm
    // ?auth=
  // exp=16184919253600~acl=/private/map/Monster/*~hmac=b4317cf4a337fe65656cb378a08a56b7c72ac4786eee8c09ad35865deccf2721
  // expiration ------- amazon control list ------- hmac
  // okay but the .update part, do we keep the mapName in it?
  // all hmacs for a mapName would be the same then
  // why not?
  // u mean that all links in a content-authorization have the same cookie?
  // wait they do fr so i mean like if u create a content auth for 365 and i create one, our hmacs wouldnt be same
  // correct, they're only shared for the same folder
  // because that's why acl is Monster/*, for example  
// so what do we keep in update
  // the fuck is update // it creates a hmac with the secret key and then updates it with anything you wanna hide in it
  // and then you can decrypt it back with your key, its like base64
  // wait lemme remove update and see if it changes on every request
  // it doesnt
  // so we have to keep sumn in the3re ig
  // wait maybe a random number
  // i never seen sumn like that in jdu ubt sure
  const hmac_key = process.env.hmac_key
  
  // Calling createHmac method
  const hmac = crypto.createHmac('sha256', hmac_key)
    .update("") // Data to keep in the HMAC
    .digest('hex'); // Encoding to be used
// how will the url format be?
// domain.com/private/map/Example/Example.webm?auth=exp=16184919253600~acl=/private/map/Example/*~hmac=b4317cf4a337fe65656cb378a08a56b7c72ac4786eee8c09ad35865deccf2721
  // so is this the format
  // sure ig, more original
  // realistic is the word
  // so wait lemme make a fake concent-auth route in here so we dont have to test it in jdcs and here at the same time
  // sure
  res.send(hash)
  
  
  
  
})




module.exports = api