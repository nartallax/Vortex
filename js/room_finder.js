/* в этом файле - штука, которая анализирует свободность аудиторий
	надо бы её как-то совместить с анализатором проблем, но пока не знаю, как. будет вот так пока что*/
var roomFinder = (function(){

	var finder = function(building){
		var filterByBuilding = typeof(building) === 'number';
		
		var roomStates = {}, room;
		for(var i in commonData.rooms)
			if(!filterByBuilding || commonData.rooms[i].building === building)
				roomStates[i] = {};
		
		for(var i in shedule.lessons)
			if(room = roomStates[shedule.lessons[i].room])
				room[shedule.lessons[i].slot] = true;
			else if(shedule.lessons[i].room === 206)
				console.log(shedule.lessons[i].room);
		
		var result = {};
		for(var i in roomStates)
			for(var j in commonData.slots)
				if(!roomStates[i][j]){
					result[i] = roomStates[i];
					break;
				}
				
		return result;
	}
	
	return finder;

})();