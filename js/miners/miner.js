/* в этом файле описана сайтозависимая часть системы сбора данных
	если вы хотите перенастроить алгоритм сбора, использующийся в системе - редактируйте этот файл!
	(описания в комментариях могут немного устареть со временем и версиями базы/идеологии системы) */

/* это - объект-майнер.
	в нем содержатся функции по сбору данных.
	его главная задача - загружать страницы и выделять из них интересующие части,
	а также интерпретировать эти части */	
var miner = (function(){
	
	/* при вызове этой функции она должна собрать данные, необходимые для начала, собственно, сбора
		эта функция должна вернуть в callback массив строк; каждая строка должна описывать кусок данных
		после эти куски будут по одному скормлены функции lootShard, поэтому они должны быть информативны
		например, очевидным результатом данной функции будет набор urlов, с которых можно собрать данные 
		если callback вызван без параметров - значит, функция потерпела неудачу */
	var getShardsDescription = function(callback){
		conjure('proxy', {url:'http://www.ifmo.ru/ru/schedule/'}, function(resp){
			if(resp.status != 'ok' || !resp.data.body)
				return callback();
				
			callback(resp.data.body.match(/[^"]*\/schedule\/0\/[^"]*.htm/g));
		});
	}
	
	var getVal = function(arr, index, defVal){
		if(!arr || index >= arr.length ) return defVal;
		var val = parseHtmlEntities(arr[index]).trim();
		return val? val: defVal;
	}
	
	/* при вызове эта функция должна собрать все данные, описывающиеся данным описанием кусков (такие описания возвращает getShardsDescription)
		подразумевается, что в callback будет передан массив объектов со свойствами room, lector, building, subject, slot, cohort
		один такой объект обозначает одну позицию пары в расписании; все свойства - строки длиной до 512 символов
		хотя правильно передавать в room информацию об аудитории, lector - информацию о преподавателе, ведущем пару, и т.д.,
		это вовсе необязательно, т.к. разбором этих данных потом заниматься функции, описанной ниже в данном файле 
		если callback вызван без параметров - значит, функция потерпела неудачу 
		подразумевается, что за время работы эта функция делает один или ноль запросов, но это не контролируется
		это нужно для балансировки нагрузки на сервер; если ваша функция делает более одного запроса - вам лучше балансировать нагрузку самим
		также подразумевается, что функция может собрать информацию по любому описанию независимо,
		т.е. не должна полагаться на то, что до нее были или после нее будут какие-то запросы или что-то вроде того */
	var lootShards = function(description, callback){
	
		conjure('proxy', {url:'http://www.ifmo.ru' + description}, function(resp){
			if(resp.status != 'ok' || !resp.data.body || resp.data.status != 200) return callback();
			
			var result = [];
			
			var cohort = getVal(resp.data.body.match(/<h\d+[^>]+schedule-title[^>]+>\S+\s+\S+\s+(.*?)<\/h\d+>/), 1, 'Неопознанная группа');
			
			var days = resp.data.body.replace(/[\n\r\s]+/g, ' ').match(/<table [^>]*\d+day[^>]+>.*?<\/table>/gm);
			
			if(!days){
				clog("Failed to find day descriptions at " + description);
				return callback([]);
			}
			
			clog(description);
			
			var i = -1;
			while(++i < days.length){ // iterate over days
				var day = days[i];
			
				var dayName = getVal(day.match(/<th>.+?<span>(.*?)<\/span>.*?<\/th>/), 1, '??').toLowerCase();
				
				// верстальщик, кажется, дятел и забыл открывающий тег tr в одном месте. ничего, идем от tbody
				var lessons = day.match(/<(?:tr|tbody).*?<\/tr>/g);
				if(!lessons) continue;
				
				var j = -1;
				while(++j < lessons.length){ // iterate over lessons
					var lesson = lessons[j];
					
					var timeField = (lesson.match(/<td[^>]+time[^>]+>.*?<\/td>/g) || [])[0],
						placeField = (lesson.match(/<td[^>]+room[^>]+>.*?<\/td>/g) || [])[0],
						whatField = (lesson.match(/<td[^>]+lesson[^>]+>.*?<\/td>/g) || [])[0];
					
					if(!timeField || !placeField || !whatField){
						clog('Skipping because of empty field(s) at ' + lesson);
						continue;
					}
					
					var times = (timeField.match(/<span[^>]*>.*?<\/span>/) || [''])[0].match(/[\d:]+/g) || ['', ''],
						startTime = times[0],
						endTime = times[1],
						
						oddity = (timeField.match(/<dt[^>]*>(.*?)<\/dt>/) || [''])[1] || 'оба';
						
					if(oddity.toLowerCase().match(/неч[её]т/)) oddity = 'нечет';
					else if(oddity.toLowerCase().match(/ч[её]т/)) oddity = 'чет';
					
					var room = (placeField.match(/<dd[^>]*>(.*?)<\/dd>/) || [''])[1],
						building = (placeField.match(/<span[^>]*>(.*?)<\/span>/) || [''])[1];
					
					var what = (whatField.match(/<dd[^>]*>(.*?)<\/dd>/) || ['', ''])[1],
						whatName = (what.match(/^[^\(\):]+/) || [''])[0],
						whatType = (what.match(/\(([^\(\)]*?)\)[^\(\)]*?(?::|$)/) || ['', 'етц'])[1].toLowerCase(),
						whatNote = (what.match(/:(.*?)$/) || ['', ''])[1],
						who = (whatField.match(/<dt[^>]*>(?:<.*>)?([^<>]+)(?:<\/.*>)?<\/dt>/) || ['', ''])[1];
					
					// проверка, что все собралось нормально
					// пустые строки - это нормально
					// а вот undefined-ы - нет, например
					var allResultFields = [
						startTime, endTime, oddity,
						room, building, 
						whatName, whatType, whatNote, who
					];
					var haveBadField = false;
					allResultFields.forEach(function(x){ haveBadField = haveBadField || (typeof(x) !== 'string') });
					if(haveBadField){
						clog('One of fields at lesson have wrong value. Lesson will not be outputted as result.');
						clog(allResultFields);
						continue;
					}
					
					
					result.push({
						room: room.toLowerCase().replace(/ауд\S+/, '').replace(/\s+/, ''), 
						lector: who, 
						building: building, 
						subject: whatNote.replace('|','').replace(/^\s+/, '') + '|' + whatName.replace(/\s+$/, '') + '|' + whatType, 
						slot:dayName + ' ' + oddity + ' ' + startTime + ' ====> ' + endTime, 
						cohort:cohort
					});
					//result.push({room:room, lector:lector_id + ' ' + lector, building:building, subject: subject_note.replace('|','') + '|' + subject, slot:dayName + ' ' + lastOddity + ' ' + lastTimeFrom + ' ====> ' + lastTimeTo, cohort:cohort});
				}
			}
			
			callback(result);
		}, function(){
			// а вот так можно оповестить об ошибке
			looting.onError("Не удалось загрузить страницу.");
			callback();
		});
	}
	
	/* при вызове эта функция должна разобрать собранный шард на более-менее однозначные куски
		подразумевается, что функция вернет объект следующей структуры:
		[{
			lector:{name, surname, patronym, looting_info, note},
			cohorts:[{name, rate, note, looting_info}, ...],
			room:{name, note, looting_info, 
				building:{name, note, looting_info}
			},
			subject:{name, note, looting_info, type},
			slot:{start_time, duration, note}
		}]
		каждый из элементов основного массива - одна пара
		(все свойства, не являющиеся объектами/массивами - строки; в looting_info должна храниться информация, позволяющая идентифицировать объект,
		т.е. если объект идентифицируется по выражению [Кк][Рр][Оо][Нн], то в looting_info должна быть строка "Кронверкский пр, 49")
		(прим.: все остальные поля нужны для автодобавления сущностей в базу)
		*/
	var parseShard = function(shard){
		
		var lectorNameParts = shard.lector.replace(/(^\s+|\s+$)/g, '').split(/\s+/);
		var lector = {
			looting_info: lectorNameParts.join(' ').toLowerCase(),
			surname: lectorNameParts[0] || '',
			name: lectorNameParts[1] || '',
			patronym: lectorNameParts[2] || ''
		};
		
		var cohorts = [{
			name: shard.cohort,
			rate:1,
			looting_info: shard.cohort
		}];
		
		var room = {
			name: shard.room,
			looting_info: shard.room + '|' + shard.building,
			building: {
				name: shard.building,
				looting_info: shard.building
			}
		};
		
		
		var subjectParts = shard.subject.split('|');
		var raw_type = subjectParts[2] || 'етц';
		
		var subject = {
			type: 	raw_type.match('[Лл][Аа][Бб]')?'is_lab':
					raw_type.match('[Лл][Ее][Кк]')?'is_lec':
					raw_type.match('[Пп][Рр][Аа]?[Кк]')?'is_prk':
					raw_type.match('[Сс]([Рр][Сс]|[Аа][Мм])')?'is_srs':
					'is_etc',
			name: subjectParts[1] || '',
			looting_info: (subjectParts[1] || '').toLowerCase().replace(/(^\s+|\s+$)/g, '')
		}
		
		var dow = getVal(shard.slot.match(/\S+/), 0, '???'), startTime = 0;
		if(dow.match('[Пп][Оо]?[Нн]')) dow = 0;
		else if(dow.match('[Вв][Тт]')) dow = 1;
		else if(dow.match('[Сс][Рр]')) dow = 2;
		else if(dow.match('[Чч][Ее]?[Тт]')) dow = 3;
		else if(dow.match('[Пп][Яя]?[Тт]')) dow = 4;
		else if(dow.match('[Сс][уУ]?[Бб]')) dow = 5;
		else if(dow.match('[Вв][Оо]?[Сс]')) dow = 6;
		startTime += dow * 3600 * 24;
		
		var oddity = getVal(shard.slot.match(/\S+\s*(\S+)/), 1, '???');
		if(oddity.match('[Нн][Ее][Чч]')) oddity = 1;
		else if(oddity.match('[Чч][Ее][Тт]')) oddity = 0;
		else oddity = 2;
		
		if(oddity < 2) startTime += oddity * 7 * 3600 * 24;
		
		var times = shard.slot.match(/(\S+)\s*====>\s*(\S+)/);
		var startDayTime = getVal(times, 1, '0:0'),
			endDayTime = getVal(times, 2, '0:0');
			
		times = startDayTime.match(/(\d+):(\d+)/);
		startDayTime = {hours: parseInt(times[1]), minutes: parseInt(times[2])};
		times = endDayTime.match(/(\d+):(\d+)/);
		endDayTime = {hours: parseInt(times[1]), minutes: parseInt(times[2])};
		
		var startDayTimeInt = (startDayTime.minutes + (startDayTime.hours * 60)) * 60;
		var endDayTimeInt = (endDayTime.minutes + (endDayTime.hours * 60)) * 60;
		
		var duration = endDayTimeInt - startDayTimeInt;
		startTime += startDayTimeInt;
		
		var result = [{
			lector: lector, cohorts: cohorts, room: room, subject: subject, slot: {start_time: startTime, duration:duration}
		}];
		if(oddity > 1)
			result.push({lector: lector, cohorts: cohorts, room: room, subject: subject, slot: {start_time: startTime + (7 * 3600 * 24), duration:duration}});
			
		return result;
	}
	
	return {
		getShardsDescription: getShardsDescription,
		lootShards: lootShards,
		parseShard: parseShard
	};
	
})();