var Promise = require("bluebird"),
		request = require('request'),
		eyes = require("eyes"),
		models = require("./models"),
		log = console.log.bind(console);

Promise.promisifyAll(request);

function upsertProgLocal(progId, progArtistes){
  return models.relProg.update(
      { progId: progId },
      { artistes: progArtistes },
      { multi: true }
  )
  .exec();
}

function programsToLocal(artistes){
	return Promise
	.reduce(artistes, function(apres,artiste){
		if(artiste.progs)
			if( !artiste.progs.length)
				return;
		return Promise
		.reduce(artiste.progs,function(total,progId){
			return models.relProg
			.findOne({ progId: progId })
			.exec()
			.then(function (prog){
				if(!prog) throw "Program not present in the database";
				var progArtistes = prog.artistes
					? prog.artistes.concat(artiste)
					: [artiste] ;
				return upsertProgLocal(progId, progArtistes);

			});
		});
	});
}

module.exports = programsToLocal;