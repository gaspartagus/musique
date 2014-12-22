
var pi = 3.14159265359;
var perm = [0,2,4,6,1,3,5,7];

var grid = function grid(n,l,m) { // n the indice of the point we want the coordinates of,
	// beginning at 0 of coordinates [1,0] and then counter clock-wise

	//var n = perm[n];

	var rayon = function rayon(o) { // o: theta, l: scaleX, m: scaleY
		
		if(o >= -pi/4 && o < pi/4)
			return 1/Math.cos(o);
		else if(o >= pi/4 && o < 3*pi/4)
			return 1/Math.sin(o);
		else if(o >= 3*pi/4 && o < 5*pi/4)
			return -1/Math.cos(o);
		else if(o >= 5*pi/4 && o < 7*pi/4)
			return -1/Math.sin(o);
		else return 0;
	}
	var o = (( (n+2)*pi/4+pi/4 ) % (2*pi)) - pi/4 ;
	// console.log('o = ', Math.floor(o/pi*4), n )
	var r = rayon(o);
	// console.log([ r*Math.cos(o)*l, r*Math.sin(o)*m ]);
	return [ r*Math.cos(o)*l, r*Math.sin(o)*m ].map(Math.floor);
}

var origine = function(el,type) {
	var i = $(el);
	var o = [parseInt(i.css('top')), parseInt(i.css('left'))]; // origine
	var s = [parseInt(i.css('height')), parseInt(i.css('width'))] ; // size

	switch(type) {
		case 0:
			return [o[0], o[1]];
			break;
		case 1:
			return [o[0]+s[0], o[1]];
			break;
		case 2:
			return [o[0]+s[0], o[1]+s[1]];
			break;
		case 3:
			return [o[0], o[1]+s[1]];
			break;
	}
}

var addItemToGrid = function(matrix,el,options) {
	var i = $(el);
	var o = [parseInt(i.css('top')), parseInt(i.css('left'))]; // origine
	var s = [parseInt(i.css('height')), parseInt(i.css('width'))] ; // size

	matrix.push(o);
	matrix.push([ o[0]+s[0], o[1]+s[1] ]);
	matrix.push([ o[0]+s[0], o[1] ]);
	matrix.push([ o[0], o[1]+s[1] ]);
	if(options.first)
	{
		matrix.push([ o[0]-50, o[1]]);
		matrix.push([ o[0]+s[0], o[1]-50 ]);
		matrix.push([ o[0]+s[0]+50, o[1]+s[1] ]);
		matrix.push([ o[0], o[1]+s[1]+50 ]);
	}
    options.canvas.fillStyle = "#FF0000";
	displayMatrix(matrix,options.canvas);
	return matrix;
}

var displayMatrix = function(matrix,canvas) {
	for (var i = matrix.length - 1; i >= 0; i--) {

		canvas.fillRect(matrix[i][1],matrix[i][0], 5, 5);

		canvas.fillText(i,matrix[i][1],matrix[i][0]);
		
	};
	return 1;
}

var vecteur = function(point1,point2) {
	return [point2[0]-point1[0], point2[1]-point1[1]];
}

var angle = function angle(vecteur)
{
	var n = norme(vecteur);
	vecteur = [ vecteur[0]/n, vecteur[1]/n ];
    if (vecteur[1] >= 0)
    {
        return Math.acos(vecteur[0]);
    }
    if (vecteur[1] < 0)
    {
        return 2*pi - Math.acos(vecteur[0]);
    }
}

var computeCorner = function(matrix,point) {

	var directions = matrix.map(function(p){ // compute all directions from a point
		if(p != point)
			return angle(vecteur(point,p)); 
	}).filter(function(e){return e != undefined;});

	//console.log(directions);

	var e = 0.001;
	var cardinaux = [0,0,0,0];
	var quadrant = [1,1,1,1];
	var coins = [0,0,0,0];

	for(q = 0; q < 4; q++)
	{
		if( directions.filter(function(a){
			return a > q*pi/2 - e && a < q*pi/2 + e;
		}).length )
			cardinaux[q] = 1; // s'il y a un point dans la direction q
	}

	for(q = 0; q < 4; q++)
	{
		if( directions.filter(function(a){
			return a > q*pi/2 + e && a < (q+1)*pi/2 - e;
		}).length )
			quadrant[q] = 0; // si un point est présent dans le quadrant
	}

	for(q = 0; q < 4; q++)
	{
		var sum = cardinaux[q] + cardinaux[(q+1)%4] + quadrant[q];
		if(sum == 3) coins[q] = 1;
	}

	//console.log(cardinaux,quadrant,coins);

	return coins;
}

var arrMin = function(numArray) {
    return Math.min.apply(null, numArray);
}

var norme = function(vect) {
	//return Math.sqrt( Math.pow(vect[0], 2) + Math.pow(vect[1], 2));
	return Math.abs(vect[0]) + Math.abs(vect[1]);
}

var computeNearestCorner = function(matrix,origine,type) {
// computes the nearest corner from origin of given type

	var distances = matrix.map(function(p){
		//console.log('p:',computeCorner(matrix,p)[type])
		return computeCorner(matrix, p)[type]*norme(vecteur(origine,p));
	});
	console.log('distances:', distances);
	console.log('coin le plus proche: ', matrix[distances.indexOf(arrMin(distances.filter(function(num){return num;})))]);
	return matrix[distances.indexOf(arrMin(distances.filter(function(num){return num;})))]; // retourne le point le plus proche qui est un coin
	
}

var positionner = function(el,pos,type) {

	var s = [parseInt(el.css('height')), parseInt(el.css('width'))] ; // size
	switch(type) {
		case 0:
			el.css('top', pos[0]).css('left', pos[1]);
			//el.transition({top: pos[0], left: pos[1] });
			break;
		case 1:
			el.css('top', pos[0]-s[0]).css('left', pos[1]);
			//el.transition({top: pos[0]-s[0], left: pos[1] });
			break;
		case 2:
			el.css('top', pos[0]-s[0]).css('left', pos[1]-s[1]);
			//el.transition({top: pos[0]-s[0], left: pos[1]-s[1] });
			break;
		case 3:
			el.css('top', pos[0]).css('left', pos[1]-s[1]);
			//el.transition({top: pos[0], left: pos[1]-s[1] });
			break;
	}

}


















