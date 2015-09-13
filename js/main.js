// базовая клиентская соль
Keccak.setSalt("708CC6F85A50A35FCC0F179B2437B51154127BD1CBF471114D254CBCEEED95D89DFB0AA7445254E6684C30DF97594D73E4AD432E19D250DEFA93822026E6B733");

var fallSemesterLength = 23, // длина осеннего семестра в неделях
	weeksInYear = 54;

var daysInWeek = 7,
	secondsInMinute = 60, 
	secondsInHour = secondsInMinute * 60, 
	secondsInDay = secondsInHour * 24, 
	secondsInWeek = secondsInDay * daysInWeek,
	weekZero = new Date(2000, 7, 28).getTime() / 1000; // таймстамп начала первой учебной недели в 2000м

// немного лингвистики
var cases, genders, dayNames, oddityNames, lessonTypeNames, dayShortenings, monthNames, occuring;
(function(){
	cases = {nominative: 0, genitive: 1, dative: 2, accusative: 3, ablative: 4, prepositional: 5};
	genders = {masculine: 0, feminine: 1, neuter: 2};
	
	dayShortenings = ['пн','вт','ср','чт','пт','сб','вс'];
	dayNames = [
		{cases: ['понедельник',	'понедельника',	'понедельнику',	'понедельник',	'понедельником','понедельнике'],
			gender:	genders.masculine},
		{cases: ['вторник',		'вторника',		'вторнику',		'вторник',		'вторник',		'вторнике'],
			gender: genders.masculine},
		{cases: ['среда', 		'среды', 		'среде', 		'среду', 		'средой', 		'среде'],
			gender: genders.feminine},
		{cases: ['четверг', 	'четверга', 	'четвергу', 	'четверг', 		'четвергом', 	'четверге'],
			gender: genders.masculine},
		{cases: ['пятница', 	'пятницы', 		'пятнице', 		'пятницу', 		'пятницей', 	'пятнице'],
			gender: genders.feminine},
		{cases: ['суббота', 	'субботы', 		'субботе', 		'субботу', 		'субботой', 	'субботе'],
			gender: genders.feminine},
		{cases: ['воскресенье', 'воскресенья', 	'воскресенью', 	'воскресенье', 	'понедельником', 'понедельнике'],
			gender: genders.neuter},
	];
	
	monthNames = [
		['январь',	'января',	'январю',	'январь',	'январем',	'январе'	],
		['февраль',	'февраля',	'февралю',	'февраль',	'февралем',	'феврале'	],
		['март',	'марта',	'марту',	'март',		'мартом',	'марте'		],
		['апрель',	'апреля',	'апрелю',	'апрель',	'апрелем',	'апреле'	],
		['май',		'мая',		'маю',		'май',		'маем',		'мае'		],
		['июнь',	'июня',		'июню',		'июнь',		'июнем',	'июне'		],
		['июль',	'июля',		'июлю',		'июль',		'июлем',	'июле'		],
		['август',	'августа',	'августу',	'август',	'августом',	'августе'	],
		['сентябрь','сентября',	'сентябрю',	'сентябрь',	'сентябрем','сентябре'	],
		['октябрь',	'октября',	'октябрю',	'октябрь',	'октябрем',	'октябре'	],
		['ноябрь',	'ноября',	'ноябрю',	'ноябрь',	'ноябрем',	'ноябре'	],
		['декабрь',	'декабря',	'декабрю',	'декабрь',	'декабрем',	'декабре'	]
	];
	
	oddityNames = [
		[['четный', 'нечетный'],	['четная', 'нечетная'],	['четное', 'нечетное']], 
		[['четного', 'нечетного'],	['четной', 'нечетной'],	['четного', 'нечетного']],
		[['четному', 'нечетному'],	['четной', 'нечетной'],	['четному', 'нечетному']],
		[['четный', 'нечетный'],	['четную', 'нечетную'],	['четное', 'нечетное']],
		[['четным', 'нечетныс'],	['четной', 'нечетной'],	['четным', 'нечетным']],
		[['четном', 'нечетном'],	['четной', 'нечетной'],	['четным', 'нечетным']]
	];
	
	lessonTypeNames = {
		is_lab: {cases: ['лабораторная', 'лабораторной', 'лабораторной', 'лабораторную', 'лабораторной', 'лабораторной'], gender: genders.feminine},
		is_lec: {cases: ['лекция', 'лекции', 'лекции', 'лекцию', 'лекцией', 'лекции'], gender: genders.feminine},
		is_prk: {cases: ['практика', 'практики', 'практике', 'практику', 'практикой', 'практике'], gender: genders.feminine},
		is_srs: {cases: ['СРС', 'СРС', 'СРС', 'СРС', 'СРС', 'СРС'], gender: genders.feminine},
		is_etc: {cases: ['занятие', 'занятия', 'занятию', 'занятие', 'занятием', 'занятии'], gender: genders.neuter},
	};
	
	occuring = {}
	occuring[genders.neuter] = ['проходящее','проходящего','проходящему','проходящее','проходящим','проходящем'];
	occuring[genders.feminine] = ['проходящая','проходящей','проходящую','проходящую','проходящей','проходящей'];
	occuring[genders.masculine] = ['проходящий','проходящего','проходящему','проходящего','проходящим','проходящем'];
})();

