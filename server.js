// JDCS-CDN
// CDN for JDCS. This file was created on 24.06.2021.


// Modules
  const express = require('express'),
    app = express(),
    expressip = require('express-ip'),
    chalk = require("chalk"),
    crypto = require("crypto"),
    fs = require("fs");


// -- Functions

/**
 * Create a message for error, information or success responses
 * depending on the status code.
 * @param {Number} statuscode - Status code of the response.
 * @param {String} route - Route of the request.
 */
const createResponseMessage = function(statuscode, route) {
  
  function base(msg) {
    return `<html>
        <body>
        <h2>${jdcs.server.url}</h2>     
            <a>${msg}</a>
        <hr>jdbest-cdn - version: ${jdcs.server.version}
        </body>
    </html>`
  }
  
  switch (statuscode) {
    // 404 - not found
    case 404:
      return base(`${route} was not found.`)
    // 403 - forbidden
    case 403: 
      return base(`You are now allowed to access ${route}`)
    // 401 - unauthorized
    case 401:
      return base(`You are not authorized to access ${route}`)
    // 400 - bad request
    case 400:
      return base(`Client-side made a bad request.`)
    // 500 - internal server error
    case 500:
      return base(`An error occurred server-side.`)
    // 405 - method not allowed
    case 405:
      return base(`Request method is not allowed.`)
  }
}

// --


// --------------------------------------------
// JDCS
// --------------------------------------------
// An object for storing server configuration.
const jdcs = {
  server: {
    url: "jdcs-cdn.glitch.me",
    port: process.env.PORT,
    version: "1.0.0"
  },
  static: {
    folder: "/static"
  },
  urls: {
    jdcs: "jdcs-prod.justdancebest.tk"
  },
  authentication: {
    content_auth_expiration: 3600, // 1 hour.
    check_user_agent: false
  },
  hmac: {}
}

exports = {jdcs}



// --------------------------------------------
// Middleware
// --------------------------------------------
app.use((req,res,next) => {
  
  // If check_user_agent is enabled, check for user-agent and pass client.
  if (jdcs["authentication"]["check_user_agent"]) {
    
    var useragent = req.header("user-agent").toLowerCase()
    
    switch (useragent.includes("ubiservices_")) {
      case true:
        next();
        break;
      case false:
        return res.status(401).send(createResponseMessage(401, req.originalUrl));
    }
  }
  else {
    next()
  }
})
app.use(expressip().getIpInfoMiddleware);



app.get("/content-authorization/v1/maps/:mapName", (req, res) => {
  
  let urls = {};
  let mapName = req.params.mapName
  
  // An object of all available files for content-authorization.
  // We use normal webms for HD webms.
  const available_files = {
    [`${mapName}_ULTRA.webm`]: `${mapName}_HIGH.webm`,
    [`${mapName}_HIGH.webm`]: `${mapName}_HIGH.webm`,
    [`${mapName}_MID.webm`]: `${mapName}_MID.webm`,
    [`${mapName}_LOW.webm`]: `${mapName}_LOW.webm`,
    [`${mapName}_ULTRA.hd.webm`]: `${mapName}_HIGH.webm`,
    [`${mapName}_HIGH.hd.webm`]: `${mapName}_HIGH.webm`,
    [`${mapName}_MID.hd.webm`]: `${mapName}_MID.webm`,
    [`${mapName}_LOW.hd.webm`]: `${mapName}_LOW.webm`,
    [`${mapName}.ogg`]: `${mapName}.ogg`
  }
  
  
  // --------------------------------------------
  // Cookie creation
  // --------------------------------------------
  // Create exp, acl and HMAC for auth query.

  // Expiration
    const exp = `exp=${Math.floor(new Date().getTime() / 1000) + jdcs.authentication["content_auth_expiration"]}` // 1 hour.
  // ACL
    const acl = `acl=/private/map/${mapName}/*`

  // HMAC
    const hmac_key = process.env.hmac_key
    const hmac = crypto.createHmac('sha256', hmac_key)
      // Our HMAC is ${exp}~${acl}
      .update(`${exp}~${acl}`)
      .digest('hex');
  
  // --------------------------------------------
  
  
  // Loop over the list of all available files 
  // and create a key for them in urls object.
  Object.keys(available_files).forEach(file => {
    let url_obj = {
      protocol: "https://",
      server_url: jdcs.server.url,
      file_folder: `/private/map/${mapName}/`,
      file: available_files[file],
      auth: `?auth=${exp}~${acl}~hmac=${hmac}`
    }
    
    // Create a key and combine key values of url_obj
    let jmcs_path = `jmcs://jd-contents/${mapName}/${file}`
    urls[jmcs_path] = Object.values(url_obj).reduce((accumulator, currentValue) => accumulator + currentValue)
  })
  
  
  // Send the final ContentAuthorizationEntry response.
  res.send({
      __class: "ContentAuthorizationEntry",
      duration: 300,
      changelist: 509807,
      urls: urls
  })
})

// -- Routes

// --------------------------------------------
// API
// --------------------------------------------
// API routes for external servers.
app.use("/api/", require("./scripts/routes/api"))


// --------------------------------------------
// PRIVATE
// --------------------------------------------
// Private folder that should be only access-able
// with cookies or sessions.
app.route("/private/*")

  .get(function (req, res, next) {

    // If the auth query exists, check for the credentials.
    if (req.query.auth) {
      
      let auth = req.query.auth
      
      // Parse auth query and get required data.
      let auth_data = {
        exp: auth.split("~")[0] || "",
        acl: auth.split("~")[1] || "",
        hmac: auth.split("~")[2] || ""
      }
      
      // We now create a HMAC with exp and acl and see
      // if client's HMAC equals ours and the expiration
      // hasnt passed an hour, we pass the client.
      
      const hmac_key = process.env.hmac_key
      const hmac = crypto.createHmac('sha256', hmac_key)
        // Our HMAC is ${exp}~${acl}
        .update(`${auth_data.exp}~${auth_data.acl}`)
        .digest('hex');
 
      if (
        auth_data["hmac"].split("=")[1] === hmac // If auth query's HMAC equals our HMAC...
        // If auth exp - current epoch is bigger than 3600...
      && auth_data["exp"].split("=")[1] - Math.floor(new Date().getTime() / 1000) < jdcs.authentication["content_auth_expiration"]
      
      ) {
        res.send("hello there welcome")
      }
      
      
      // Client did not pass the check, return 401.
      else {
        return res.status(401).send(createResponseMessage(401, req.originalUrl));
      }
    
    }
  
    // Client requested data without auth.
    else {
      return res.status(404).send(createResponseMessage(404, req.originalUrl));
    }
  })

  // Rest of the HTTP methods we don't have will return 405 - method not allowed.
  .all(function (req, res, next) {
    return res.status(405).send(createResponseMessage(405, req.originalUrl)); 
  })



// --------------------------------------------
// PUBLIC
// --------------------------------------------
// Public folder that anyone can access.
// Make the static folder public.
app.use(express.static("static"))


// --


const listener = app.listen(jdcs.server.port, function() {
  console.log(
    chalk.blue(`---------- JDCS CDN ----------\n`),
    `${chalk.blue("Version")}: ${jdcs.server.version} ${chalk.blue("Port")}: ${jdcs.server.port}\n`,
    `Server was started successfully.\n`
    );
});