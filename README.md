Spring Web Lobby
===========

Cross-platform lobby client for the SpringRTS multiplayer server.

**Linux  / Windows (Vista or later)**

Download it to your computer:
https://googledrive.com/host/0Bys6k7VMCRfUZ0N5MGJXR1pRV2M/

**Windows XP / Mac**

_(Deprecated)_ Use your browser (Requires Java):
http://weblobby.springrts.com/


![alt tag](http://i.imgur.com/10E8cUA.png)

![alt tag](http://i.imgur.com/eRuZwc8.png)


Development
===========

You need NodeJS to build the project.

* Install browserify: <code>npm install -g browserify</code>
* Install dependencies: <code>npm install</code> in the project directory.
* <code>browserify -t reactify weblobby.jsx -o weblobby.bundle.js</code> to
  build. If you replace browserify with watchify it will continuously watch the
  files for changes and rebuild.