var resolveFunction = function(dataSource){ return function(id){ return dataSource[id]; } }
var commonMatchFunction = function(getDataSource){

	var rsens = {'К':/K/g, 'Н':/H/g, 'В':/B/g, 'Т':/T/g},
		rinsens = {'а':/a/g, 'у':/y/g, 'е':/e/g, 'х':/x/g, 'с':/c/g, 'о':/o/g, 'р':/p/g};

	var fuzzyTransform = function(str){
		str = str.replace(/[^а-яА-ЯёЁ\da-zA-Z]/g, '');
		for(var k in rsens) str = str.replace(rsens[k], k);
		str = str.toLowerCase();
		for(var k in rinsens) str = str.replace(rinsens[k], k);
		return str;
	}

	return function(data){
		switch(typeof(data)){
			case 'string':
			case 'number':
				data = '' + data;
				break;
			default: return null;
		}
	
		var dataSource = getDataSource(),
			fdata = fuzzyTransform(data),
			i, item;
		for(i in dataSource){
			item = dataSource[i];
			if(item.looting_info.is_regexp){
				if(data.match(new RegExp(item.looting_info.value)))
					return item.id;
			} else if(item.looting_info.fuzzy){
				if(fdata === fuzzyTransform(item.looting_info.value))
					return item.id;
			} else if(data === item.looting_info.value)
				return item.id;
		}
		return null;
	}
}
var genericEntityToStringFunction = function(func, requiredPropName, getById){
	
	var resultFunc = function(data, nameCase){
		nameCase = nameCase || 'nominative';
		var dtype = typeof(data);
		if(dtype === 'object' && data[requiredPropName] === undefined){ // as array
			var result = '';
			
			data.each(function(r){
				var subResult = resultFunc(r);
				if(!subResult) return;
				if(result) result += ', ';
				result += subResult;
			});
			
			return result;
		}
		
		if(dtype === "string" && parseInt(data).toString() === data){
			data = parseInt(data);
			dtype = 'number';
		}
		if(dtype === 'number') data = getById(data);
		
		if(!data || data[requiredPropName] === undefined)  return '';
		
		return func(data, nameCase);
		
	}
	
	return resultFunc;
	
}

