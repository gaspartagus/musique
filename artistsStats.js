var fs        = require('fs')
  , path      = require('path')
  , XmlStream = require('xml-stream')
  , util = require('util')
  , jquery = require('jquery')
  , request = require('request')
  , XMLSplitter = require('xml-splitter')
  , eyes = require('eyes')
  , xml2js = require('xml2js')
  , express = require('express')
  , connect = require('connect')
  , serveStatic = require('serve-static')
  , XRegExp = require('xregexp').XRegExp
  , bodyParser = require('body-parser')
  , Entities = require('html-entities').AllHtmlEntities
  , entities = new Entities()
  , models = require('./models')
  , statistics = require('simple-statistics')
  , sylvester = require('sylvester')
  , Matrix = sylvester.Matrix  
  , Vector = sylvester.Vector
  ;

var mongoose = require('mongoose');
mongoose.connect('mongodb://BIDSI:mong0pwd4BI@logsr7.canallabs.fr:27018/R7');
var Cat = mongoose.model('artist', { name: String });

var stream = Cat.find(
{
  images:{$exists: true},
  name:{$exists: true},
  profile:{$exists: true}
},
{
  name: 1,
  images: 1,
  urls: 1,
  profile: 1
}).stream();

var count = 0;
var coords = {images: [], urls: [], name: [], profile: [],
  mean: {},
  variance: {},
  coord: ['images', 'urls', 'name', 'profile'],
  coef: { images: 1, urls: 1, name: 1, profile: 1 }
};

var check = function(obj,prop1,prop2){ // fonction qui traite les cas ou il y a une ou zero url/image
  if(obj.hasOwnProperty(prop1)){

    if(obj[prop1][prop2].constructor == Object )
    return 1;
    else return obj[prop1][prop2].length;
  }
  else return 0;
}
var isString = function(obj){
  if(obj.constructor == String)
    return obj.length;
  else{
    return 0;
  }
}

stream.on('data', function (doc) {
  obj = doc._doc;
  
  coords.images.push( check(obj, 'images', 'image') );
  coords.urls.push( check(obj, 'urls', 'url') );
  coords.name.push( obj.name.length );
  coords.profile.push( isString(obj.profile) );

  count += 1;

  if (count >= 182000){ // au bout de .. coordonnes, on les traite
    this.pause();
    for(c in coords.coef) // on centre puis norme le nuage de points
    {
      coords.mean[c] = statistics.mean(coords[c]);
      coords.variance[c] = Math.sqrt(statistics.variance(coords[c]));

      coords[c] = coords[c]
      .map(function(num){
        res = ( num - coords.mean[c] ) / coords.variance[c] ;
        return res;
      });
      // les coordonnées sont maintenant centrées normées

    }
    // var x = Matrix.create( [ coords.images, coords.urls, coords.name ] );
    // var pca = x.pcaProject(1);
    eyes.inspect(coords.mean);
    eyes.inspect(coords.variance);
  }
});

stream.on('error', function (err) {
  // handle err
})

stream.on('close', function () {
  // all done
})
