var Promise = require("bluebird"),
    models = require("./models"),
    dic, // = require("./dictionnaire"),
    trie = require("./trie").load("./artists-trie"),
    lastfmToLocal = require("./upload"),
    programsToLocal = require("./programs"),
    pipelines = require("./pipelines"),
    semantics = require("./semantics"),
    blacklist = semantics.blacklist,
    log = console.log.bind(console)
;


var programs = {},
    champs = ["titre","sousTitre","shortSummary","summary"];

log(trie.search("John Coltrane "));

var promise = models.bddp
  .aggregate(pipelines.music) //.concat({ $limit : 10 }))
  .exec()
  .then(function(docs){
    log(docs.length, " programs fetched");
    var noms = {};
    // log(docs)

    docs.forEach(function(prog){

      var tags = [];
      var cats = [];

      // recherche de reference dans chaque champ du programme
      champs.forEach(function(c){
          var text = prog[c];
          // Stéphanie de Monaco Paul Mc Cartney
          tags = tags.concat( trie.search(text) );

          // cats = cats.concat( searchInText(text,trie2,dic2) )
      });
      // élimination des doublons et des elements de la blacklist artistes :
      tags = tags.filter(function(elem, pos) {
          return tags.indexOf(elem) == pos && blacklist.indexOf(elem) == -1;
      });
      // cats = cats.filter(function(elem, pos) {
      //     return cats.indexOf(elem) == pos;
      // });

      // aggregation des résultats par nom d'artiste dans l'objet noms
      tags.forEach(function(tag){
        if(noms[tag]){
          if(noms[tag].indexOf(prog._id) == -1)
            noms[tag].push(prog._id);
        }
        else
          noms[tag] = [prog._id];
      });

      // aggregation des résultats par progId dans l'objet programs
      // if(tags.length)
      //   uploadProgLocal(prog);
    });
    return noms;
  })
  .then(function(noms){
    var artistes = [];
    for(var name in noms){
      artistes.push({dicName: name, progs: noms[name]});
    }
    return artistes;
  })
  .then(upsertLocal)
  .then(lastfmToLocal)
  .then(programsToLocal)
  .then(function(){
    log("J'ai fini");
  });


function upsertLocal(artistes) {
  var names = artistes.map(function(a){
    return a.dicName;
  });

  return models.lastfmArtist.update(
      { dicName: { $nin: names } },
      { progs: [] },
      { multi: true }
  )
  .exec()
  .then(function(){
    return artistes;
  });
}

function uploadProgLocal(prog){
  log("Saving "+prog.title);
  var progDoc = new models.relProg(prog);
  progDoc.save();
  return true;
}