// объекты-компаньоны для некоторых сущностей
var room = {
	toString: genericEntityToStringFunction(function(data){
		var result = data.name;
		if(data.building){
			var b = db.data.building[data.building];
			if(b) result += ' (' + building.toString(b) + ')';
		}
		return result;
	}, 'name', function(id){ return db.data.room[id] }),
	toStringShort: genericEntityToStringFunction(function(data){
		var result = data.name;
		if(data.building){
			var b = db.data.building[data.building];
			if(b) result += ' (' + building.toString(b).shorten() + ')';
		}
		return result;
	}, 'name', function(id){ return db.data.room[id] }),
	match: commonMatchFunction(function(){ return db.data.room })
}
var building = {
	toString: genericEntityToStringFunction(function(data){ return data.name }, 
		'name', function(id){ return db.data.building[id] }),
	match: commonMatchFunction(function(){ return db.data.building })
}
var lector = {
	toString: genericEntityToStringFunction(function(data){ 
		var result = '';
		if(data.surname && data.name) result = data.surname + ' ' + data.name.substr(0, 1).toUpperCase() + '.';
		else if(data.name) result = data.name;
		else return data.patronym || '';
		if(data.patronym) result += data.patronym.substr(0, 1).toUpperCase() + '.';
		return result;
	}, 'name', function(id){ return db.data.lector[id] }),
	toStringFull: genericEntityToStringFunction(function(data){ 
		var result = '';
		if(data.surname) result = data.surname;
		if(data.name) result += (result? ' ':'') + data.name;
		if(data.patronym) result += (result? ' ':'') + data.patronym;
		return result;
	}, 'name', function(id){ return db.data.lector[id] }),
	match: commonMatchFunction(function(){ return db.data.lector })
}
var cohort = {
	toString: genericEntityToStringFunction(function(data){ return data.name },
		'name', function(id){ return db.data.cohort[id] }),
	onLesson: {
		toString: genericEntityToStringFunction(function(data){ 
			var result = cohort.toString(data.cohort);
			if(typeof(data.rate) === 'number' && data.rate !== 1)
				result += ' (' + ~~(data.rate * 100) + '%)';
			return result;
		}, 'cohort', function(id){ throw "Cohorts on lessons have no ID."; })
	},
	match: commonMatchFunction(function(){ return db.data.cohort }),
	studyYear: function(id){
		var num = db.data.cohort[id].name.match(/\d+/);
		return !num || num.isEmpty()? 0: ~~(parseInt(num[0]) / 1000);
	}
}
var subject = {
	toString: genericEntityToStringFunction(function(data){ return data.name },
		'name', function(id){ return db.data.subject[id] }),
	match: commonMatchFunction(function(){ return db.data.subject })
}
var slot = {
	toString: function(slots, nameCase){
		if(slots === null || slots === undefined || slots.length === 0) return '';
		
		if(!Array.isArray(slots))
			slots = slots.start_time !== undefined || typeof(slots) !== 'object'? [slots]: slots.toArr();
			
		nameCase = nameCase || 'nominative';
		var res = '',
			broke = slots
				.map(function(val){ return typeof(val) === 'number'? db.data.slot[val]: val })
				.fl(bool)
				.sort(compareByFieldFunction('start_time'))
				.map(slot.break.curry(nameCase))
				.sort(compareByFieldFunction('dow')),
			previousDow = undefined,
			previousOdd = undefined;
			
		broke.each(function(a, ak){
			var b = broke.fl(function(b, bk){ 
				return 	ak !== bk && 
						b.dow === a.dow && 
						b.starth === a.starth && 
						b.startm === a.startm && 
						b.dur === a.dur}).first();
			if(b){
				if(a.odd) return;
				if(res) res += ', '
				res += (previousDow !== a.dow? a.str.dow + ' ': '') + a.str.time
				previousOdd = undefined;
			} else {
				if(res) res += ', '
				if(previousDow === a.dow && previousOdd === a.odd)
					res += a.str.time;	
				else
					res += a.str.odd + ' ' + a.str.dow + ' ' + a.str.time
				previousOdd = a.odd;
			}
			previousDow = a.dow;
		});
		
		
		
		return res;
	},
	formatTime: function(secs, accuracy){
	
		var toTwoDigits = function(val){ return (val >= 10? '': '0') + val };
			result = '';
		
		if(!accuracy) accuracy = 'minutes';
		if(accuracy !== 'seconds') secs = ~~(secs / 60);
		if(accuracy === 'hours') secs = ~~(secs / 60);
		switch(accuracy ){
			case 'seconds':		
				result = ':' + toTwoDigits(secs % 60) + result;
				secs = ~~(secs / 60);
			case 'minutes':
				result = ':' + toTwoDigits(secs % 60) + result;
				secs = ~~(secs / 60);
			case 'hours':
				result = (secs % 24) + result;
				secs = ~~(secs / 24);
		}
		
		return result;
	},
	break: function(nameCase, s){
		if(!s) return null;
		nameCase = cases[nameCase || 'nominative'];
		var result = slot.breakSimple(s);
		result.str = {};
		
		result.str.dow = dayNames[result.dow].cases[nameCase];
		result.str.odd = oddityNames[nameCase][dayNames[result.dow].gender][result.odd? 1: 0];
		
		result.str.starth = result.starth.toString();
		result.str.startm = (result.startm < 10? '0':'') + result.startm;
		result.str.endh = result.endh.toString();
		result.str.endm = (result.endm < 10? '0':'') + result.endm;
		
		result.str.time = 'c ' + result.str.starth + ':' + result.str.startm + ' до ' + result.str.endh + ':' + result.str.endm;
		
		return result;
	},
	breakSimple: function(slot){
		if(!slot) return null;
		var result = {dur: slot.duration, id: slot.id};
		slot = slot.start_time;
		
		result.duration = result.dur;
		result.start_time = slot;
		
		result.day = (~~(slot / secondsInDay)) % 7;
		result.gap = (slot % secondsInDay) + ':' + result.dur;
		result.odd = (slot / secondsInWeek) >= 1;
		
		result.dow = result.day; // just alias
		slot %= secondsInWeek;
		
		slot %= secondsInDay;
		result.starth = ~~(slot / secondsInHour);
		result.startm = slot % secondsInHour;
		result.endm = result.startm + result.dur;
		result.endh = result.starth + (~~(result.endm / secondsInHour));
		
		result.endm = (result.endm % secondsInHour) / secondsInMinute;
		result.startm /= secondsInMinute;
		
		return result;
	},
	inDay: function(){ return db.data.slot.fl(function(s){ return s.start_time < secondsInDay }) },
	asWeekTableGaps: function(){
		return slot.inDay().spawn(function(res, s){
			s = slot.break(undefined, s);
			res[s.start_time + ':' + s.duration] = s.str.time
			return res;
		}, {});
	},
	asWeekTableNumberedGaps: function(){
		return slot.inDay().spawn(function(res, s){
			res[s.start_time + ':' + s.duration] = slot.numberInDay(s) + 1
			return res;
		}, {});
	},
	startTimes: function(){
		var result = {};
		db.data.slot.each(function(s){
			var broke = slot.break(null, s),
				time = broke.str.starth + ':' + broke.str.startm;
			result[time] = broke.start_time % secondsInDay;
		});
		return result.toReverseAssoc();
	},
	endTimes: function(){
		var result = {};
		db.data.slot.each(function(s){
			var broke = slot.break(null, s),
				time = broke.str.endh + ':' + broke.str.endm;
			result[time] = (broke.start_time + broke.duration) % secondsInDay;
		});
		return result.toReverseAssoc();
	},
	days: function(){
		return db.data.slot.spawn(function(res, s){
			var broke = slot.break(null, s);
			res[broke.day] = broke.str.dow;
			return res;
		}, {});
	},
	match: function(data){
		if(!data) return null;
		if(data.duration !== undefined && data.start_time !== undefined){
			var ent = db.data.slot
				.flfield('duration', data.duration)
				.flfield('start_time', data.start_time)
				.first();
			if(ent) return ent.id;
		}
		if(data.day !== undefined && data.gap !== undefined && data.odd !== undefined){
			var ent = db.data.slot
				.map(slot.breakSimple)
				.flfield('odd', data.odd)
				.flfield('gap', data.gap)
				.flfield('day', data.day)
				.first();
			if(ent) return ent.id;
		}
		return undefined;
	},
	lectorPreconceived: function(data){ 
		if(!data) data = db.data.preference;
	
		var result = data
			.fl(function(d){ return Array.isArray(d) && !d.isEmpty() && typeof(d.first().slot) === 'number' })
			.first(); 
			
		return result? result: data.fl(function(d){ return Array.isArray(d) }).first();
	},
	numberInDay: function(sl){ // номер пары за день, считая с нуля
		if(typeof(sl) === 'number' || typeof(sl) === 'string') sl = db.data.slot[sl];
		var dayStart = slot.breakSimple(sl).day * secondsInDay, startTime = sl.start_time % secondsInWeek;
		return db.data.slot.fl(function(s){ 
			if(s.start_time > secondsInWeek) return false;
			var endTime = s.start_time + s.duration;
			return endTime >= dayStart && endTime < startTime;
		}).size();
	},
	complementary: function(s){
		if(typeof(s) === 'number' || typeof(s) === 'string') s = db.data.slot[s];
		return slot.match({
			duration: s.duration, 
			start_time: s.start_time > secondsInWeek? s.start_time - secondsInWeek: s.start_time + secondsInWeek
		});
	},
	current: function(){
		var sec = ((~~(timestamp() / 1000)) - weekZero) % (secondsInWeek * 2),
			s = db.data.slot.fl(function(s){ return s.start_time <= sec && s.start_time + s.duration >= sec; }).first();
		if(!s) return null;
		var week = getCompleteWeekNumber();
		return slot.breakSimple(s).odd !== ((week % 2) === 1)? db.data.slot[slot.complementary(s)]: s;
	},
	inDailyInterval: function(start, end){
		var result = [];
		for(var i = 0; i < daysInWeek * 2; i++)
			result.addAll(slot.inInterval(start + (secondsInDay * i)), end + (secondsInDay * i));
		return result;
	},
	inInterval: function(start, end){
		return db.data.slot
			.fl(function(s){
				return 	((s.start_time <= start) && (s.start_time + s.duration >= start)) ||
						((s.start_time <= end) && (s.start_time + s.duration >= end));
			}).map(function(s){ return s.id });
	}
}
var lesson = {
	mergeNotes: function(lesson){
		if(!lesson.notes || lesson.notes.isEmpty())
			delete lesson.note;
		else
			lesson.note = lesson.notes.join('\n');
		return lesson;
	},
	glueBySlot: function(lessons){

		return lessons.toAssoc().divideBy('slot').spawn(function(rArr, lessons){
		
			var resultLesson = lessons.spawn(function(result, lesson){
			
				if(result) {
					result.cohorts.addAll(lesson.cohorts);
					
					if(lesson.notes) result.ids.addAll(lesson.notes);
					else result.notes.push(lesson.note);
					
					if(lesson.ids) result.ids.addAll(lesson.ids);
					else result.ids.push(lesson.id);
				} else {
					result = lesson;
					result.ids = result.ids || [result.id];
					result.notes = result.notes || [result.note];
					
					delete result.id;
					delete result.note;
				}
				
				return result;
			}, null);
		
			resultLesson.cohorts = resultLesson.cohorts.uniq();
			resultLesson.notes = resultLesson.notes.fl(bool).uniq();
		
			return rArr.add(resultLesson);
			
		}, []);
	},
	glueByCohorts: function(lessons){
		
		var i, result = [], lesson, lcohorts;
		
		lessons = lessons.toAssoc();
		
		while(!lessons.isEmpty()){
		
			lesson = lessons.pop();
		
			lesson.ids = lesson.ids || [lesson.id];
			lesson.slots = lesson.slots || (lesson.slot !== undefined? [lesson.slot]: []);
			lesson.notes = lesson.notes || (lesson.note? [lesson.note]: []);
			
			delete lesson.slot;
			delete lesson.id;
			delete lesson.note;
			
			lcohorts = lesson.cohorts.hashSort();
			
			lessons.fl(function(v){
				return v.cohorts.hashSort().equals(lcohorts);
			}).each(function(testLesson, k){
				delete lessons[k];
				lesson.slots.push(testLesson.slot);
				if(testLesson.ids) lesson.ids = lesson.ids.concat(testLesson.ids);
				else lesson.ids.push(testLesson.id);
				
				if(testLesson.notes) lesson.notes.addAll(testLesson.notes);
				else if(testLesson.note) lesson.notes.push(testLesson.note);
			});
			
			result.push(lesson);
		}
		return result;
	},
	sortIds: function(l){ l.ids = l.ids.sort(); },
	glueSlots: function(lessons){
		return lessons.divideBy('subject').map(function(v){
			return v.divideBy('lector').map(function(v){ 
				return v.divideBy('room').map(function(v){
					return v.divide(lesson.getTypeOf).map(function(v){
						return lesson.glueByCohorts(v);
					});
				});
			});
		}).flatten().flatten().flatten().flatten().each(lesson.sortIds);
	},
	glueOddEven: function(lessons){
		var slotless = lessons.fl(function(l){ return !bool(db.data.slot[l.slot]) }).each(function(l){
			l.slots = [];
			delete l.slot;
		});
		lessons = lessons.fl(function(l){ return bool(db.data.slot[l.slot]) });
		
		return lessons.hashSortRecursive().spawn(function(res, l){
			
			l = l.cloneFacile();
			var ids = l.ids,
				sid = l.slot,
				ls = slot.breakSimple(db.data.slot[l.slot]),
				note = l.note,
				notes = l.notes;
			delete l.ids;
			delete l.id;
			delete l.slot;
			delete l.notes;
			delete l.note;
			
			var pair = lessons.fl(function(pair){
				pair = pair.cloneFacile();
				var s = slot.breakSimple(db.data.slot[pair.slot]), 
					psid = pair.slot, 
					note = pair.note, 
					notes = pair.notes,
					id = pair.id,
					ids = pair.ids;
				delete pair.ids;
				delete pair.id;
				delete pair.slot;
				delete pair.note;
				delete pair.notes;
				var eq = s.day === ls.day && s.gap === ls.gap && s.odd !== ls.odd && pair.equals(l);
				pair.slot = psid;
				pair.note = note;
				pair.notes = notes;
				pair.id = id;
				pair.ids = ids;
				return eq;
			}).first();
			
			if(!ids) ids = [id];
			if(!notes) notes = note? [note]: [];
			
			if(!pair) {
				l.slots = [sid];
				l.ids = ids;
				l.notes = notes;
				return res.add(l);
			}
			
			if(ls.odd) return res; // no modification
			
			l.slots = [sid, pair.slot];
			
			if(pair.ids) l.ids = ids.concat(pair.ids);
			else l.ids = ids.add(pair.id);
			
			if(pair.notes) l.notes = notes.addAll(pair.notes);
			else l.notes = notes.push(pair.note);
			
			l.notes = l.notes.fl(bool).uniq();
			
			return res.add(l);
		}, []).concat(slotless);
	},
	glueCohorts: function(lessons){
		return lessons.divideBy('subject').map(function(v){
			return v.divideBy('lector').map(function(v){ 
				return v.divideBy('room').map(function(v){
					return v.divide(lesson.getTypeOf).map(function(v){
						return lesson.glueBySlot(v);
					});
				});
			});
		}).flatten().flatten().flatten().flatten().each(lesson.sortIds);
	},
	glue: function(lessons){ return lesson.glueSlots(lesson.glueCohorts(lessons.cloneDeep())) },
	get: function(id){
		for(var i in db.data.schedule)
			if(db.data.schedule[i].lessons && db.data.schedule[i].lessons[id])
				return db.data.schedule[i].lessons[id];
		return undefined;
	},
	toString: genericEntityToStringFunction(function(l, nameCase){

		var ltype_id = lesson.getTypeOf(l),
			ltype = lesson.typeToString(l, nameCase),
			lsubject = l.subject? ' по предмету "' + subject.toString(l.subject) + '"': '',
			lcohorts = (l.cohorts && l.cohorts.length)? ' у ' + cohort.onLesson.toString(l.cohorts): '',
			lroom = l.room? ' в аудитории ' + room.toString(l.room): '',
			lslot = l.slot? ', ' + occuring[lessonTypeNames[ltype_id].gender][cases[nameCase]] + ' в ' + slot.toString(l.slot, 'accusative'): '';
			
		if(lsubject.length > 50) lsubject = lsubject.substr(0, 48) + '..."';
		return ltype + lsubject + lcohorts + lroom + lslot;
	}, 'id', function(id){ return lesson.get(id); }),
	getTypeOf: function(l){
		return 	l.is_lab? 	'is_lab':
				l.is_lec? 	'is_lec': 
				l.is_prk? 	'is_prk': 
				l.is_srs? 	'is_srs':
							'is_etc';
	},
	typeToString: function(l, nameCase){
		nameCase = cases[nameCase || 'nominative'];
		if(typeof(l) === 'string'){
			var tmp = {};
			tmp[l] = true;
			l = tmp;
		}
		return 	l.is_lab? 	lessonTypeNames.is_lab.cases[nameCase]:
				l.is_lec? 	lessonTypeNames.is_lec.cases[nameCase]: 
				l.is_prk? 	lessonTypeNames.is_prk.cases[nameCase]: 
				l.is_srs? 	lessonTypeNames.is_srs.cases[nameCase]:
							lessonTypeNames.is_etc.cases[nameCase];
	},
	basicChanged: function(l){
		return l.altered && (
			(l.altered.lector !== l.lector) ||
			(!l.altered.cohorts.equal(l.cohorts)) || 
			(l.altered.subject !== l.subject) || 
			(lesson.getTypeOf(l.altered) !== lesson.getTypeOf(l))
		);
	},
	displaySlotChanged: function(l){
		return l.altered && (
			(l.altered.room !== l.room) ||
			(l.altered.slot !== l.slot) ||
			(l.altered.unexistent !== l.unexistent) ||
			(l.altered.deleted !== l.deleted)
		);
	},
	virtualAlteredsToPlain: function(ls){
		return ls.cloneDeep().spawn(function(res, l){
			if(!l.altered) return res.add(l);
			
			var alt = l.altered, cur = l, bc = lesson.basicChanged(l), sc = lesson.displaySlotChanged(l);
			
			cur.baseLesson = alt.baseLesson = l.cloneDeep();
			delete l.altered;
			
			if(bc) alt.basicChanged = cur.basicChanged = true;
			
			if(sc){
				alt.isNewLesson = true;
				cur.isOldLesson = true;
				res.push(alt);
				res.push(cur);
			} else {
				res.push(cur);
			}
			
			return res;
		}, []).fl(function(l){ return !(l.unexistent || l.deleted) });
	}
}
var schedule = {
	main: function(){ return db.data.schedule.flfield('is_main', true).first(); },
	toString: genericEntityToStringFunction(function(s){
		var result = s.name;
		if(s.is_main) result += ' (главное)';
		return result;
	}, 'id', resolveFunction(db.data.schedule)),
	getPropositionChangesets: function(schedule){
		return schedule.changesets
			.flfield('is_external', false)
			.flfield('is_published', false)
			.toArr()
			.sort(compareByFieldFunction('application_date'));
	},
	getAppliedChangesets: function(sched){
		var day = schedule.dayOfDate(sched);
		return sched.changesets
			.flfield('is_published', true)
			.fl(function(cset){ return cset.application_date <= day; })
			.toArr()
			.sort(compareByFieldFunction('application_date'));
	},
	dayOfDate: function(schedule, tstamp){
		if(!tstamp) {
			tstamp = new Date().getTime();
			tstamp = tstamp - (tstamp % 1000);
		}
		
		return ~~((tstamp - schedule.creation_date)/ secondsInDay);
	},
	getActualLessons: function(sched){
		var lessons = sched.lessons,
			updateLessonsBy = function(c){ lessons = change.applyTo(c, lessons); }
		schedule.getAppliedChangesets(sched).each(function(cset){ cset.changes.each(updateLessonBy); });
		return lessons;
	}
}
var preference = {
	toString: genericEntityToStringFunction(function(d){
		switch(d.type){
			case 'merge_cohorts':
				return 'Совмещать группу ' + cohort.toString(d.cohort_a) + ' с группой ' + cohort.toString(d.cohort_b) + ' на занятиях по "' + subject.toString(d.subject) + '"';
			case 'split_cohort':
				return 'Разделять группу ' + cohort.toString(d.cohort) + ' на ' + d.parts + ' равных части на занятиях по "' + subject.toString(d.subject) + '"';
			case 'room_to_subject':
				return 'Вести "' +  subject.toString(d.subject) + '" в аудитории ' + room.toString(d.room);
			default: return '';
		}
	}, 'schedule', resolveFunction(db.data.schedule)),
	slotsToWeekTableData: function(slots){
		return slots.map(function(d){
			var res = slot.breakSimple(db.data.slot[d.slot]);
			res.day = res.day + '';
			res.value = d.value;
			return res;
		})				
	},
	toList: function(set){
		return set.map(preference.toString);
	}
}
var observation = {
	ofPrefs: function(){ 
		var obs = db.data.preference.fl(function(d){ return !Array.isArray(d) && d.type === undefined; }).first(); 
		if(obs) return obs;
		obs = {};
		if(!Array.isArray(db.data.preference) && db.data.preference.isEmpty())
			db.data.preference = [];
		db.data.preference.push(obs);
		return obs;
	}
};
var change = {
	counter: -1,
	toString: function(c, withProposer, withPropDate, withNote){
	
		if(arguments.length < 4) withNote = true;
		if(arguments.length < 2) withProposer = false;
		if(arguments.length < 3) withPropDate = withProposer;
		if(arguments.length < 1) return '';
	
		var l = c.lesson? lesson.get(c.lesson): undefined, result;

		switch(c.type){
			case 'alter_slot':
				result = 'перенести ' + lesson.toString(l, 'accusative') + ' на ' + slot.toString(c.new_val);
				break;
			case 'add_cohort':
				result = 'добавить ' + (c.rate * 100) + '% учеников группы ' + cohort.toString(c.cohort) + ' на ' + lesson.toString(l, 'accusative');
				break;
			case 'remove_cohort':
				result = 'убрать группу ' + cohort.toString(c.cohort) + ' с ' + lesson.toString(l, 'genitive');
				break;
			case 'alter_cohort':
				result = 'изменить процент учеников группы ' + cohort.toString(c.cohort) + ' на ' + (c.new_val * 100) + ' на ' + lesson.toString(l, 'genitive');
				break;
			case 'alter_type':
				result = 'изменить тип занятия на "' + lesson.typeToString(c.new_val) + '" для ' + lesson.toString(l, 'genitive');
				break;
			case 'alter_room':
				result = ' переместить ' + lesson.toString(l, 'accusative') + ' в аудиторию ' + room.toString(c.new_val);
				break;
			case 'delete':
				result = 'удалить ' + lesson.toString(l, 'accusative');
				break;
			case 'create':
				result = 'создать ' + lesson.toString(c, 'accusative');
				break;
			case 'alter_lesson_lector':
				result = 'передать ' + lesson.toString(l, 'accusative') + ' на преподавателя ' + lector.toString(c.lector);
				break;
			case 'alter_subject_lector':
				result = 'передать предмет "' + subject.toString(c.subject) + '" на преподавателя ' + lector.toString(c.lector);
				break;
			default:
				return '';
		}
		
		if(withNote && c.note) result += '; примечание: ' + c.note
		if(withProposer && c.proposer) {
			var date = '';
			if(withPropDate){
				date = new Date();
				date.setTime(c.creation_date * 1000);
				date = ' в ' + date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
			}
			result = lector.toString(c.proposer) + date + ' предложил ' + result;
		}
		return result;
	},
	applyCommon: function(c, l){
		switch(c.type){
			case 'alter_slot': 			l.slot = c.new_val; break;
			case 'add_cohort': 			l.cohorts.push({rate:c.rate, cohort: c.cohort}); break;
			case 'remove_cohort':		l.cohorts.splice(parseInt(l.cohorts.toAssoc().flfield('cohort',c.cohort).toReverseAssoc().first()), 1);  break;
			case 'alter_cohort':		l.cohorts.toAssoc().flfield('cohort', c.cohort).first().rate = c.new_val; break;
			case 'alter_type':
				delete l[lesson.getTypeOf(l)];
				l[c.new_val] = true;
				break;
			case 'alter_room':			l.room = c.new_val; break;
			case 'delete':				l.disabled = true; break;
			case 'alter_lesson_lector':	l.lector = c.lector; break;
			default: throw 'Change of type "' + c.type + '" is not common.';
		}
		return l;
	},
	applyTo: function(c, lessons){
	
		var l = c.lesson? lessons[c.lesson]: null;
	
		switch(c.type){
			case 'alter_slot':
			case 'add_cohort':
			case 'remove_cohort':
			case 'alter_cohort':
			case 'alter_type':
			case 'alter_room':
			case 'delete':
			case 'alter_lesson_lector':
				return change.applyCommon(c, l);
			case 'create':
				c = c.cloneDeep();
				delete c.proposer;
				delete c.type;
				delete c.lesson;
				delete c.creation_date;
				c.id = change.counter--;
				return lessons[c.id] = c;
			case 'alter_subject_lector':return lessons.flfield('subject', c.subject).each(function(l){ l.lector = c.lector; });
			default: return;
		}
	},
	createAltFor: function(l){ return l.altered || (l.altered = l.cloneDeep()); },
	virtualApply: function(c, lessons){
		
		var l = c.lesson? lessons[c.lesson]: null;
	
		switch(c.type){
			case 'alter_slot':
			case 'add_cohort':
			case 'remove_cohort':
			case 'alter_cohort':
			case 'alter_type':
			case 'alter_room':
			case 'delete':
			case 'alter_lesson_lector':
				return change.applyCommon(c, change.createAltFor(l));
			case 'create':
				c = c.cloneDeep();
				delete c.proposer;
				delete c.type;
				delete c.lesson;
				delete c.creation_date;
				c.id = change.counter--;
				var alt = c.cloneDeep();
				c.unexistent = true;
				c.altered = alt;
				return lessons[c.id] = c;
			case 'alter_subject_lector': 
				lessons.fl(function(l){ 
					return l.subject === c.subject || (l.altered && (l.altered.subject === c.subject));
				}).each(function(l){ change.createAltFor(l).lector = c.lector });
				return;
			default: return;
		}
		
	}
};

