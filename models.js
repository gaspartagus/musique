var mongoose = require('mongoose')
		Promise = require("bluebird");

Promise.prototype.log = function(ns){
	return this.then(function(obj){
		console.log((ns || "") + " next: ", obj);
		return obj;
	});
};

var localConn = mongoose.createConnection('mongodb://localhost/test'); // connection à la base mongo locale
var artistSchema = mongoose.Schema({
	name: String,
  dicName: String,
	image: Array,
	stats: Object,
	tags: Array,
	bio: Object,
	rating: Number,
	progs: Array,
	starred: Number
});
var relProgSchema = mongoose.Schema({
	progId: Number,
	artistes: Array,
	tags: Array,
	categories: Array,
	concert: Number,
	startDate: Number,
	endDate: Number,
	titleLbl: String,
	chaine: String,
	nb : Number,
  titleLbl: String,
  subtitleLbl: String,
  shortSummary: String,
  summary: String,
  name: String,
});

var ratedArtistModel = localConn.model('artists', artistSchema, 'artists');
var lastfmArtistModel = localConn.model('lastfmartists', artistSchema, 'lastfmartists');
var relProgModel = localConn.model('relProg', relProgSchema, 'relProg');
var tagsModel = localConn.model('tags', new mongoose.Schema(), 'tags');


var prodConn = mongoose.createConnection('mongodb://BIDSI:mong0pwd4BI@logsr7.canallabs.fr:27018/R7'); // connection a la base R7

var bddpModel = prodConn.model('bddp', { name: String }, 'bddp');
var prodArtistModel = prodConn.model('artists', { name: String }, 'artists');
var logsModel = prodConn.model('logsGaspard', new mongoose.Schema(), 'logsGaspard')


Promise.promisifyAll(lastfmArtistModel);
Promise.promisifyAll(lastfmArtistModel.prototype);

Promise.promisifyAll(relProgModel);
Promise.promisifyAll(relProgModel.prototype);

Promise.promisifyAll(bddpModel);
Promise.promisifyAll(bddpModel.prototype);

Promise.promisifyAll(prodArtistModel);
Promise.promisifyAll(prodArtistModel.prototype);

Promise.promisifyAll(logsModel);
Promise.promisifyAll(logsModel.prototype);

module.exports = {
  ratedArtist: ratedArtistModel,
  lastfmArtist: lastfmArtistModel,
  relProg: relProgModel,
  tags: tagsModel,

  bddp: bddpModel,
  prodArtist: prodArtistModel,
  logs: logsModel
};
