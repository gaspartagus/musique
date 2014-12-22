var fs        = require('fs')
  , path      = require('path')
  , XmlStream = require('xml-stream')
  , util = require('util')
  , jquery = require('jquery')
  , request = require('request')
  , XMLSplitter = require('xml-splitter')
  , eyes = require('eyes')//.inspector({styles:{},maxLength:2048})
  , xml2js = require('xml2js')
  , mongoose = require('mongoose')
  , statistics = require('simple-statistics')
  , sylvester = require('sylvester')
  , Matrix = sylvester.Matrix
  , Vector = sylvester.Vector
  ;

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

var localConn = mongoose.createConnection('mongodb://localhost/test');
var localArtist = localConn.model('artists', { name: String, rating: Number});

var conn = mongoose.createConnection('mongodb://BIDSI:mong0pwd4BI@logsr7.canallabs.fr:27018/R7');
var Cat = conn.model('artist', { name: String });

var stream = Cat.find(
{
  images:{$exists: true},
  name:{$exists: true},
  profile:{$exists: true}
},
{
  name: 1,
  images: 1,
  urls: 1
}).stream();

var count = 0;
var coords = {images: [], urls: [], name: [], profile: [],
  mean: { images: 1.6680494, urls: 13.638543, name: 12.6025604, profile: 252.466115 },
  variance: { images: 1.7325110, urls: 18.511286, name: 4.197666, profile: 506.836591 },
  coord: ['images', 'urls', 'name', 'profile'],
  coef: { images: 1, urls: 1, name: 1, profile: 0.8 }
};

var check = function(obj,prop1,prop2){ // fonction qui traite les cas ou il y a une ou zero url/image
  if(obj.hasOwnProperty(prop1)){

    if(obj[prop1][prop2].constructor == Object )
    return 1;
    else return obj[prop1][prop2].length;
  }
  else return 0;
}


stream.on('data', function (doc) {
  obj = doc._doc;
  count += 1;
  console.log(count);

  var grade = 0;
  var arr = { images: check(obj, 'images', 'image'), urls: check(obj, 'urls', 'url'), name: obj.name.length };
  //console.log(arr);
  for(c in arr)
  {
    //console.log(coords.mean[c]);
    grade = grade + coords.coef[c]*(arr[c] - coords.mean[c] ) / coords.variance[c];
  }
  //console.log(grade);
  var artist = new localArtist({name: obj.name, rating: grade });

  artist.save(function (err) {
    if (err)
      console.log(err);
  });
});

stream.on('error', function (err) {
  // handle err
})

stream.on('close', function () {

})
