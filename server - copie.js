var fs        = require('fs')
  , path      = require('path')
  , XmlStream = require('xml-stream')
  , util = require('util')
  , jquery = require('jquery')
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
                'Offenbach','Sharks'];


refresh = {
	'dictionnaire': 'skip',
	'trie': 'skip'
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

.get('/categories', function(req, res) {

    var now = new Date().getTime();

	models.bddp
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
        $group :
        { 
           _id : "$subtitleLbl"
        }
    },
    {
    	$sort : { _id : 1 }
    })
    .exec(function(err, docs)
    {
		res.render('categories.ejs', {categories: docs});
	});

})
.get('/categories/:categorie', function(req, res)
{
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    console.log(req.params.categorie);

    var now = new Date().getTime();

    models.bddp
    .aggregate(
    {
        $match :
        {
            $and:
            [
                { $or: [ {subtitleLbl: { $regex: 'musi', $options: 'i'}}, {subtitleLbl: { $regex: 'concert', $options: 'i'} }] },
                { subtitleLbl : { $regex: req.params.categorie, $options: 'i'} },
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
           titleLbl: { $first: "$titleLbl"},
           summary: { $first: "$summary"},
           categorie: { $first: "$subtitleLbl"},
           startDate: { $first: "$startDate"},
           endDate: { $first: "$endDate"},
           image: { $first: "$std169Image"},
           chaine: { $first: "$name"},
           duration: { $first: "$duration" }
       }
    },
    {
    	$sort : { startDate : 1 }
    })
    .exec(function(err, docs)
    {
		docs = docs.map
		(
			function (obj)
			{

				obj.jour = dayFromToday(obj.startDate);
				obj.startDate = dateToString(obj.startDate);
				obj.endDate = dateToString(obj.endDate);
				return obj;
			}
		);

		res.render('index.ejs', {concerts: docs});
	});
    
})
.get('/match/:description', function(req, res) {

	var matched = 1;
	var i = 0;
	var output = [];
	var temp = '';
	var description = decodeURIComponent(req.params.description);

	while(matched && i <= dictionnaire.length*0.999)
	{
		temp = XRegExp.exec(description, new XRegExp(XRegExp.escape(dictionnaire[i]),'i') );

		if(!(temp == null))
			output.push([temp,i]);

		i += 1;

		if(output.length >= 1)
		{
			matched = 0;
			// console.log(output);
			res.setHeader('Content-Type', 'text/html; charset=utf-8');
			res.end('' + output);
		}
	}
	
})
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
         shortSummary: { $first: "$shortSummary"},
         summary: { $first: "$summary"},
         progs: { $first: '$startDate'}
     }
    })
    .exec(function(err, docs)
    {
        noms = {};
        //log(docs[0])
        for(var idoc in docs)
        {
          var nomsProg = tagAProgram(docs[idoc],trie,dictionnaire,ratings);
          for(var iprog in nomsProg)
          {
          	if( blacklist.indexOf(nomsProg[iprog]) == -1)
          	{
              if( noms.hasOwnProperty( nomsProg[iprog] ) )
              {
                noms[nomsProg[iprog]].push( docs[idoc]._id );
              }
              else
              {
                noms[nomsProg[iprog]] = [ docs[idoc]._id ];
              }
          	}
          }
        }
        //console.log(noms);
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
                log('Les artistes ne correspondant a occun programme ont étés mis à jour avec prog: [] ')
                if(err) log(err);
            }
        );

        intervalObject = setInterval(
        	function()
        	{
        		if( inoms < nomsKeys.length && endedProc)
        		{
        			upload();
        		}
        		else if(inoms >= nomsKeys.length)
                {
                  clearInterval(intervalObject);
                }
        	},
        	750
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

    var n = 12;

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
        log(disp);
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
              { progs: {$not: {$size: 0}} },
              { tags: {$elemMatch: { name: req.params.tag } } }
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
                playcount: "$stats.playcount"
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
        }).filter(function(item){
            var note = item.rating;
            return note > 0;
        }).sort(function(a,b){
            return a.playcount < b.playcount
        }).map(function(item){
            item.scale = 1/(1+Math.log(scale/item.playcount)/3);
            return item;
        });

        res.json(docs);
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
        donnees.resume = doc.bio.summary
            .replace(/&quot;/g,'"')
            .replace(/&lt;/g,'<')
            .replace(/&gt;/g,'>') 
            .replace(/\n/g,'')
        ;
        // console.log(doc.bio.summary)
        //log(donnees);
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
})
;

app.listen(8080);

