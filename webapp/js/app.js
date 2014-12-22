// js/app.js

var app = app || { models: {}, collections: {}, views: {} };
var G = 700000,
    dt = 1,
    centre = {x: 350, y: 650},
    dt = 0.05,
    G = 70000;

document.addEventListener( "DOMContentLoaded", function () {
    // centre.x = parseInt($('#center').css('height'))/2.1;
    // centre.y = parseInt($('#center').css('width'))/2.2;

    // Send ready event 
    R7.ready(function() {
        // Mappage des touches de la télécommande avec la librairie Mickey.js
        R7.grabKey('Left', function() {
        app.mainView.mouse.move('left');
        });
        R7.grabKey('Right', function() {
        app.mainView.mouse.move('right');
        });
        R7.grabKey('Down', function() {
        app.mainView.mouse.move('down');
        });
        R7.grabKey('Up', function() {
        app.mainView.mouse.move('up');
        });
        R7.grabKey('Enter', function() {
        app.mainView.mouse.click();
        });
        R7.grabKey('Back', function() {
        app.router.backTo();
        });
        R7.grabKey('Exit', function() {
        R7('navigate', { control: 'player' });
        });
    });

}, false );

(function($) {
  console.log('app.js');
  app.rootUrl = 'http://10.0.1.44:8080/';
  // app.rootUrl = 'http://3d5964dc.ngrok.com/';

  // Initialisation des variables de navigation pour l'app
  app.focusHistory = [];
  app.fromHistory = 0;
  app.tmpPos = null;

  // Mise en route de l'app
  app.router = new app.Router();
  app.mainView = new app.views.MainView({ el: this.$('#center') });
  Backbone.history.start();

})(jQuery);
