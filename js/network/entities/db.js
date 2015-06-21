/* 
	в этом файле - описание базы данных, как оно есть
	максимально конкретное описание, вся общая логика - в других файлах
*/

var servCache = serverCache(conjure);

/*
	список кешируемых запросов к серверу
	кеш сбрасывается автоматически при смене роли
	осторожнее с этим списком - если внести сюда что-то лишнее, есть шанс, что данные где-нибудь будут залипать
	если сомневаетесь насчет конкретного метода, лучше не вносите его сюда
	(система кеширования и работы с базой может быть несколько более хитрой, чем вы про нее думаете; 
	кеширование действительно может быть нужно значительно реже)
*/ 
['getCommonData', 'getLootingSession', 'getScheduleList'].each(function(name){
	servCache.setCacheable(name, 10 * 60 * 1000);
});

var db = new database(servCache);

/*
	описание структур данных: способов их получения и работы с ними
*/

// вспомогательная функция для определения сущности, которая передается в запросе getCommonData
var defineCommonDataEntity = function(name, dataPropName, functionPostfix, roles){
	db.defineEntity(name, 'id', roles || ['free', 'lector', 'protected']).registerFetch(function(){
			return this.cache('getCommonData').then(function(d){ this.readyNext(d.data[dataPropName]); });
		}).registerCreate(function(data){
			return this.cache('create' + functionPostfix, data).then(function(d){ this.readyNext(d.data); });
		}).registerUpdate(function(data){
			return this.cache('update' + functionPostfix, data);
		}).registerDelete(function(data){
			return this.cache('delete' + functionPostfix, {id:data});
		});
}

// общедоступные сущности основной части базы
defineCommonDataEntity('building', 'buildings', 'Building');
defineCommonDataEntity('lector', 'lectors', 'Lector');
defineCommonDataEntity('cohort', 'cohorts', 'Cohort');
defineCommonDataEntity('curriculum', 'curriculums', 'Curriculum');
defineCommonDataEntity('room', 'rooms', 'Room');
defineCommonDataEntity('subject', 'subjects', 'Subject');
	
db.defineEntity('slot', 'id', ['free', 'lector', 'protected']).registerFetch(function(){
		return this.cache('getCommonData').then(function(d){ this.readyNext(d.data.slots); });
	}).registerSet(function(data){
		return this.cache('setSlots', data).then(function(d){ this.readyNext(d.data); });
	});
	
// сущности основной части базы, видимые только админу
defineCommonDataEntity('gear_type', 'gear_types', 'GearType', ['protected']);

// функция, повторяющая логику setGearInRoom и setGearForSubject
var getSetGearFunction = function(eName, fName){
	return function(args, vals){
		// то, что я тут делаю - это не совсем правильно; подразумевается, что руками мы данные не изменяем
		// но это слишком частный случай, чтобы полноценно и не костыльно его объять какими-либо общими алгоритмами
		var rows = db.getMatchedRows(eName, args);
		if(vals.amount === 0) { // special case
			rows.each(function(v,k){ 
				delete db.data[eName][parseInt(k)]; 
			});
		} else if(rows.isEmpty())
			db.data[eName].push(args.populate(vals));
		return this.cache(fName, args.populate(vals));
	}
}

db.defineEntity('gear_in_room', null, ['protected']).registerFetch(function(){
		return this.cache('getCommonData').then(function(d){ this.readyNext(d.data.gears_in_rooms); });
	}).registerArgUpdate(getSetGearFunction('gear_in_room', 'setGearInRoom'));
db.defineEntity('gear_for_subject', null, ['protected']).registerFetch(function(){
		return this.cache('getCommonData').then(function(d){ this.readyNext(d.data.gears_for_subjects); });
	}).registerArgUpdate(getSetGearFunction('gear_for_subject', 'setGearForSubject'));
	
