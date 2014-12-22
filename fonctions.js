var log = console.log;
var see = function(obj) { eyes.inspect(obj); return obj; };
var erreur = function erreur(err){
	if(err)log('Erreur : '+err);
}

var dateToString = function(timestamp){
	var date = new Date(timestamp);

	if(date.getMinutes() == 0)
		var minutes = "00";
	else if(date.getMinutes() <= 9)
		var minutes = "0" + date.getMinutes();
	else var minutes = date.getMinutes();

	return date.getHours() + 'H' + minutes;
}

var dayFromToday = function(timestamp) {
	var date = new Date(timestamp);
	var today = new Date();

	today.setHours(0);
	today.setMinutes(0);
	today.setSeconds(0);
	today.setMilliseconds(0);

	var jours = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
	var mois = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
	var days = Math.floor( (date.getTime() - today.getTime()) / 86400000 );

	if(days == 0)
		return 'TODAY';
	else if(days == 1)
		return 'DEMAIN';
	else if(days <= 7)
		return jours[ (date.getDay()+6)%7];
	else if(days >= 8)
		return jours[ (date.getDay()+6)%7] + ' EN HUIT';
}

createTrie = function(dic)
{
	var trie = {};

	var addWord = function(word,trie)
	{
		if (word.length > 0)
		{
			if( trie.hasOwnProperty(word[0]))
				trie[word[0]] = addWord(word.slice(1, word.length),trie[word[0]]);
			else
			{
				trie[word[0]] = {};
				trie[word[0]] = addWord(word.slice(1, word.length),trie[word[0]]);
			}
		}
		else
		{
			trie.end = true;
		}
		return trie;
	}

	for( var i in dic )
	{
		trie = addWord( dic[i].split(''), trie);
	}
	return trie;
}



var searchInText = function(text,trie,dictionnaire) // fonction autonome
{
	var secoueLarbre = function(mot,trie) // répond : [ tu continues a chercher, c'est bien un mot du dico, ses descendants ]
	{
		var word = mot.split('');

		var secoueLaBranche = function(word,trie)
		{
			if (word.length > 0)
			{
				if( trie.hasOwnProperty(word[0]))
				{
					return secoueLaBranche(word.slice(1, word.length),trie[word[0]]);
				}
				else
				{
					return [false, false, trie];
				}
			}
			// toutes les lettres sont passées :
			else if(trie.hasOwnProperty(' '))
			{
				return [true, false, trie]; // on continue, on s'en fout si le mot est dans le dico ou pas
			}
			else if(!trie.hasOwnProperty(' ') && trie.hasOwnProperty('end'))
			{
				return [false, true, trie]; // On s'arrête, et on a trouvé un mot
			}
			else if(!trie.hasOwnProperty(' ') && !trie.hasOwnProperty('end'))
			{
				return [false, false, trie]; // On s'arrête, et on a pas trouvé de mot
			}
		}
		return secoueLaBranche(word, trie)
	}

	var reponse = function(mot,j,trie,mots)
	{
		var branche = secoueLarbre(mot, trie);
		//console.log(branche[0],branche[1]);
		if( branche[0] && j < mots.length - 1) // Si on continue et que la séquence n'est pas terminée
		{
			var suite = reponse(' ' + mots[j+1], j+1, branche[2],mots);

			if(suite != '')
			{
				return mot + suite;
			}
			else return '';
		}
		else if( branche[1] )  // Si la sequence est terminee (on s'en fout si on continue ou pas) et que le mot est dans le dico
		{
			return mot;
		}
		else if( !branche[1] ) // Si le mot est pas dans le dico
		{
			return '';
		}

	}

	var tags = [];

	var sequences = text.split(/,|\./).map( function(item)
	{
		return item.split(' ');
	});

	for(var seq in sequences)
	{
		var mots = sequences[seq];

		for(var i=0; i < mots.length; i +=1)
		{
			var tag = reponse(mots[i],i,trie,mots);
			//console.log(reponse(mots[i],i,trie,mots));

			if(tag.length > 1)
			{
				tags.push(tag);
			}
		}
	}

	return tags;
}

var tagAProgram = function(prog)
{
	var champs = ['titre', 'shortSummary','summary'];
	var tags = [];

	for(var i in champs)
	{
		var text = prog[champs[i]];
		tags = tags.concat( searchInText(text,trie,dictionnaire,ratings) );
	}
	var programme = new models.relProg({progId: prog._id, artists: tags });

	programme.save( function (err)
	{
			//console.log(err);
	});
	tags = tags.map(function(tag){
		return tag.name;
	});
	tags = tags.filter(function(elem, pos) { // bout de code censé éliminer les doublons
	    return tags.indexOf(elem) == pos;
	});
	return tags;
}

