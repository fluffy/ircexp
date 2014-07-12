# ircexp

IRC like Experience but exponentially better with  HTML5 and WebRTC

## Overview

This code is just to show a simple demo of what secure collaborative real time
editing with WebRTC and other buzz words might look like. It works just well
enough to d a specific demo which is to say it is completely broken in a zillion
ways. Don't expect it to actually work.

More explanation and a bit of the design can be found at [Design](Design.md);

## Install Server Locally

Prerequisites:

* make sure you have RabbitMQ running  (See
  http://www.rabbitmq.com/install-standalone-mac.html)

* have mongo running

* have redis running

* have node, npm

### Install with:

clone the repo, go into client directory and do

* npm install

* bower install

Go into the serv directory and do

* npn install

* copy secret.json.tmpl to secret.json and edit it to configure you URLs and
  such. You will need to create an app on linkedIn and set the URLs used on the
  linkedIn page as well as configure info into this file. Also needs to set URLs
  for redis, rabbitMQ, and mongo. 
  
* grunt

### Setting up LinkedIn OAuth

Login at https://developer.linkedin.com/.

Create an application.

Set the default scope to emailaddress and basicprofile

Set the OAuth 2.0 Redirect URLs: to something like
"http://localhost:8080/auth/linkedin/callback,
http://example.com/auth/linkedin/callback"
Where example.com is replaced with name of your server.

Copy API Key and Secret Key to your secret.json file

### Running

Set the NODE_ENV variable to dev, test, or prod

From within the serv directory, run it with:
* node serv.js --dev 

Open browser at appropriate page

Enjoy! 




