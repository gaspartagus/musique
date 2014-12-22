var fs        = require('fs')
  , path      = require('path')
  , XmlStream = require('xml-stream')
  , util = require('util')
  , jQuery = require('jquery')
  , jsdom = require("jsdom")
  , request = require('request')
  , XMLSplitter = require('xml-splitter')
  , eyes = require('eyes')
  , xml2js = require('xml2js')
  , statistics = require('simple-statistics')
  , sylvester = require('sylvester')
  , express = require('express')
  , connect = require('connect')
  , serveStatic = require('serve-static')
  , XRegExp = require('xregexp').XRegExp
  , bodyParser = require('body-parser')
  , Entities = require('html-entities').AllHtmlEntities
  , entities = new Entities()
  , models = require('./models')
  , querystring = require('querystring')
  ;
var blacklist = ['Roméo','Partita','Chanson','Offering','Dix','Radio France',
                'GUERRE FROIDE','Petite','Schubert','Alliage','Atkins','Fray',
                'Offenbach','Sharks','Herbert Bayer','Carmina Burana'];


var window = jsdom.jsdom().parentWindow;

jsdom.jQueryify(window, "http://code.jquery.com/jquery.js", function () {
  $ = window.$;
  $("body").prepend("<h1>Hello World</h1>");
  console.log($("h1").html());
});

refresh = {
	'dictionnaire': 'loadg',
	'trie': 'loadg'
}


if(refresh['dictionnaire'] == 'refresh')
{
	models.ratedArtist.find()
	.sort({rating: -1})
	.exec(function(err, docs){

		dictionnaire = docs.map(function (obj)
		{
			 return obj.name;
		});
		ratings = docs.map(function (obj)
		{
			 return obj.rating;
		});
		fs.writeFile('dictionnaire.js', 'var dictionnaire = ' + JSON.stringify(dictionnaire) + '; console.log("dictionnaire chargé");', function (err) {
            console.log(err);
        });
		fs.writeFile('ratings.js', 'var ratings = ' + JSON.stringify(ratings) + '; console.log("ratings chargé");', function (err) {
			console.log(err);
		});
	});

}
else if(refresh['dictionnaire'] == 'load')
{
	eval(fs.readFileSync(__dirname +'/dictionnaire.js')+'');
	eval(fs.readFileSync(__dirname +'/ratings.js')+'');
}

if(refresh['trie'] == 'load')
{
	eval(fs.readFileSync(__dirname +'/trie.js')+'');
}



eval(fs.readFileSync(__dirname +'/fonctions.js')+'');


// Debut du serveur http
var app = express();

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}

app
.use( allowCrossDomain )
.use( express.static(__dirname + '/webapp') )
.use( bodyParser.json() )