db.defineEntity('schedule', 'id', ['free', 'lector', 'protected']).registerFetch(function(data){
		return this.cache('getScheduleList').then(
			function(scheduleList){ 
				if(typeof(data) === 'number') data = {id: data};
				
				scheduleList = scheduleList.data;
				if(scheduleList.isEmpty()) return;
				
				var self = this, targetSchedule;
				var populateScheduleWithData = function(schedule, data){
					schedule.lessons = data.lessons.reindex('id');
					schedule.changesets = data.changesets.reindex('id');
					schedule.changesets.each(function(cset){ cset.changes = cset.changes.reindex('id'); })
					schedule.curriculums_for_cohorts = data.curriculums_for_cohorts || [];
					schedule.preconceived_lector_slots = data.preconceived_lector_slots || [];
					schedule.preconceived_room_slots = data.preconceived_room_slots || [];
					schedule.preconceived_cohort_slots = data.preconceived_cohort_slots || [];
					schedule.preferences = data.preferences || [];
				}
				
				var afterDataGetPromise = ((data && data.id !== undefined)?
					this.context.cache('getSchedule', data).then(function(scheduleData){
						targetSchedule = scheduleList.flfield('id', data.id).first();
						populateScheduleWithData(targetSchedule, scheduleData.data);
						this.readyNext(scheduleList);
					}):
					this.context.cache('getMainSchedule').then(function(scheduleData){
						targetSchedule = scheduleList.flfield('is_main', true).first();
						populateScheduleWithData(targetSchedule, scheduleData.data);
						this.readyNext(scheduleList);
					}));
					
				if(db.getRole() === 'protected')
					afterDataGetPromise = afterDataGetPromise.then(function(scheduleList){
						var self = this;
						this.context.cache('getObservations').then(function(d){
							targetSchedule.observations = d.data;
							self.readyNext(scheduleList);
						});
					});
					
				afterDataGetPromise.then(function(data){
					self.readyNext(data);
				})
			});
	}).registerUpdate(function(data){
		if(db.getRole() === 'lector'){ 
			// если лектор пытается обновить расписание - считаем, что это предложение изменения
			// это еще один костыль, на самом деле. правильнее было бы вынести изменения в отдельную сущность
			// но тогда каждый раз, когда нам нужны были бы изменения относительно определенного расписания,
			// нам приходилось бы их фильтровать. это хуже, чем такой сравнительно небольшой костыль
			
			// считаем, что преподаватель вносит не более одного предложения за раз
			var newProposition = data.unsubmittedProposition;
			delete data.unsubmittedProposition;
			return this.cache('propose', newProposition).then(function(d){ db.ents.schedule.fetch(); });
		} else if(db.getRole() === 'protected') {
		
			if(data.alteredLessons !== undefined){
				var result = promise(function(){}).call(this),
					dataWaiter = new waiter(1, function(){ result.readyNext(); }),
					self = this,
					tickWaiter = function(){dataWaiter.tick();}
					
				if(data.alteredLessons.updated)
					data.alteredLessons.updated.each(function(l){
						dataWaiter.untick();
						l.schedule = data.id;
						self.cache('updateLesson', l).then(tickWaiter);
						data.lessons[l.id] = l;
					});
				
				if(data.alteredLessons.deleted)
					data.alteredLessons.deleted.each(function(l){
						dataWaiter.untick();
						l = {schedule: data.id, id: l.id};				
						self.cache('deleteLesson', l).then(tickWaiter);
						delete data.lessons[l.id];
					});
				
				if(data.alteredLessons.created)
					data.alteredLessons.created.each(function(l){
						dataWaiter.untick();
						l.schedule = data.id;
						self.cache('createLesson', l).then(checkOkStatus).then(function(r){
							l.id = r.data;
							data.lessons[l.id] = l;
							tickWaiter();
						});
					});
				
				delete data.alteredLessons;
				
				dataWaiter.tick();
				
				return result;
			} else return this.cache('updateSchedule', data);
		}
		throw 'Not allowed.';
	}).registerDelete(function(data){
		return this.cache('deleteSchedule', data);
	}).registerCreate(function(data){
		return this.cache('createSchedule', data);
	});
	/*
db.defineEntity('lesson', 'id', ['free', 'lector', 'protected']).registerFetch(function(data){
		return ((data && data.id !== undefined)? this.cache('getSchedule', data): this.cache('getMainSchedule')).then(function(d){
			this.readyNext(d.data.lessons);
		});
	}).registerUpdate(function(data){
		return this.cache('updateLesson', data);
	}).registerDelete(function(data){
		return this.cache('deleteLesson', data);
	}).registerCreate(function(data){
		return this.cache('createLesson', data);
	});
	*/
db.defineEntity('preference', null, ['lector']).registerFetch(function(){
		var dataWaiter = new waiter(3, function(){
			result.readyNext(resultData);
		}), resultData = {}, result = promise(function(){}).call(this);
		
		this.cache('getPreferences').then(function(d){
			var data = d.data;
			data.slots = resultData.slots;
			data.observations = resultData.observations;
			resultData = data;
			dataWaiter.tick();
		});
		
		this.cache('getPreconceivedSlots').then(function(d){
			resultData.slots = d.data;
			dataWaiter.tick();
		});
		
		this.cache('getObservations').then(function(d){
			resultData.observations = d.data;
			dataWaiter.tick();
		});
		
		return result;
	}).registerSet(function(data){
		var resultWaiter = new waiter(2, function(){
				result.readyNext(data);
			}), 
			result = promise(function(){}).call(this),
			tickWaiter = function(){ resultWaiter.tick(); };
		
		var prefs = data.fl(function(p){ return p.type === 'merge_cohorts' || p.type === 'split_cohort' || p.type === 'room_to_subject' }),
			slots = slot.lectorPreconceived(data);
			
		if(prefs) this.cache('setPreferences', prefs).then(tickWaiter);
		else tickWaiter();
		
		if(slots){
			slots = slots.toAssoc().fl(bool).toArr();
			for(var i in data) 
				if(Array.isArray(data[i])) {
					data[i] = slots;
					break;
				}
			this.cache('setPreconceivedSlots', slots).then(tickWaiter);
		} else tickWaiter();
		
		return result;
	})
	
db.misc.weekShift = {value: 0};