var showLoadingBlocker = function(){
		var blocker = el('loading-blocker');
		if(!blocker){
			blocker = tag('div', 'text-align:center', 'arial screenlocker', {'data-lock':'0', id:'loading-blocker'});
			blocker.appendChild(tag('div', 'background:#000;opacity:0.85;position:absolute;top:0px;bottom:0px;right:0px;left:0px'));
			blocker.appendChild(tag('div','position:absolute;bottom:60%;width:100%;color:#ddd;font-size:45px', '', 'Загрузка...'));
			blocker.appendChild(tag('div','position:absolute;top:42.5%;width:100%;color:#aaa;font-size:25px', '', 'Данные, необходимые для работы системы, загружаются с сервера. Подождите, пожалуйста.'));
			document.body.appendChild(blocker);
		}
		blocker.setAttribute('data-lock', parseInt(blocker.getAttribute('data-lock')) + 1);
	}, hideLoadingBlocker = function(){
		var blocker = el('loading-blocker');
		if(!blocker) return;
		blocker.setAttribute('data-lock', max(parseInt(blocker.getAttribute('data-lock')) - 1, 0));
	}

conjure.defaultPreprocessor = function(data){
	if(['no_such_function', // считается, что эти коды ошибок нет смысла передавать дальше
		'malformed_input',  // другие коды ошибок могут нести какую-либо дополнительную информацию
		'not_enough_parameters', //...и обрабатываться соответственно ситуации
		'wrong_parameter_type', 
		'not_validated', 
		'server_error', 
		'unknown_error'].hasVal(data.status)){
		popup.alert(
			'В приложении произошла ошибка. Сообщите разработчику, описав ваши действия, предшествующие возникновению ошибки. Код ошибки: ' + data.status, 
			"Ошибка приложения", 
			undefined, 
			{height:275, width:450}
		);
	} else if(data.status === 'not_logged_in'){
		popup.alert(
			'Вы не имеете необходимых привилегий. Возможно, вы долго были неактивны? Попробуйте перезайти. Если это не поможет, то сообщите об ошибке разработчику.', 
			"Недостаточно привилегий", 
			undefined, 
			{height:275, width:450}
		);
	} else this.readyNext(data);
}
conjure.defaultOnFail = function(apiName, data){
	
	popup.alert(
		'Сервер не отвечает, синхронизация невозможна. Попробуйте повторить через некоторое время; если ошибка повторяется, сообщите разработчику, что функция ' + apiName + ' сломалась.',
		'Сервер недоступен',
		undefined,
		{height:275, width:450});
	hideLoadingBlocker();
}
conjure.listen('start', function(){ shreds.synchroIndicator.show() });
conjure.listen('end', function(){ shreds.synchroIndicator.hide() });
var checkOkStatus = function(data){ // функция, используемая иногда при проверке статуса ответа
	if(data.status !== 'ok') return popup.alert('Что-то пошло не так. Возможно, что-то сломалось.');
	this.readyNext(data);
}

