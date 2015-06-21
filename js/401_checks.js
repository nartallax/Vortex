/* набор проверок, которые используются для анализа расписания */

(function(){

	var capitalizeFirst = function(str){
		return str.charAt(0).toUpperCase() + str.substr(1);
	}
	
	var forEachLessonPair = function(target, action){
		for(var i in target.lessons)
			for(var j in target.lessons)
				if(i > j)
					action(target.lessons[i], target.lessons[j]);
	}

	var realLector = function(id){
		if(!id) return false;
		var lector = getLectorById(id);
		return lector && (lector.surname || lector.name || lector.patronym) && lector.looting_info && lector.looting_info.value != '000000'? lector: false;
	}
	
	var realRoom = function(id){	
		if(!id) return false;
		var room = getRoomById(id);
		return room && room.name !== 'Неопознанная аудитория'? room: false;
	}
	
	var normalizeName = function(str){
		return str.replace(/[\s.,:;-]/g,'').toLowerCase();
	}
	
	var roomsEqual = function(a, b){
		if(a === b) return true;
		a = getRoomById(a);
		b = getRoomById(b);
		return normalizeName(a.name) === normalizeName(b.name) && (a.building === b.building && normalizeName(getBuildingById(a.building)) === normalizeName(getBuildingById(b.building)));
	}
	
	var cohortsToString = function(cohorts){
		switch(cohorts.length){
			case 0: return 'у неизвесных групп';
			case 1: return 'у группы ' + getCohortById(cohorts[0]).name;
			default:
				var result = 'у групп ';
				for(var i = 0; i < cohorts.length; i++){
					if(i !== 0) result += ', ';
					result += getCohortById(cohorts[i]).name;
				}
				return result;
		}
	}
	
	var getCommonCohorts = function(a, b){
		var result = [], table = {};
		for(var i in a.cohorts)
			for(var j in b.cohorts)
				if(a.id === b.id && !table[a.id])
					result.push(table[a.id] = a.id);
		return result;
	}
	
	var lectorToString = function(lector){
		if(!(lector = realLector(lector))) return 'неизвестный преподаватель';
		return lector.surname + (lector.name? ' ' + lector.name.charAt(0).toUpperCase() + '.':'') + (lector.patronym? ' ' + lector.patronym.charAt(0).toUpperCase() + '.':'')
		
	}
	
	var extractTableCol = function(table, colName){
		var result = [];
		for(var i in table)
			result.push(table[i][colName]);
		return result;
	}
	
	analyser.registerCheck({
		severity: 3,
		name: 'Занятия в одной аудитории в одно время',
		getMessage: function(data){
			return 	'В аудитории ' + getRoomById(data.room).name + 
					', по ' + slotToString(getSlotById(data.slot)) + 
					' одновременно пары по "' + getSubjectById(data.subject_a).name + 
					'" (' + cohortsToString(data.cohorts_a) + 
					', ведет ' + lectorToString(data.lector_a) + 
					') и по "' + getSubjectById(data.subject_b).name + 
					'" (' + cohortsToString(data.cohorts_b) + 
					', ведет ' + lectorToString(data.lector_b) + 
					').'
		}, 
		apply: function(target){
			var result = [];
			forEachLessonPair(target, function(a, b){
				if(a.slot && a.slot === b.slot && realRoom(a.room) && roomsEqual(a.room, b.room) && a.lector !== b.lector)
					result.push({
						room: a.room, 
						slot: a.slot, 
						subject_a: a.subject, 
						subject_b: b.subject, 
						lector_a: a.lector,
						lector_b: b.lector,
						cohorts_a: extractTableCol(a.cohorts, 'cohort'),
						cohorts_b: extractTableCol(b.cohorts, 'cohort')});
			});
			return result;
		}
	});
	
	analyser.registerCheck({
		severity: 3,
		name: 'Занятия у одного преподавателя в одно время',
		getMessage: function(data){
			return 	'Преподаватель ' + lectorToString(data.lector) + 
					' ведет одновременно занятие по "' + getSubjectById(data.subject_a).name +
					'" (' + cohortsToString(data.cohorts_a) + 
					', в аудитории ' + getRoomById(data.room_a).name + 
					') и по "' + getSubjectById(data.subject_b).name +
					'" (' + cohortsToString(data.cohorts_b) + 
					', в аудитории ' + getRoomById(data.room_b).name + 
					') по ' + slotToString(getSlotById(data.slot))
					+ '.';
		}, 
		apply: function(target){
			var result = [];
			forEachLessonPair(target, function(a, b){
				if(a.slot && a.slot === b.slot && a.lector === b.lector && realLector(a.lector) && !roomsEqual(a.room, b.room))
					result.push({
						lector: a.lector,
						slot: a.slot, 
						subject_a: a.subject, 
						subject_b: b.subject, 
						room_a: a.room, 
						room_b: a.room, 
						cohorts_a: extractTableCol(a.cohorts, 'cohort'),
						cohorts_b: extractTableCol(b.cohorts, 'cohort')});
			});
			return result;
		}
	});
	
	analyser.registerCheck({
		severity: 3,
		name: 'Занятия у одной группы в одно время',
		getMessage: function(data){
			return	capitalizeFirst(cohortsToString(data.cohorts)) +
					' по ' + slotToString(getSlotById(data.slot)) + 
					' занятия в аудитории ' + getRoomById(data.room_a).name + 
					' по "' + getSubjectById(data.subject_a).name + 
					' (ведет ' + lectorToString(data.lector_a) + 
					') и в аудитории ' + getRoomById(data.room_b).name + 
					' по "' + getSubjectById(data.subject_b).name + 
					' (ведет ' + lectorToString(data.lector_b) + 
					').'
		}, 
		apply: function(target){
			var result = [];
			forEachLessonPair(target, function(a, b){
				if(a.slot && a.slot === b.slot){
					var commonCohorts = getCommonCohorts(a, b);
					if(commonCohorts.length > 0)
						result.push({
							cohorts: commonCohorts,
							slot: a.slot,
							subject_a: a.subject, 
							subject_b: b.subject, 
							room_a: a.room, 
							room_b: a.room, 
							lector_a: a.lector,
							lector_b: b.lector});
				}
			});
			return result;
		}
	});
})();