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
		conjure('proxy', {url:'https://isu.ifmo.ru/pls/apex/f?p=2005:4'}, function(resp){
			if(resp.status != 'ok' || !resp.data.body)
				return callback();
				
			clog(resp.data.body);
				
			var raw_links = resp.data.body/*.replace(/[\n\r]+\d+000[\n\r]+/g, '').replace(/[\n\r]+[\da-f]{4,}[\n\r]+/g, '')*/.match(/<a[^>]*href="[^"]*SCH_SEARCH[^"]*"[^>]*>[^<]*<\/a>/g);
			var owned_groups = {};
			var raw_link, i = -1, group, result = [];
			while(raw_link = raw_links[++i]){
				group = raw_link.match(/>.*?</);
				if(!group || group.length < 1 || group[0].length < 3) continue; // no name in link, pass
				group = group[0].substr(1, group[0].length - 2);
				if(owned_groups[group]) continue; // already have this group, pass
				owned_groups[group] = true;
				group = raw_link.match(/href[^"]+"([^"]+)/);
				if(!group || group.length < 2) continue; // no link, pass
				group = parseHtmlEntities(group[1]);
				result.push(group);
			}
			callback(result);
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
	
		conjure('proxy', {url:'http://isu.ifmo.ru/pls/apex/' + description}, function(resp){
			if(resp.status != 'ok' || !resp.data.body || resp.data.status != 200) return callback();
			
			result = [];
			var body = resp.data.body/*.replace(/[\n\r]+\d+000[\n\r]+/g, '').replace(/[\n\r]+[\da-f]{4,}[\n\r]+/g, '')*/.replace(/[\n\r]/g, ''); // needed to make regexp matching easier
			
			cohort = getVal(body.match(/i_r_head.*?([^<>]*)<\/div>/), 1, 'Неопознанная группа');
			if(cohort != 'Неопознанная группа')
				cohort = getVal(cohort.match(/\S+$/), 0, 'Неопознанная группа');
			
			body = body.match(/report_p_schedule_table.*?<\/table>/);
			if(!body || body.length < 1) return callback(); // fail, no timetable
			var days = body[0].match(/<h4>.*?<\/h4>.*?(?=<h4>|$)/g), day, i = -1; // break by days
			
			while(++i < days.length){ // iterate over days
				day = days[i];
				
				var dayName = getVal(day.match(/<h4[^>]*>([^><\s]*).*?<\/h4>/), 1, 'Неопознанный день');// receiving day name
				
				var lessons = day.match(/<tr.*?<\/tr>/g);
				if(!lessons) continue;
				
				var lastTimeFrom = '0:0', lastTimeTo = '0:0', lastOddity = '';
				
				var lesson, j = -1;
				while(++j < lessons.length){ // iterate over lessons
					lesson = lessons[j];
					
					var fields = lesson.match(/<td.*?<\/td>/g); 
					if(!fields || fields.length < 5) continue; // check for empty/not full row
					
					var tmp = fields[0].match(/>([^>]*?)<\/span>/g); // time
					if(tmp && tmp.length >= 2){
						lastTimeFrom = tmp[0].match(/([^\<\>]+)/g)[0];
						lastTimeTo = tmp[1].match(/([^\<\>]+)/g)[0];
					}
					
					lastOddity = getVal(fields[1].match(/>([^><\s]*)\s?[^><]*?<\/td>/), 1, 'оба'); // if not supplied, assuming both odd and even
					
					//var building = getVal(fields[2].match(/>([^>]*?)<\/div>/), 1, 'Неопознанное строение');// room and building
					var building = getVal(fields[2].match(/>([^>]*?)<\/div>/), 1, '');// room and building
					//var room = getVal(fields[2].match(/>([^>]*?)<div/), 1, 'Неопознанная аудитория');
					var room = getVal(fields[2].match(/>([^>]*?)<div/), 1, '');
					
					//var subject = getVal(fields[3].match(/>([^>]*?)<div/), 1, 'Неопознанный предмет'); // subject
					var subject = getVal(fields[3].match(/>([^>]*?)<div/), 1, ''); // subject
					var subject_note = getVal(fields[3].match(/>([^><]*?)<\/div>/), 1, 'етц');
					//var subject_type = getVal(tmp.match(/^(\S+)/), 1, 'етц'); // subject type
					
					tmp = fields[4].match(/href="[^"]*?(\d+)"[^>]*>([^<]*)/); // lector
					var lector_id = getVal(tmp, 1, "000000");
					//var lector = getVal(tmp, 2, "Фамилия Имя Отчество");
					var lector = getVal(tmp, 2, "");
					
					result.push({room:room, lector:lector_id + ' ' + lector, building:building, subject: subject_note.replace('|','') + '|' + subject, slot:dayName + ' ' + lastOddity + ' ' + lastTimeFrom + ' ====> ' + lastTimeTo, cohort:cohort});
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
		var lector = {
			looting_info: getVal(shard.lector.match(/\d{3,}/), 0, '000000'),
			//surname: getVal(shard.lector.match(/\d+\s*(\S+)/), 1, 'Фамилия'),
			surname: getVal(shard.lector.match(/\d+\s*(\S+)/), 1, ''),
			//name: getVal(shard.lector.match(/\d+\s*\S+\s*([А-Яа-яёЁ]+)/), 1, 'Имя'),
			name: getVal(shard.lector.match(/\d+\s*\S+\s*([А-Яа-яёЁ]+)/), 1, ''),
			patronym: getVal(shard.lector.match(/\d+\s*\S+\s*[А-Яа-яёЁ]+[^А-Яа-яёЁ]*([А-Яа-яёЁ]+)/), 1, '')
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
		
		
		var raw_type = getVal(shard.subject.match(/[^|]*/), 0, 'етц');
		
		var subject = {
			type: 	raw_type.match('[Лл][Аа][Бб]')?'is_lab':
					raw_type.match('[Лл][Ее][Кк]')?'is_lec':
					raw_type.match('[Пп][Рр][Аа]?[Кк]')?'is_prk':
					raw_type.match('[Сс]([Рр][Сс]|[Аа][Мм])')?'is_srs':
					'is_etc',
			//name: getVal(shard.subject.match(/[^|]*\|(.*)/), 1, 'Неопознанный предмет'),
			name: getVal(shard.subject.match(/[^|]*\|(.*)/), 1, ''),
			looting_info: getVal(shard.subject.match(/[^|]*\|(.*)/), 1, 'Неопознанный предмет')
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