var renderTable = function(data){
	var i = -1, j = -1, row, col, cols = [],
		resultTable = tag("table","width:100%"),
		headers = tag("tr");
	resultTable.appendChild(headers);
	
	if(data.isEmpty()) return resultTable;
	
	data.first().each(function(v, k){
		headers.appendChild(tag("th", null, null, k));
		cols.push(k);
	});
	
	var tableRow, str;
	data.each(function(row){
		var tableRow = tag('tr');
		cols.each(function(col){
			var str = typeof(row[col]) === 'object'? JSON.stringify(row[col]): row[col];
			tableRow.appendChild(tag('td', 'border: 1px solid #999', null, str));
		});
		resultTable.appendChild(tableRow);
	});
	
	return resultTable;
}
var renderLessonGrid = function(data, getTDforLessons){
	
	var reverse = function(arr){
		var result = [], i, l = arr.length;
		for(i = l - 1; i >= 0; i--) result.push(arr[i]);
		return result;
	}
	
	var dayOfLesson = function(d){ return slot.breakSimple(db.data.slot[d.slots.first()]).day };
	var haveSplitLessonsIn = function(lessons){
		return lessons
			.divide(dayOfLesson)
			.spawn(function(res, ls){
				return res || ls.spawn(function(rs, l){ return rs || !slotsIsSymmetrical(l.slots)}, false)
			}, false);
	}
	var slotsIsSymmetrical = function(sids){
		if((sids.length % 2) !== 0) return false;
		
		var syms = {};
		sids.map(resolveFunction(db.data.slot))
			.map(function(s){ return s.start_time % secondsInWeek })
			.each(function(s){ syms[s] = !syms[s]; });
			
		return !syms.spawn(function(r, s){ return r || s }, false);
	}
	var renderChunksIntoRow = function(tr, chunked){
	
		days.each(function(d, dayNum){
		
			var chunk = chunked[dayNum] || {odd:[], even:[], both:[]},
				o = chunk.odd, e = chunk.even, b = chunk.both;
		
			if(b.length + o.length + e.length === 0) {
				return tr.appendChild(tag('td', '', 'lesson-grid-table-data-cell lesson-both', {colspan:2}));
			}
		
			if(o.length + e.length === 0){
				var td = getTDforLessons(b);
				td.setAttribute('colspan', 2);
				td.style.width = colWidth;
				td.className += ' lesson-both';
				return tr.appendChild(td);
			}
			
			b.each(function(l){
				var odd = l.cloneDeep(), even = l.cloneDeep();
				odd.slots = even.slots.fl(function(s){ return db.data.slot[s].start_time > secondsInWeek });
				even.slots = even.slots.fl(function(s){ return db.data.slot[s].start_time > secondsInWeek });
				o.push(odd);
				e.push(even);
			});
			
			o = reverse(o);
			e = reverse(e);
			
			var otd = getTDforLessons(o);
			var etd = getTDforLessons(e);
			
			otd.setAttribute('colspan', 1);
			etd.setAttribute('colspan', 1);
			otd.style.width = colWidth;
			etd.style.width = colWidth;
			otd.className += ' lesson-odd';
			etd.className += ' lesson-even';
			
			tr.appendChild(etd);
			tr.appendChild(otd);
			
		});
	
	};
	
	var table = tag('table','width:100%;margin-top:20px', 'arial'), tr,
		days = slot.days();
		
	data = data.cloneDeep().each(function(l){ delete l.id; }).uniq().each(function(l, k){ l.id = parseInt(k); });
	data = lesson.glueOddEven(lesson.glueCohorts(data)).each(lesson.mergeNotes);
	data = data.fl(function(l){ return l.slots.length > 0 });
	
	var dataByDays = data.divide(dayOfLesson);
	
	days = days.fl(function(d, num){ return parseInt(num) < 6 || (dataByDays[num] && dataByDays[num].length > 0) });
	
	var colWidth = (95 / (days.size() * 2)) + '%';
	
	table.appendChild(tr = tag('tr'));
	tr.appendChild(tag('th', 'width:1%', null, 'Пара'));
	tr.appendChild(tag('th', 'width:1%', null, 'Время'));
	days.each(function(d, num){ tr.appendChild(tag('th', '', 'lesson-grid-table-day-cell', d, {colspan:2})) });
	
	table.appendChild(tr = tag('tr'));
	tr.appendChild(tag('th'));
	tr.appendChild(tag('th'));
	days.each(function(){ 
		var odddiv = tag('div','top:25%;width:100%', '', 'нечет'),
			evendiv = tag('div','top:25%;width:100%', '', 'чет'),
			oddrow = tag('th', 'position:relative;width:1%', 'lesson-grid-table-day-cell'),
			evenrow = tag('th', 'position:relative;width:1%', 'lesson-grid-table-day-cell');
		oddrow.appendChild(odddiv);
		evenrow.appendChild(evendiv);
		tr.appendChild(evenrow);
		tr.appendChild(oddrow);
	});
	
	db.data.slot.fl(function(s){ return s.start_time < secondsInDay}).each(function(s){
	
		var numInDay = slot.numberInDay(s), 
			timeStr = slot.break(null, s).str.time,
			lessons = data.fl(function(l){ return slot.numberInDay(db.data.slot[l.slots.first()]) === numInDay; }).toArr(),
			chunked = lessons
				.divide(dayOfLesson)
				.map(function(ls){
					return ls.map(function(l){
						l.isSymmetrical = slotsIsSymmetrical(l.slots);
						l.isOdd = slot.breakSimple(db.data.slot[l.slots.first()]).odd
						return l;
					});
				})
				.map(function(ls){
				/*
					ls = ls.fl(function(l){  // this commented code is here for debug purpose
						return slot.numberInDay(l.slots.first()) === 1 
							&& (slot.breakSimple(db.data.slot[l.slots.first()]).day === 2
							|| slot.breakSimple(db.data.slot[l.slots.first()]).day === 4)
							//&& !slot.breakSimple(db.data.slot[l.slots.first()]).odd
					});
				*/
					return {
						odd: ls.fl(function(l){ return !l.isSymmetrical && l.isOdd }),
						even: ls.fl(function(l){ return !l.isSymmetrical && !l.isOdd }),
						both: ls.fl(function(l){ return l.isSymmetrical })
					}
				});
				
				
		var row = tag('tr');
		row.appendChild(tag('th', '', '', parseInt(numInDay) + 1));
		row.appendChild(tag('th', '', '', timeStr));
		renderChunksIntoRow(row, chunked);
		table.appendChild(row);
	
	});

	return table;
}

