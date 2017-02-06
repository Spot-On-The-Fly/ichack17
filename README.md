# ichack17
First version of Spot-on-the-Fly hacked together in ichack17!

# how to run
you need a few things to run this:
* node.js 
* npm
* the spotify userid of a person connecting to the system who can make the playlist. (\<HOST_ID>)
* the spotify playlist id of the playlist you want to output to.(\<PLAYLIST_ID>)
* spotify developer client id (\<CLIENT_ID>)
* spotify developer client secret (\<CLIENT_SECRET>)
* redirect url for spotify (\<REDIRECT_URI>)

once you have these things then you can go into `app.js` and then you will see where these things need updating
NOTE - you'll also need the spotify playlist name but if you've got the id then you have probably also got the name!

after changing the settings in `app.js` then run the command `sudo npm install` and then run 'sudo npm start'

it should now be running... find the playlist and enjoy!
