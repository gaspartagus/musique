/*
	A cute little module for creating and searching	trie hashmaps

	Designed to search for sequences of words found in a text
	For example "Hello, I'm John Coltrane"
	will be searched as ["Hello"] and ["I'm", "John", "Coltrane"]
	and hopefully, in a trie of artists, "John Coltrane" will be returned
*/


var log = console.log.bind(console);

var trieOrigin;


function addWord(word,trie) {
	if (word.length > 0) {
		if( trie.hasOwnProperty(word[0]))
			trie[word[0]] = addWord(word.slice(1, word.length),trie[word[0]]);
		else {
			trie[word[0]] = {};
			trie[word[0]] = addWord(word.slice(1, word.length),trie[word[0]]);
		}
	}	else {
		trie.end = true;
	}
	return trie;
}

function createTrie(dic) {
	var trie = {};
	dic.forEach(function(word){
		trie = addWord( word, trie);
	});
	trieOrigin = trie;
}

function secoueLarbre(word,trie) { // Finds one word in the trie
	// console.log(trie.J.o.h.n[" "].C.o.l.t.r.a.n.e);
	return word // If some letters remain
		? trie.hasOwnProperty(word[0])
			? secoueLarbre( word.slice(1, word.length), trie[word[0]] ) // Récursion
			: { // Not found
				wordInTrie: false,
				space: trie.hasOwnProperty(" "),
				trie: trie
			}
		: { // If no letters remain
			wordInTrie: trie.hasOwnProperty("end"),
			space: trie.hasOwnProperty(" "),
			trie: trie
		};
}

function phrase(mots,trie) { // Finds a sequence of words in the trie
	var branche = secoueLarbre(mots[0], trie);

	if( !branche.wordInTrie && !branche.space) return "";

	var reste = mots.slice(1,mots.length),
			suite = "";

	if( branche.space && reste.length) {
		reste[0] = " " + reste[0];
		suite = phrase(reste, branche.trie);
	}

	return branche.wordInTrie || suite.length
		? mots[0] + suite
		: "";
}

function searchInText(text) { // Searches all possible sequences in a text
	var tags = [];

	var sequences = text.split(/,|\./).map( function(item) {
			return item.split(" ");
	});

	sequences.forEach(function(seq) {
		seq.forEach(function(mots,index){
			var tag = phrase( seq.slice(index), trieOrigin);
			if(tag) tags.push(tag);
		});
	});

	return tags;
}

function load(path) {
	trieOrigin = require(path);
	return {
		search: searchInText,
	};
}

module.exports = {
	create: createTrie,
	load: load,
};