var replaceTag = function(newTag, oldTag){
	oldTag.parentNode.insertBefore(newTag, oldTag);
	oldTag.parentNode.removeChild(oldTag);
}
var showTimetablePopup = function(data, okText, onOk, values, defaultVal, preventPreprocessing){
	values = values || ['true', 'false'];
	defaultVal = defaultVal || 'false';
	preventPreprocessing = preventPreprocessing || false;
	data = data
		.map(resolveFunction(db.data.slot))
		.map(slot.breakSimple)
		.map(function(d){ 
			d.day = d.day + ''; 
			d.value = 'true';
			return d; 
		});
	var table = widget(tag('div', 
			{'data-widget-name': 'weekTimetable', 
			'data-widget-param-split-hint':'(возможность выбирать время в четной или нечетной неделе)'})),
		button = tag('input', 'position:absolute;right:10px;bottom:10px;', {'type':'button','value':okText}),
		wrapper = tag('div', 'width:100%'),
		win;
	table.timeGaps(slot.asWeekTableGaps()).valueList(values).defaultValue(defaultVal).value(data);
	button.onclick = function(){
		win.close();
		var result = table.value();
		if(!preventPreprocessing)
			result = result.flfield('value', 'true')
				.map(function(d){ 
					d.day = parseInt(d.day); 
					delete d.value;
					return d; })
				.map(slot.match)
		onOk(result);
	};
	wrapper.appendChild(table);
	wrapper.appendChild(button);
	win = popup(wrapper, {height:480, width:700, header:'Выбор времени'});
	return table;
}
var getRawWeekNumber = function(d){ // вычисляет номер учебной недели для данного таймстампа (в секундах)
	d = d || ~~(timestamp() / 1000);
	var week = ((~~((d - weekZero) / secondsInWeek)) % weeksInYear) + 1;
	return week >= fallSemesterLength? week - fallSemesterLength: week;
}
var getCompleteWeekNumber = function(d){ return getRawWeekNumber(d) + db.misc.weekShift.value; }
var getOddityOf = function(date){
	return (getCompleteWeekNumber(~~(date.getTime() / 1000)) % 2) === 1;
}

