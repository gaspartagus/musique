
var now = new Date().getTime();

console.log(now);

var aggregation = [
  {
    $match: {
      $and: [
        { $or: [ {subtitleLbl: { $regex: 'musi', $options: 'i'}}, {subtitleLbl: { $regex: 'concert', $options: 'i'} }] },
        { startDate : { $gte: now } }
      ]
    }
  },
  {
    $sort : { startDate : 1 }
  },
  {
    $group: {
      _id : "$progId",
      nb : { $sum : 1 },
      titleLbl: { $first: "$titleLbl"},
      subtitleLbl: { $first: "$subtitleLbl"},
      shortSummary: { $first: "$shortSummary"},
      summary: { $first: "$summary"},
      startDate: { $first: '$startDate'},
      endDate: { $first: '$endDate'},
      name: { $first: '$name'}
    }
  }
];

module.exports = {
  music: aggregation
}


