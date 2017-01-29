// вкладка со сбором и возможностью сделать произвольный sql-запрос на сервер

//select * from cohorts where name like '16%' or name like '26%' or name like '36%' or name like '46%' or name like '56%' or name like '66%'
// update rooms set is_external = true where not(building = 9 and (name like '%405%' or name like '%207%' or name like '%415%' or name like '%406%'))
// update rooms set is_external = false where building = 9 and (name like '%405%' or name like '%207%' or name like '%415%' or name like '%406%') 

shred.define({
	requirements: ['contentTabBar'],
	name: 'lootingAndSqlTab',
	priority: 0,
	init: function(markup){ 
		bindTabToHash('looting_and_sql');
		var tabBar = el('content_tab_bar').addTab(markup, {name: 'looting_and_sql', title: 'SQL и сбор'});
		
		db.listen('roleChanged', function(){
			db.getRole() === 'protected'?
				tabBar.showTab('looting_and_sql'):
				tabBar.hideTab('looting_and_sql');
		});
		
	},	
	methods: {
		appendLogMessage: function(msg, color){
			var logLimit = 5000;
		
			var lootingOutput = el('looting_output');
			lootingOutput.appendChild(tag('p', (color?'color:' + color + ';':'') + 'margin:0px 5px;', null, msg));
			while(lootingOutput.childNodes.length > logLimit)
				lootingOutput.removeChild(lootingOutput.childNodes[0]);
			lootingOutput.scrollTop = 1000000;
		}, 
		getLootingSession: function(){
			if(!el('looting_session_number').value) 
				el('looting_session_number').value = looting.getCurrentSessionId();
			var id_raw = el('looting_session_number').value;
			if(parseInt(id_raw) + '' !== id_raw) 
				return shreds.lootingAndSqlTab.appendLogMessage('Неправильно введен номер сессии.', 'red');
			shreds.lootingAndSqlTab.appendLogMessage('Получение данных...', 'green');
			
			return servCache('getLootingSession', {id: parseInt(id_raw)}).then(checkOkStatus).then(function(data){
				shreds.lootingAndSqlTab.appendLogMessage('Интерпретация данных...', 'green');
				this.readyNext(looting.parseSession(data.data));
			});
		}, 
		configureLooting: function(){
			looting.onError = 	function(msg){ shreds.lootingAndSqlTab.appendLogMessage(msg, '#FF9900');						}
			looting.onFail = 	function(msg){ shreds.lootingAndSqlTab.appendLogMessage(msg, 'red');							}
			looting.onNotice = 	function(msg){ shreds.lootingAndSqlTab.appendLogMessage(msg);									}
			looting.onStart = 	function(msg){ shreds.lootingAndSqlTab.appendLogMessage("Сбор успешно начат.", 'green');		}
			looting.onFinish = 	function(msg){ shreds.lootingAndSqlTab.appendLogMessage("Сбор успешно завершен.", 'green');		}
		}, 
		doQuery: function(){
			conjure('sql', {query:el('sql_input').value}).then(checkOkStatus).then(function(r){
				var outputNode = el('sql_output');
					
				if(!r.data || !r.data.length || r.data.length < 1)
					return outputNode.innerHTML = r.data? JSON.stringify(r.data): r.data;
				
				outputNode.innerHTML = '';
				outputNode.appendChild(renderTable(r.data));
			});
		}, 
		startNewSession: function(){
			shreds.lootingAndSqlTab.configureLooting();
			looting.start();
		}, 
		pauseCurrentSession: function(){
			looting.pauseCurrent();
		}, 
		continueCurrentSession: function(){
			shreds.lootingAndSqlTab.configureLooting();
			looting.continueCurrent();
		}, 
		continueSelectedSession: function(){
			shreds.lootingAndSqlTab.configureLooting();
			if(!el('looting_session_number').value) 
				el('looting_session_number').value = looting.getCurrentSessionId();
			var id_raw = el('looting_session_number').value;
			if(parseInt(id_raw) + '' !== id_raw) return shreds.lootingAndSqlTab.appendLogMessage('Неправильно введен номер сессии.', 'red');
			looting.continueSelected(parseInt(id_raw));
		},
		tryExtractBuildings: function(){
			shreds.lootingAndSqlTab.getLootingSession().then(function(session){
				var dataKeys = {},
					extracted = session.shards
						.fl(function(d){ 
							if(!(d && d.room && d.room.building)) return false;
							if(dataKeys[d.room.building.looting_info]) return false;
							return dataKeys[d.room.building.looting_info] = true;
						}).map(function(d){ return d.room.building }), 
					newData = extracted.fl(function(d){ return building.match(d.looting_info) === null; })
						.each(function(d){ 
							d.looting_info = {value: d.looting_info, is_regexp: false};
							d.is_external = true;
						});
				
				if(newData.isEmpty())
					return popup.alert('Извлечено ' + extracted.length + ' зданий. Все извлеченные здания есть в базе данных.');
					
				popup.confirm('Извлечено ' + extracted.length + ' зданий. Из них ' + newData.length + ' новых. Вы хотите добавить их в базу данных?', function(){
					conjure('createBuildings', newData).then(checkOkStatus).then(function(r){
						shreds.lootingAndSqlTab.appendLogMessage('Данные загружены в базу.', 'green');
						db.data.building = r.data.reindex('id');
						db.ents.building.fire('dataUpdated');
					});
				});
			});
		}, 
		tryExtractRooms: function(){
			shreds.lootingAndSqlTab.getLootingSession().then(function(session){
				var dataKeys = {},
					extracted = session.shards
						.fl(function(d){ 
							if(!(d && d.room)) return false;
							if(dataKeys[d.room.looting_info]) return false;
							return dataKeys[d.room.looting_info] = true;
						}).map(function(d){ return d.room }), 
					newData = extracted.fl(function(d){ return room.match(d.looting_info) === null; })
						.each(function(d){ 
							d.looting_info = {value: d.looting_info, is_regexp: false};
							d.is_external = true;
							d.space = 0;
							d.building = d.building? building.match(d.building.looting_info): undefined;
						});
				
				if(newData.isEmpty())
					return popup.alert('Извлечено ' + extracted.length + ' аудиторий. Все извлеченные аудитории есть в базе данных.');
					
				popup.confirm('Извлечено ' + extracted.length + ' аудиторий. Из них ' + newData.length + ' новых. Вы хотите добавить их в базу данных?', function(){
					conjure('createRooms', newData).then(checkOkStatus).then(function(r){
						shreds.lootingAndSqlTab.appendLogMessage('Данные загружены в базу.', 'green');
						db.data.room = r.data.reindex('id');
						db.ents.room.fire('dataUpdated');
					});
				});
			});
		}, 
		tryExtractLectors: function(){
			shreds.lootingAndSqlTab.getLootingSession().then(function(session){
				var dataKeys = {},
					extracted = session.shards
						.fl(function(d){ 
							if(!(d && d.lector)) return false;
							if(dataKeys[d.lector.looting_info]) return false;
							return dataKeys[d.lector.looting_info] = true;
						}).map(function(d){ return d.lector }), 
					newData = extracted.fl(function(d){ return lector.match(d.looting_info) === null; })
						.each(function(d){ 
							d.looting_info = {value: d.looting_info, is_regexp: false};
							d.is_external = true;
						});
				
				if(newData.isEmpty())
					return popup.alert('Извлечено ' + extracted.length + ' преподавателей. Все извлеченные преподаватели есть в базе данных.');
				
				popup.confirm('Извлечено ' + extracted.length + ' преподавателей. Из них ' + newData.length + ' новых. Вы хотите добавить их в базу данных?', function(){
					conjure('createLectors', newData).then(checkOkStatus).then(function(r){
						shreds.lootingAndSqlTab.appendLogMessage('Данные загружены в базу.', 'green');
						db.data.lector = r.data.reindex('id');
						db.ents.lector.fire('dataUpdated');
					});
				});
			});
		}, 
		tryExtractCohorts: function(){
			shreds.lootingAndSqlTab.getLootingSession().then(function(session){
				var dataKeys = {},
					extracted = session.shards
						.fl(function(d){ return d && d.cohorts; })
						.spawn(function(res, shard){ return res.addAll(shard.cohorts); }, [])
						.fl(function(d){
							if(dataKeys[d.looting_info]) return false;
							return dataKeys[d.looting_info] = true;
						});
					newData = extracted.fl(function(d){ return cohort.match(d.looting_info) === null; })
						.each(function(d){ 
							d.looting_info = {value: d.looting_info, is_regexp: false};
							d.is_external = true;
							d.disciples = 0;
							delete d.rate;
						});
				
				if(newData.isEmpty())
					return popup.alert('Извлечено ' + extracted.length + ' групп. Все извлеченные группы есть в базе данных.');
				
				popup.confirm('Извлечено ' + extracted.length + ' групп. Из них ' + newData.length + ' новых. Вы хотите добавить их в базу данных?', function(){
					conjure('createCohorts', newData).then(checkOkStatus).then(function(r){
						shreds.lootingAndSqlTab.appendLogMessage('Данные загружены в базу.', 'green');
						db.data.cohort = r.data.reindex('id');
						db.ents.cohort.fire('dataUpdated');
					});
				});
			});
		}, 
		tryExtractSubjects: function(){
			shreds.lootingAndSqlTab.getLootingSession().then(function(session){
				var dataKeys = {},
					extracted = session.shards
						.fl(function(d){ 
							if(!(d && d.subject)) return false;
							if(dataKeys[d.subject.looting_info]) return false;
							return dataKeys[d.subject.looting_info] = true;
						}).map(function(d){ return d.subject }), 
					newData = extracted.fl(function(d){ return subject.match(d.looting_info) === null; })
						.each(function(d){ 
							d.looting_info = {value: d.looting_info, is_regexp: false};
							d.is_external = true;
							delete d.type;
						});
				
				if(newData.isEmpty())
					return popup.alert('Извлечено ' + extracted.length + ' предметов. Все извлеченные преметы есть в базе данных.');
				
				popup.confirm('Извлечено ' + extracted.length + ' предметов. Из них ' + newData.length + ' новых. Вы хотите добавить их в базу данных?', function(){
					conjure('createSubjects', newData).then(checkOkStatus).then(function(r){
						shreds.lootingAndSqlTab.appendLogMessage('Данные загружены в базу.', 'green');
						db.data.subject = r.data.reindex('id');
						db.ents.subject.fire('dataUpdated');
					});
				});
			});
		}, 
		createSheduleFromSession: function(){
			shreds.lootingAndSqlTab.getLootingSession().then(function(session){
					var lessons = [], dataPiece, type, tmp;
					session.shards.each(function(shard){
						var lesson = {
							lector: lector.match(shard.lector? shard.lector.looting_info: undefined),
							subject: subject.match(shard.subject? shard.subject.looting_info: undefined),
							room: room.match(shard.room? shard.room.looting_info: undefined),
							slot: slot.match(shard.slot),
							cohorts: shard.cohorts.spawn(function(res, c){
								var id = cohort.match(c.looting_info);
								return typeof(id) !== 'number'? res: res.add({cohort:id, rate: c.rate});
							}, [])
						}
						lesson[shard.subject.type] = true;
						if(lesson.slot === null) delete lesson.slot;
						lessons.push(lesson);
					});
					
					var log = function(){ shreds.lootingAndSqlTab.appendLogMessage.apply(shreds.lootingAndSqlTab, arguments); }
					
					window.testValue = lessons;
					
					popup.confirm('Всего получено пар: ' + lessons.length + '. Уверены, что хотите создать новое главное расписание?', function(){
					
						var loadNextPart = function(){
						
							var lessons = lessonsBroke.first(),
								key = lessonsBroke.keyOf(lessons),
								afterLoad = function(){
									delete lessonsBroke[key];
									log('Загружена часть ' + (parseInt(key) + 1) + ' из ' + partsSize, 'green');
									lwaiter.tick();
								}
							
							if(lessons.isEmpty()) afterLoad();
							else {
								lessons.each(function(d){ d.schedule = id; });
								conjure('createLessons', lessons).then(checkOkStatus).then(afterLoad)
							}
						}
					
						var lessonsBroke = lessons.divide(function(v, k){ return ~~(parseInt(k) / 1000); }),
							partsSize = lessonsBroke.size(),
							id = undefined,
							lwaiter = new waiter(partsSize, function(){
								log('Готово.', 'green');
								db.ents.schedule.fetch();
							}, loadNextPart);
					
						conjure('createSchedule', {name:'Расписание от ' + new Date().toString(), duration:0})
							.then(checkOkStatus)
							.then(function(r){
								id = r.data;
								log('Новое расписание создано, назначаю его главным...', 'green');
								conjure('setMainShedule', {id:id}).then(checkOkStatus).then(function(r){
									log('Новое расписание назначено главным, приступаю к заполнению...', 'green');
									loadNextPart();
								});
							});
					});
					
				});
		}
	},
	markup: 
'<div id="sql_and_looting_page" style="display:none">'+
'	<div style="width:100%;height:300px;position:relative;border-bottom:1px solid black;">'+
'		<div style="width:100%;margin:0px;position:relative;height:31px">'+
'			<div style="position:absolute;left:5px;top:5px;right:150px;">'+
'				<input type="text" id="sql_input" placeholder="SQL-запрос вводить сюда" style="width:100%;display:block" value="select lector, room, building, subject, slot, cohort from looting_shards where looting_session = 1 and cohort like \'46%\'"/>'+
'			</div>'+
'			<input type="button" value="Послать" style="position:absolute;width:135px;right:5px;top:5px;display:block" onclick="shreds.lootingAndSqlTab.doQuery()"/>'+
'		</div>'+
'		<div style="position:absolute;top:31px;bottom:0px;right:5px;left:5px;overflow:auto" id="sql_output">'+
'			<span style="color:#666">Результат запроса появится здесь.</span>'+
'		</div>'+
'	</div>'+
'	<div style="width:100%;height:250px">'+
'		<div>'+
'			<input type="button" value="Начать собирать с нуля" style="margin:5px 0px 0px 5px" onclick="shreds.lootingAndSqlTab.startNewSession()"/>'+
'			<input type="button" value="Приостановить сбор" onclick="shreds.lootingAndSqlTab.pauseCurrentSession()"/>'+
'			<input type="button" value="Продолжить этот сбор" onclick="shreds.lootingAndSqlTab.continueCurrentSession()"/>'+
'			<br/>'+
'			<input style="margin:5px 0px 0px 5px" type="number" id="looting_session_number" placeholder="номер сессии сбора"/>'+
'			<br/>'+
'			<input type="button" style="margin:5px 0px 0px 5px" value="Продолжить выбранный сбор" onclick="shreds.lootingAndSqlTab.continueSelectedSession()"/>'+
'			<input type="button" value="Извлечь корпуса" onclick="shreds.lootingAndSqlTab.tryExtractBuildings()"/>'+
'			<input type="button" value="Извлечь аудитории" onclick="shreds.lootingAndSqlTab.tryExtractRooms()"/>'+
'			<input type="button" value="Извлечь преподавателей" onclick="shreds.lootingAndSqlTab.tryExtractLectors()"/>'+
'			<input type="button" value="Извлечь группы" onclick="shreds.lootingAndSqlTab.tryExtractCohorts()"/>'+
'			<input type="button" value="Извлечь предметы" onclick="shreds.lootingAndSqlTab.tryExtractSubjects()"/>'+
'			<input type="button" value="Создать расписание из сбора" onclick="shreds.lootingAndSqlTab.createSheduleFromSession()"/>'+
'		</div>'+
'		<div id="looting_output" style="border-top:1px solid black;overflow-y:scroll;height:150px;">'+
'			<p style="color:#999;margin:0px 5px">Сюда будут выводиться всякие сообщения по ходу дела.</p>'+
'		</div>'+
'	</div>'+
'</div>'
});