.get('/populate', function(req, res) { // requiert que trie et dictionnaire soient chargés

    var now = new Date().getTime();

    var progStream = models.bddp
    .aggregate(
    {
      $match :
      {
          $and:
          [
              { $or: [ {subtitleLbl: { $regex: 'musi', $options: 'i'}}, {subtitleLbl: { $regex: 'concert', $options: 'i'} }] },
              { startDate : { $gte: now } }
          ]
      }
    },
    {
        $sort : { startDate : 1 }
    },
    {
        $group :
        {
            _id : "$progId",
            nb : { $sum : 1 },
            titre: { $first: "$titleLbl"},
            sousTitre: { $first: "$subtitleLbl"},
            shortSummary: { $first: "$shortSummary"},
            summary: { $first: "$summary"},
            startDate: { $first: '$startDate'},
            endDate: { $first: '$endDate'},
            chaine: { $first: '$name'}
        }
    })
    .exec(function(err, docs)
    {
        // Dans cette partie il faut pour chaque programme rechercher
        // pour chaque mot et chaque dictionnaire les occurences des mots.
        // Ensuite les résultats doivent être formatés selon metadata.artiste[0].name/rating/views
        var champs = ['titre','sousTitre','shortSummary','summary'];
        noms = {};
        programs = [];
        fichesArtistes = {};
        var dic2 = ['Concert','Mag.','Série','Doc.','Film','Téléfilm','Comédie'];
        var trie2 = createTrie(dic2);

        for(var idoc in docs)
        {
            var prog = docs[idoc];
            var tags = [];
            var cats = [];

            // recherche de reference dans chaque champ du programme
            for(var i in champs) {
                var text = prog[champs[i]];
                tags = tags.concat( searchInText(text,trie,dictionnaire) );
                cats = cats.concat( searchInText(text,trie2,dic2) )
            }
            // élimination des doublons et des elements de la blacklist artistes :
            tags = tags.filter(function(elem, pos) {
                return tags.indexOf(elem) == pos && blacklist.indexOf(elem) == -1;
            });

            cats = cats.filter(function(elem, pos) {
                return cats.indexOf(elem) == pos;
            });


            // var duree = (prog.endDate - prog.startDate)/3600000;
            // if(tags.length > 0)
            //     var concert = duree + duree/tags.length*10;
            // else var concert = 0;
            // //console.log(cats);
            // if( cats.indexOf('Concert')!=-1 )
            // {
            //     concert += 3;
            // }

            // aggregation des résultats par nom d'artiste dans l'objet noms
            for (var i = tags.length - 1; i >= 0; i--)
            {
                if( noms.hasOwnProperty( tags[i] ) )
                {
                    noms[tags[i]].push( prog._id );
                }
                else
                {
                    noms[tags[i]] = [ prog._id ];
                }
            };
            // aggregation des résultats par progId dans l'objet programs
            programs.push(
                {
                    progId: prog._id,
                    artistes: tags,
                    categories: cats,
                    concert: concert,
                    startDate: prog.startDate,
                    endDate: prog.endDate,
                    titre: prog.titre,
                    chaine: prog.chaine
                }
            );

        } // fin de la boucle sur tous les docs et donc de la double aggregation programmes/noms

        // console.log('Variance: ' + statistics.variance(durees),'moyenne : ' + statistics.mean(durees));

        // a filter stage
        var removedNames = [];
        for (var name in noms) {
            if( noms[name].length >= 5 )
            {
                removedNames.push(name);
                delete noms[name];
            }
        };
        log('removedNames :', removedNames);
        for (var i = programs.length - 1; i >= 0; i--) {
            programs[i].artistes = programs[i].artistes.filter(function(e){
                console.log(e, removedNames.indexOf(e) == -1);
                return removedNames.indexOf(e) == -1;
            })
        };

        res.json(noms);

        inoms = 0;
        endedProc = true;
        nomsKeys = Object.keys(noms);

        // delete progs where not in noms
        models.lastfmArtist.update(
            { dicName: { $nin: nomsKeys } },
            { progs: [] },
            { multi: true },
            function error(err){
                log('Les artistes ne correspondant a aucun programme ont étés mis à jour avec prog: []')
                if(err) log(err);
            }
        );

        intervalObject = setInterval(
            function()
            {
                //log(nomsKeys.length,inoms,nomsKeys[inoms],nomsKeys[inoms+1]);
                if( inoms < nomsKeys.length - 1 && endedProc)
                {
                    log('branche upload');
                    upload();
                }
                else if(inoms >= nomsKeys.length - 1)
                {
                    log('branche de fin');

                    log(clearInterval(intervalObject));
                    // récupération des infos sur chaque réference trouvée
                    for (var i = programs.length - 1; i >= 0; i--)
                    {
                        var tagsConcat = [];
                        // dans l'objet programme on remplace chaque reference nue par sa fiche complète
                        programs[i].artistes = programs[i].artistes.map(function(item, index){
                            // on récupère la fiche artiste avec les données générées par upload()
                            if(fichesArtistes[item])
                                tagsConcat = tagsConcat.concat(fichesArtistes[item].tags);

                            console.log(fichesArtistes[item]);

                            return fichesArtistes[item];
                        });

                        programs[i].tags = tagsConcat;

                        //eyes.inspect(programs[i]);

                        models.relProg.update(
                            {progId: programs[i].progId},
                            {$set: programs[i] },
                            {upsert: true},
                            erreur
                        );

                    };
                }
            },
            300
        );

    });

})
.get('/ouh', function(req, res) {

	res.setHeader('Content-Type', 'text/html; charset=utf-8');

	if(refresh['trie'] == 'refresh')
	{
		fs.writeFile('trie.js', 'var trie = ' + JSON.stringify(createTrie(dictionnaire)) + '; console.log("trie chargé");', function (err) {
				console.log(err);
			});
	}

})
.get('/backbone/:id', function(req, res) {
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	models.tags.aggregate(
		{
			$project: {
				_id: '$_id',
				artistes: '$value.names',
				nb: { $size: '$value.names' }
			}
		}
	)
	.sort({ nb: -1 })
	.limit(10)
	.exec(function(err, docs){
		//res.render('tags.ejs', {tags: docs});
		var data = {
			x: 1,
			y: 1,
			vx: 1,
			vy: 1,
			masse: docs[req.params.id].nb,
      tag: docs[req.params.id]._id
		};
    // console.log(data);
    res.json(data);
	});

})
.get('/api/tags', function(req, res) { // displays tags in programs order

    var n = 30;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    models.tags.aggregate(
    {
        $project: {
            _id: '$_id',
            image: '$value.image',
            nb: { $size: '$value.names' },
            artistes: '$value.names'
        }
    }
    )
    .sort({ nb: -1 })
    .limit(n)
    //.sort({ nb: 1 })
    .exec(function(err, docs){
        //log(docs);
        var dist = 60;
        var G = 70000;
        var disp = permutation(n);
        //log(disp);
        resultat = [];

        for (var i = docs.length - 1; i >= 0; i--) {


            var r = dist*(disp[i]+1);
            var item = docs[i];

            resultat[i] = {
                id: i,
                x: 0,
                y: Math.pow(-1,disp[i])*r,
                vx: Math.pow(-1,disp[i]+1)*Math.sqrt( G/(r) )*Math.pow(-1, Math.floor(Math.random()*2) ),
                vy: 0,//Math.random()*Math.sqrt( G/(r) )/100 ,
                masse: item.nb,
                tag: item._id,
                image: item.image,
                artiste: item.artistes[0]
            };

        }

    // log(resultat);
    res.json(resultat);
    });

})
.get('/api/artistes/:tag', function(req, res) // displays artists corresponding to a tag
{
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    log(req.params.tag);

    models.lastfmArtist.aggregate(
    {
        $match: {
            $and:
          [
              //{ progs: {$not: {$size: 0}} },
              { tags: {$elemMatch: { $in: [req.params.tag] } } },
              { rating: {$gte: -0.5} }
          ]
        }
    },
    {
        $group: {
            _id: {
                name: "$name",
                dicName: "$dicName",
                progs: "$progs",
                rating: "$rating" ,
                image: "$image" ,
                listeners: "$stats.listeners",
                playcount: "$stats.playcount",
                starred: "$starred"
            }
        }
    })
    .exec(function(err, docs){
        log(docs[0]);

        var scale = getMaxOfArray(docs.map(function(e){
            return e._id.playcount;
        }));


        docs = docs.map(function(item){
            return item._id;
        }).sort(function(a,b){
            return a.playcount < b.playcount
        }).map(function(item){
            item.scale = 1/(1+Math.log(scale/item.playcount)/3);
            return item;
        });

        res.json(docs);
    });
})
.get('/api/artistes/star/:name', function(req, res) // displays artists corresponding to a tag
{
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    log('star', req.params.name);

    models.lastfmArtist.findOne({ dicName: req.params.name })
    .exec(function(err, doc){
        log(doc);

        models.lastfmArtist.update(
            { dicName: req.params.name },
            { starred: (doc.starred+1) % 2 },
            {},
            function error(err){
                if(err) log(err);
                res.send('Good, you like ' + req.params.name);
            }
        );
    })
})
.get('/api/categories', function(req, res) // displays artists corresponding to a tag
{
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    var user = {};
    var nowAndThen = new Date().getTime();

    // get user profile
    models.lastfmArtist
    .aggregate(
        {
            $match: { starred: 1 }
        },
        {
            $project: {
                tags: 1,
                name: 1
            }
        },
        {
            $unwind: "$tags"
        },
        {
            $group: {
                _id: "$tags" ,
                artistes: {
                    $push: "$name"
                }
            }
        },
        {
            $project: {
                tag: "$_id",
                //artistes: 1,
                nb: { $size: "$artistes" }
            }
        })
    .exec(function(err, docs){
        log(docs[0]);
        for (var i = docs.length - 1; i >= 0; i--) {
             user[docs[i].tag] = docs[i].nb;
        };

        user = normalize(user);
        console.log(user);

        // récupération des programmes taggés
        models.relProg.aggregate(
        {
            $match: {
                $and:
              [
                  { artistes: {$not: {$size: 0}} },
                  { artistes: {$not: {$size: -1}} },
                  { chaine: {$not: { $in: ['BRAVA'] }} },
                  { categories: {$not: {$size: 0}} }, //{$elemMatch: { $in: [ 'Concert' ] } } }
                  { startDate : { $gte: nowAndThen } }
              ]
            }
        },
        {
            $sort: {
                concert: -1
            }
        },
        {
            $limit: 20
        })
        .exec(function(err, docs){
            //eyes.inspect(docs[0]);

            docs = docs.map(function(el){
                eyes.inspect(el.artistes);
                el.artistes = el.artistes
                .filter(function(e){return e != null})
                .map(function(it){
                    if(it.rating == null)
                        it.rating = -0.4;
                    return it.dicName;
                });
                el.date = new Date(el.startDate);
                el.jour = dayFromToday(el.startDate);
                el.duree = dateToString(el.endDate - el.startDate-3600000);
                el.startDate = dateToString(el.startDate);
                el.endDate = dateToString(el.endDate)-3600000;
                el.proj = ps(normalize(user), normalize(arrToObject(el.tags)));
                el.tags = projectSort(user,arrToObject(el.tags));
                return el;
            });

            docs = docs.sort(function(a,b){
                return a.proj < b.proj;
            });
            //.slice(0,3);


            var getLastfm = function(arr,i) {

                if( i < arr.length ) {
                    log(arr[i].artistes);
                    models.lastfmArtist
                    .find({ dicName: { $in: arr[i].artistes } })
                    .exec(function(err,resp){

                        var array = arr;
                        array[i].artistes = resp;
                        return getLastfm(array,i+1);
                    });
                }
                else {
                    res.json(arr);
                    return arr;
                }
            }
            getLastfm(docs,0);
        });
    });
})
.get('', function(req, res)
{
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendfile('webapp/index.html');
})
.get('/api/artiste/:artist', function(req, res)
{
    log(req.params.artist);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    donnees = {};
    results = new Results();

    request(
        'https://www.googleapis.com/youtube/v3/search?part=snippet&order=viewCount&q=vevo+'
        + req.params.artist
        + '&type=video&videoDefinition=high&videoEmbeddable=true&key=AIzaSyC-nFEzVOfNkq2hVYVp_S0TsV5fmeYU3Ew'
        ,function (error, response, body){

            var obj = JSON.parse(response.body);

            donnees.youtube = obj.items.map(function(item){
                var data = {
                    _id: item.id.videoId,
                    thumbnails: item.snippet.thumbnails,
                    title: item.snippet.title.toUpperCase()
                }
                return data;
            });
            results.setYoutube(donnees);
        }
    );

    function Results()
    {
        this.bddp = 0;
        this.lastfm = 0;
        this.youtube = 0;

        this.setBddp = function(donnees){
            this.bddp = 1;
            if(this.lastfm*this.youtube == 1)
            {
                res.json( donnees );
            }
            else log('En attente de lastfmLocal ou youtube');
        };
        this.setLastfm = function setLastfm(donnees){
            this.lastfm = 1;
            if(this.bddp*this.youtube == 1)
            {
                res.json( donnees );
            }
            else log('En attente de bddpR7 ou youtube');
        }
        this.setYoutube = function setLastfm(donnees){
            this.youtube = 1;
            if(this.bddp*this.lastfm == 1)
            {
                res.json( donnees );
            }
            else log('En attente de bddpR7 ou lastfm');
        }
    }

    models.lastfmArtist.findOne({name: req.params.artist})
    .exec(function(err, doc){

        // console.log('donnees = ',donnees);
        donnees.name = doc.name;
        donnees.image = doc.image[4]['#text'];
        donnees.stats = doc.stats;
        donnees.rating = doc.rating;

        $('body').html($.parseHTML(doc.bio.content));
        log($('body').html());
        $("a:contains('Read more')").replaceWith(function() { return '' });
        $("a").contents().unwrap();
        $("span").contents().unwrap();

        donnees.resume = $('body').html().split('User-contributed')[0] ;

        results.setLastfm(donnees);

        models.bddp.aggregate(
        {
            $match: { progId: { $in: doc.progs } }
        },
        {
            $sort : { startDate : -1 }
        },
        {
            $group :
            {
                _id : "$progId",
                nb : { $sum : 1 },
                titleLbl: { $first: "$titleLbl"},
                startDate: { $first: "$startDate"},
                endDate: { $first: "$endDate"},
                chaine: { $first: "$name"},
                std169Image: { $first: '$std169Image'}
            }
         })
        .exec(function(err, docs){

            docs = docs.map(function (obj){

                var obj = obj;
                obj.jour = dayFromToday(obj.startDate);
                obj.startDate = dateToString(obj.startDate);
                obj.endDate = dateToString(obj.endDate);
                obj.image = 'http://epg.canal-plus.com/mycanal/img/STD169/JPG/462X260/STD169_'
                     + obj.std169Image.toUpperCase();
                obj.titleLbl = obj.titleLbl.toUpperCase();
                return obj;
            });
            // log('documents = ', docs);
            donnees.progs = docs;

            //log(donnees);

            results.setBddp(donnees);
        });
    });
})
.get('/artists/:artist/youtube/:id/:title', function(req, res)
{
    log(req.params.title);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    donnees = {
        id: req.params.id,
        title: req.params.title,
        name: req.params.artist
    };

    request(
        'https://www.googleapis.com/youtube/v3/search?part=snippet&order=viewCount&q=vevo+'
        + req.params.artist
        + '&type=video&videoDefinition=high&videoEmbeddable=true&key=AIzaSyC-nFEzVOfNkq2hVYVp_S0TsV5fmeYU3Ew'
        ,function (error, response, body){

            var obj = JSON.parse(response.body);

            donnees.youtube = obj.items.map(function(item){
                var data = {
                    id: item.id.videoId,
                    thumbnails: item.snippet.thumbnails,
                    title: item.snippet.title.toUpperCase()
                }
                return data;
            });
            res.render('youtube.ejs', donnees );
        }
    );
})
.get('/programmes/:progId', function(req, res)
{
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    donnees = {};

    log(req.params.progId);

    models.bddp.findOne({progId: parseInt(req.params.progId) })
    .exec(function(err, doc){
        // log(doc._doc);
        var obj = doc._doc;
        obj.jour = dayFromToday(obj.startDate);
        obj.startDate = dateToString(obj.startDate);
        obj.endDate = dateToString(obj.endDate);
        obj.std169Image = obj.std169Image.toUpperCase();
        obj.titleLbl = obj.titleLbl.toUpperCase();

        res.render('programme.ejs', obj );
    });
})
.get('/:param', function(req,res){
    res.json(req.params.param);

    models.lastfmArtist
    .mapReduce(
    {
        map: function()
        {
            var blacklist =
            ['french', 'female vocalist','german','under 2000 listeners'
            ,'female vocalists', 'piano','violin','classic'
            ,'singer-songwriter','instrumental','chanson','conductor','hip hop'
            ];

            for(var i in this.tags)
            {
                if( blacklist.indexOf(this.tags[i]) == -1 && this.rating > -0.5)
                    emit( this.tags[i] , {names: [this.name], image: this.image[this.image.length-1]['#text'] });
            }
        },
        reduce: function(key, values)
        {
            var arr = [];
            var i;
            for(i=0;i<values.length;i++)
            {
                arr = arr.concat(values[i].names);
            }

            return {names: arr, image: values[Math.floor(Math.random()*(values.length-1))].image};
        },
        out: {
            replace: 'tags'
        }
    })
})
.get('/fix', function(req,res){
    res.json(req.params.param);

    models.lastfmArtist
    .update()
})
;

app.listen(8080);

