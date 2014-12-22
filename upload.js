var Promise = require("bluebird"),
		request = require('request'),
		eyes = require("eyes"),
		models = require("./models"),
		log = console.log.bind(console);

Promise.promisifyAll(request);


function uploadLocal(art){
	log("Saving "+art.name);
	var lastfmArtist = new models.lastfmArtist(art);
	lastfmArtist.save();
	return true;
}

function format(art){
	art.starred = 0;
	art.stats = {
		playcount: parseInt(art.stats.playcount),
		listeners: parseInt(art.stats.listeners)
	};
	art.tags = art.tags
		? art.tags.tag
			? art.tags.tag.map
				? art.tags.tag.map( function(el){ return el.name; })
				: [art.tags.tag.name]
			: []
		: [];
	return art;
}

function lastfmReq(dicName) {
	return "http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist="
		+ dicName
		+ "&lang=fre/fra&autocorrect=1&api_key=5a6da730a4f4bf4c6cda74d43126cabc&format=json";
}

function lastfmToLocal(artistes){
	return Promise
	.reduce(artistes, function(apres,artiste){
		// apres = apres ? apres : [];
		return models.lastfmArtist
		.findOne({ dicName: artiste.dicName })
		.exec()
		.then(function (doc) {

			if(doc) {
				// log("Already saved "+ doc.name);
				apres.push(doc);
				return apres;
			}

			return request
			.getAsync(lastfmReq(artiste.dicName))
			.then(function found(res) {
				var body = JSON.parse(res[0].body);
				if (body.artist) {
					return body.artist;
				} else {
					throw body;
				}
			})
			.then(function preformat(art){
				art.dicName = artiste.dicName;
				art.progs = artiste.progs;
				return art;
			})
			.then(format)
			.then(uploadLocal)
			.delay(300)
			.then(function(art){
				apres.push(art);
				return apres;
			})
			.catch(function(msg) {
				log(msg, artiste.dicName);
				return apres;
			});
		});
	}, []);
}



module.exports = lastfmToLocal;

// lastfmToLocal([{dicName: "Blue Balls", progs: []}, {dicName: "Black Balls", progs: []}]);