var upload = function(){

	models.ratedArtist.findOne({name: nomsKeys[inoms] })
	.exec(function(err, rated){
		//log(rated);
		if(rated)
		{
			if(rated.rating > -0.5)
			{

				models.lastfmArtist.findOne( { dicName: nomsKeys[inoms] }, function (err, doc)
				{
					//log(doc);
					if(!doc)
					{

						endedProc = false;
						request('http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist='
							+ nomsKeys[inoms]
							+ '&lang=fre/fra&autocorrect=1&api_key=5a6da730a4f4bf4c6cda74d43126cabc&format=json',
							function (error, response, body)
							{
								var res = JSON.parse(body);
								//log(res);
								if (!error && response.statusCode == 200 && res.error != 6)
								{
									res.rating = rated.rating;
									res = res.artist;
									res.dicName = nomsKeys[inoms];
									res.progs = noms[nomsKeys[inoms]];
									res.starred = 0;
									res.stats = {
										playcount: parseInt(res.stats.playcount),
										listeners: parseInt(res.stats.listeners)
									};

									if( res.tags.hasOwnProperty('tag') )
									{
										if(res.tags.tag.map)
											res.tags = res.tags.tag.map( function(el){ return el.name; });
										else
										{
											log(res.tags.tag.map);
											res.tags = [res.tags.tag.name];
										}
									}
									else
									{
										res.tags = [];
									}

									fichesArtistes[ nomsKeys[inoms] ] =
									{
										dicName: nomsKeys[inoms],
										name: res.name ,
										stats: res.stats ,
										rating: res.rating,
										tags: res.tags
									};

									//log('fichesArtistes = ',fichesArtistes[ nomsKeys[inoms] ]);

									var lastfmArtist = new models.lastfmArtist(res);

									lastfmArtist.save( function (err)
									{
											console.log('Le nouvel artiste : ' + nomsKeys[inoms] + ' > ' + res.name + ' a été sauvé :)');
											endedProc = true;
											inoms += 1;
									});
								}
								else if(res.error == 6)
								{
									log(res,"L'artiste " + nomsKeys[inoms]+ " n'a pas été trouvé sur LastFM");
									endedProc = true;
									inoms += 1;
								}
							}
						);
					}
					else if(inoms < nomsKeys.length - 1)
					{
						// il faut parallèlement remplir un objet avec un fiche artiste
						log('Doc dans la fiche artiste :', doc);
						fichesArtistes[ nomsKeys[inoms] ] =
						{
							dicName: nomsKeys[inoms],
							name: doc.name ,
							stats: doc.stats,
							rating: doc.rating,
							tags: doc.tags
						};

						models.lastfmArtist.update(
							{ dicName: nomsKeys[inoms] },
							{ progs: noms[nomsKeys[inoms]] },
							{},
							function error(err){
								if(err) log(err);
							}
						);
						console.log(nomsKeys[inoms] + ' mis à jour :)');
						inoms += 1;
						upload();
					}
				});

			}

		}
		else if(inoms < nomsKeys.length - 1){
			endedProc = true;
			inoms += 1;
			upload();
		}
	});

}


var permutation = function permutation(n)
{
	var arr = [];
	for (var i = 2*Math.floor((n)/2)-1; i >= 1; i-=2)
	{
		arr.push(i);
	}
	for (var i = 0; i <= 2*Math.floor((n-1)/2); i+=2)
	{
		arr.push(i);
	}

	arr = arr.map(function (item,index) {
		return arr.indexOf(index) + 1;
	});

	if(arr.length != n) log('faute dans la permutation');
	return arr;
}

var getMaxOfArray = function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}
// var metadata = function metadata(bddpModel,tries,)

var arrToObject = function(tags) {
	obj = {};
	for (var i = tags.length - 1; i >= 0; i--) {
		if( obj.hasOwnProperty(tags[i]) )
			obj[tags[i]] += 1;
		else
			obj[tags[i]] = 1;
	};
	return obj;
}

var ps = function(art1, art2) {
	var prod = 0;
	for(var tag in art1)
	{
		if( art2.hasOwnProperty(tag) )
		{
			prod += art1[tag]*art2[tag];
		}
	}
	return prod;
}

var norme = function(art) {
	var sum = 0;
	for(var tag in art)
	{
		sum += Math.pow( art[tag], 2);
	}
	return Math.sqrt(sum);
}

var normalize = function(art) {
	var n = norme(art);
	for(var tag in art)
	{
		art[tag] /= n;
	}
	return art;
}

var projectSort = function(user,tags) {
	var arr = [];
	for(var tag in user)
	{
		if ( tags.hasOwnProperty(tag) && user[tag] > 0.1)
		{
			arr.push(tag);
		}
		//log('tag: ', tag);
	}
	arr.sort(function(a,b){
		return user[a] < user[b];
	});
	return arr;
}

