// функция для связи хеш-параметра page и табов
var bindTabToHash = function(tabName, hashGroup){

	if(hashGroup) hashGroup = hashGroup.toReverseAssoc(true)
	else{
		hashGroup = {};
		hashGroup[tabName] = true;
	}

	var tabBar = el('content_tab_bar');
	
	tabBar.listen('switch', function(){
		if(!tabBar.isActive(tabName) || pageHash.getParam('page') === tabName) return;
		pageHash.setParams({page: tabName});
	})
	
	pageHash.listenChange(function(e){
		e = (e || window.event).data;
		if(!hashGroup[e.page] || !tabBar.isShown(tabName) || hashGroup.spawn(function(res, v, k){
			return res || (tabBar.isActive(k) && tabBar.isShown(k))
		}, false)) return;
		tabBar.activate(tabName);
	});
	
	if(pageHash.getParam('page') === tabName) setTimeout(function(){ tabBar.activate(tabName); }, 1);
	
}

var startApp = function(){
	document.body.innerHTML = '';
	shred.invoke('main');
	if(!pageHash.getParam('page'))
		pageHash.setParam('page', 'schedule_display');
	
	tooltip.setRoot(document.body.children[0]);
	movableNode.setRoot(document.body.children[0]);
	
	showLoadingBlocker();
	conjure('getWeekShift').then(function(r){
		hideLoadingBlocker();
		db.misc.weekShift.value = r.status === 'ok'? r.data.value: 0;
		db.misc.weekShift.fire('dataUpdated');
	});
	
	showLoadingBlocker();
	conjure('tryResumeSession', function(r){ 
		if(r.status !== 'ok' || !r.data.logged){
			db.setRole('free');
		} else if(r.data.logged){
			if(r.data.admin) db.setRole('protected');
			else {
				db.user.id = r.data.lector_id;
				db.setRole('lector');
			}
		}
		
		showLoadingBlocker();
		db.ents.cohort.fetch().then(hideLoadingBlocker);
		
		showLoadingBlocker();
		db.ents.schedule.fetch().then(hideLoadingBlocker);
		
		
		hideLoadingBlocker();
	});
	
}