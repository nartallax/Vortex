// таб "редактирование расписания"

shred.define({
	requirements: ['contentTabBar'],
	name: 'scheduleEditTab',
	priority: -100,
	init: function(markup){ 
		bindTabToHash('schedule_edit', ['schedule_display', 'schedule_edit']);
		
		var tabBar = el('content_tab_bar').addTab(markup, {name: 'schedule_edit', title: 'Расписание'});
		
		[el('top_bar_title_container'), el('footer_link_main')].each(function(target){
			addListener('click', function(){
				if(db.getRole() === 'protected') el('content_tab_bar').activate('schedule_edit');
			}, target);
		});
		
		db.listen('roleChanged', function(){
			if(db.getRole() === 'protected'){
				var active = false;
				if(tabBar.haveTab('schedule_display')){
					active = tabBar.isActive('schedule_display');
					tabBar.hideTab('schedule_display');
				}
				tabBar.showTab('schedule_edit');
				if(active) tabBar.activate('schedule_edit');
			} else {
				var active = tabBar.isActive('schedule_edit');
				tabBar.hideTab('schedule_edit');
				if(tabBar.haveTab('schedule_display')){
					tabBar.showTab('schedule_display');
					if(active) tabBar.activate('schedule_display');
				}
			}
		})
		
		var getParentRowKey = function(tag){
			while(!tag.getAttribute('data-key')) tag = tag.parentNode;
			return parseInt(tag.getAttribute('data-key'));
		}
		
		var onEditClick = function(){
			shreds.scheduleEditTab.table.startEditRow(getParentRowKey(this));
		}, onDeleteClick = function(){
			var key = getParentRowKey(this),
				targetSchedule = db.data.schedule[parseInt(el('schedule_edit_target_schedule').value)],
				row = shreds.scheduleEditTab.table.data()[key];
			
			shreds.scheduleEditTab.table.deleteRow(key);
			if(!row || !row.ids) return;
			targetSchedule.alteredLessons = {
				deleted: row.ids.map(function(id){return {id:id}})
			};
			db.ents.schedule.update(targetSchedule);
		}, onRevertClick = function(){	
			shreds.scheduleEditTab.table.revertEditRow(getParentRowKey(this));
		}, onApplyClick = function(){
			shreds.scheduleEditTab.table.finishEditRow(getParentRowKey(this));
		};
		
		
		var renderId = function(row){ return tag('a', null, null, '[...]', {title:JSON.stringify(row.ids || [])}) };
		var onEditSlotsClick = function(){
			var button = this;
			showTimetablePopup(JSON.parse(button.getAttribute('data-slots')), 'Принять', function(data){
				button.setAttribute('data-slots', JSON.stringify(data));
			});
		}
		
		shreds.scheduleEditTab.table = el('schedule_edit_grid_table')
			.registerDisplayFunction('id', renderId)
			.registerDisplayFunction('type', function(row){ return tag('div', null, null, lesson.getTypeOf(row)) })
			.registerDisplayFunction('room', function(row){ return tag('div', null, null, room.toString(row.room)) })
			.registerDisplayFunction('lector', function(row){ return tag('div', null, null, lector.toString(row.lector)) })
			.registerDisplayFunction('cohort', function(row){ return tag('div', null, null, cohort.onLesson.toString(row.cohorts)) })
			.registerDisplayFunction('subject', function(row){ return tag('div', null, null, subject.toString(row.subject)) })
			.registerDisplayFunction('slot', function(row){ return tag('div', null, null, slot.toString(row.slot || row.slots)) })
			.registerDisplayFunction('comment', function(row){ return tag('div', 'white-space:pre', null, (row.notes || []).uniq().join('\n')) })
			.registerDisplayFunction('buttons', function(row){ 
				var editButton = tag('input', {type:'button', value:'Изменить'}),
					deleteButton = tag('input', {type:'button', value:'Удалить'}),
					wrap = tag('div');

				editButton.onclick = onEditClick;
				deleteButton.onclick = onDeleteClick;
			
				wrap.appendChild(editButton);
				wrap.appendChild(deleteButton);
				
				return wrap;
			}).registerEditFunction('id', renderId)
			.registerEditFunction('room', function(data){
				return widget(tag('div', 'width:100%', {'data-widget-name': 'domainInput'}))
					.data(db.data.room.map(room.toString))
					.value(data.room);
			}).registerEditFunction('type', function(data){
				var select = tag('select');
				select.appendChild(tag('option', '', '', 'лекция', {value:'is_lec'}));
				select.appendChild(tag('option', '', '', 'практика', {value:'is_prk'}));
				select.appendChild(tag('option', '', '', 'лабораторная', {value:'is_lab'}));
				select.appendChild(tag('option', '', '', 'СРС', {value:'is_srs'}));
				select.appendChild(tag('option', '', '', 'что-то еще', {value:'is_etc'}));
				select.value = lesson.getTypeOf(data);
				return select;
			}).registerEditFunction('lector', function(data){
				return widget(tag('div','width:100%',  {'data-widget-name': 'domainInput'}))
					.data(db.data.lector.map(lector.toString))
					.value(data.lector);
			}).registerEditFunction('cohort', function(data){
				return widget(tag('div', 'min-width:160px', {'data-widget-name': 'cohortsInput'}))
					.data(db.data.cohort.map(cohort.toString))
					.value(data.cohorts);
			}).registerEditFunction('subject', function(data){
				return widget(tag('div', 'width:100%', {'data-widget-name': 'domainInput', 'data-widget-param-matching-mode':'contains'}))
					.data(db.data.subject.map(subject.toString))
					.value(data.subject);
			}).registerEditFunction('slot', function(data){
				var result = tag('input', {type:'button', value: 'Выбрать время', 'data-slots':JSON.stringify(data.slots || [])});
				result.onclick = onEditSlotsClick;
				return result;
			}).registerEditFunction('comment', function(data){
				return tag('textarea', 'height:95%', null, (data.notes || []).uniq().join('\n'));;
			}).registerEditFunction('buttons', function(data){
				var revert = tag('input', {type:'button', value:'Отменить'}),
					apply = tag('input', {type:'button', value: 'Применить'}),
					wrap = tag('div');
					
				revert.onclick = onRevertClick;
				apply.onclick = onApplyClick;
				
				wrap.appendChild(revert);
				wrap.appendChild(apply);
				
				return wrap;
			}).registerDataExtractFunction('id', function(node){
				return {ids: JSON.parse(node.getAttribute('title'))};
			}).registerDataExtractFunction('room', function(node){
				var val = node.value();
				if(val === undefined || val === null) return {};
				return {room: parseInt(val) };
			}).registerDataExtractFunction('type', function(node){
				var val = node.value, res = {};
				res[val] = true;
				return res;
			}).registerDataExtractFunction('lector', function(node){
				var val = node.value();
				if(val === undefined || val === null) return {};
				return {lector: parseInt(val) };
			}).registerDataExtractFunction('cohort', function(node){
				return {cohorts: node.value() };
			}).registerDataExtractFunction('subject', function(node){
				var val = node.value();
				if(val === undefined || val === null) return {};
				return {subject: parseInt(val) };
			}).registerDataExtractFunction('slot', function(node){
				return {slots: JSON.parse(node.getAttribute('data-slots')) };
			}).registerDataExtractFunction('comment', function(node){
				return {notes: node.value.split('\n').fl(bool).uniq() };
			}).registerDataExtractFunction('buttons', function(node){ 
				return {}; 
			});
		
		shreds.scheduleEditTab.lastUsedFilter = undefined;
		shreds.scheduleEditTab.table.listen('editFinish', function(arg){
			var newData = arg.data.newData,
				oldData = arg.data.oldData;
				
			//newData.note = oldData.note;
			//oldData.each(function(v, k){ if(v === true && k.startsWith('is_')) newData[k] = true; })
				
			newData.hashSortRecursive();
			oldData.hashSortRecursive();
			
			if(oldData.equals(newData)) return;
			
			var targetSchedule = db.data.schedule[parseInt(el('schedule_edit_target_schedule').value)],
				lessons = targetSchedule.lessons,
				updatedLessons, createdLessons, deletedLessons;
			var oldLessons = !oldData.ids? []: oldData.ids.map(function(id){ 
				var newLesson = lessons[id].cloneDeep().populate(newData.cloneDeep());
				delete newLesson.slots;
				delete newLesson.ids;
				newLesson.each(function(v, k){ if(v === true && k.startsWith('is_') && !newData[k]) delete newLesson[k] });
				return newLesson;
			});
			
			oldLessons.each(function(l){ 
				l.note = l.notes? l.notes.uniq().join('\n'): l.note; 
				delete l.notes;
			});
			
			updatedLessons = oldLessons.fl(function(l){ return newData.slots.hasVal(l.slot); });
			deletedLessons = oldLessons.fl(function(l){ return !newData.slots.hasVal(l.slot); });
			createdLessons = newData.slots.fl(function(s){ return updatedLessons.flfield('slot', s).isEmpty(); }).map(function(s){
				var newLesson = newData.cloneDeep();
				delete newLesson.slots;
				delete newLesson.ids;
				newLesson.slot = s;
				newLesson.note = newLesson.notes.uniq().fl(bool).join('\n');
				delete newLesson.notes;
				if(!newLesson.spawn(function(r, v, k){ return r || (v === true && k.startsWith('is_')) }, false))
					newLesson.is_lec = true;
				return newLesson;
			});
			
			clog(createdLessons);
			
			var ndata = newData.cloneFacile(),
				odata = oldData.cloneFacile();
			delete ndata.slots;
			delete odata.slots;
			if(odata.equals(ndata)) updatedLessons = [];
			
			targetSchedule.alteredLessons = {
				updated: updatedLessons,
				deleted: deletedLessons,
				created: createdLessons
			};
			
			clog(targetSchedule.alteredLessons);
			
			db.ents.schedule.update(targetSchedule).then(function(){
				newData.ids = createdLessons.map(function(l){ return l.id }).toArr().concat(
					deletedLessons.map(function(l){ return l.id }).toArr()
				);
				shreds.scheduleEditTab.table.updateRow(newData, arg.data.key);
				shreds.scheduleEditTab['filterBy' + shreds.scheduleEditTab.lastUsedFilter]();
			});
			
			
		});
		
		db.ents.cohort.listen('dataUpdated', function(){
			el('schedule_edit_cohort_filter').data(db.data.cohort.map(cohort.toString));
		});
		
		db.ents.lector.listen('dataUpdated', function(){
			var select = el('schedule_edit_lector_filter');
			select.innerHTML = '';
			db.data.lector.flfield('is_external', false).each(function(l){
				select.appendChild(tag('option', null, null, lector.toString(l), {value: l.id}));
			});
		});
		
		db.ents.room.listen('dataUpdated', function(){
			el('schedule_edit_room_filter').data(db.data.room.map(room.toString));
		});
		
		db.ents.subject.listen('dataUpdated', function(){
			el('schedule_edit_subject_filter').data(db.data.subject.map(lector.toString));
		});
		
		db.ents.schedule.listen('dataUpdated', function(){
			var select = el('schedule_edit_target_schedule'),
				val = select.value || undefined;
				
			if(val !== undefined) val = parseInt(val);
			select.innerHTML = '';
			
			db.data.schedule.each(function(s){
				select.appendChild(tag('option', null, null, schedule.toString(s), {value:s.id}));
				if(s.is_main && val === undefined) val = s.id;
			});
			
			select.value = val;
			el('schedule_edit_set_main_button').disabled = (val === undefined || val === schedule.main().id);
		});
		
	},	
	methods: {
		lectorCheckboxFilter: function(lessons){
			return !(el('schedule_edit_external_filter').checked)?
				lessons: lessons.fl(function(l){
					return typeof(l.lector) === 'number' && !(db.data.lector[l.lector].is_external)
				});
		},
		filterByCohort: function(){
			shreds.scheduleEditTab.lastUsedFilter = 'Cohort';
			var cohort = parseInt(el('schedule_edit_cohort_filter').value()),
				lessons = db.data.schedule[parseInt(el('schedule_edit_target_schedule').value)].lessons.fl(function(l){
					for(var i in l.cohorts)
						if(l.cohorts[i].cohort === cohort)
							return true;
					return false;
				});
			
			this.table.data(this.lectorCheckboxFilter(lesson.glue(lessons)));
		},
		filterByLector: function(){
			shreds.scheduleEditTab.lastUsedFilter = 'Lector';
			var lector = parseInt(el('schedule_edit_lector_filter').value),
				lessons = db.data.schedule[parseInt(el('schedule_edit_target_schedule').value)].lessons.flfield('lector', lector);
				
			this.table.data(this.lectorCheckboxFilter(lesson.glue(lessons)));
		},
		filterByRoom: function(){
			shreds.scheduleEditTab.lastUsedFilter = 'Room';
			var room = parseInt(el('schedule_edit_room_filter').value()),
				lessons = db.data.schedule[parseInt(el('schedule_edit_target_schedule').value)].lessons.flfield('room', room);
				
			this.table.data(this.lectorCheckboxFilter(lesson.glue(lessons)));
			
		},
		filterBySubject: function(){
			shreds.scheduleEditTab.lastUsedFilter = 'Subject';
			var subject = parseInt(el('schedule_edit_subject_filter').value()),
				lessons = db.data.schedule[parseInt(el('schedule_edit_target_schedule').value)].lessons.flfield('subject', subject);
				
			this.table.data(this.lectorCheckboxFilter(lesson.glue(lessons)));
		},
		filterBySlot: function(){
			shreds.scheduleEditTab.lastUsedFilter = 'Slot';
			var flags = this.selectedSlots.toReverseAssoc(true),
				lessons = db.data.schedule[parseInt(el('schedule_edit_target_schedule').value)].lessons.fl(function(l){ return flags[l.slot] })
			
			this.table.data(this.lectorCheckboxFilter(lesson.glue(lessons)));
		},
		showSlotFilter: function(){
			showTimetablePopup(shreds.scheduleEditTab.selectedSlots || [], 'Показать', function(d){
				shreds.scheduleEditTab.selectedSlots = d;
				shreds.scheduleEditTab.filterBySlot();
			});
		},
		setCurrentBeMain: function(){
			var id = parseInt(el('schedule_edit_target_schedule').value);
			conjure('setMainShedule', {id:id}).then(checkOkStatus).then(function(r){
				//el('schedule_edit_set_main_button').disabled = true;
				schedule.main().is_main = false;
				db.data.schedule[id].is_main = true;
				db.ents.schedule.fetch(id);
			});
		},
		onScheduleChange: function(){
			var val = parseInt(el('schedule_edit_target_schedule').value);
			el('schedule_edit_set_main_button').disabled = schedule.main().id === val;
			shreds.scheduleEditTab.table.data({});
			db.ents.schedule.fetch(parseInt(el('schedule_edit_target_schedule').value));
		},
		createLesson: function(){
			var data = shreds.scheduleEditTab.table.data(),
				newKey = data.size();
			data[newKey] = {};
			shreds.scheduleEditTab.table.data(data);
			//shreds.scheduleEditTab.table.startEditRow(newKey);
		},
		selectedSlots: []
	},
	markup: 
'<div style="margin:15px">' + 
'	<h3>Редактирование расписания</h3>' + 
'	<div>' + 
'		На этой странице вы можете управлять расписаниями в системе: редактировать их и назначать главное.<br/>' + 
'		Для начала работы, выберите расписание, после чего выберите, какие уроки вы хотели бы редактировать.<br/>' + 
'		Для создания расписания, воспользуйтесь вкладкой "SQL и сбор".<br/>' +
'	</div>' + 
'	<br/>' + 
'	<div>' + 
'		Редактируемое расписание:' + 
'		<select id="schedule_edit_target_schedule" onchange="shreds.scheduleEditTab.onScheduleChange()"></select>' + 
'		<input id="schedule_edit_set_main_button" type="button" value="Сделать главным" disabled="disabled" onclick="shreds.scheduleEditTab.setCurrentBeMain()"/>' + 
'	</div>' + 
'	<br/>' + 
'	<div style="margin-left:15px" id="schedule_edit_lesson_filters">' + 
'		Фильтр по занятиям выбранного расписания:' + 
'		<div> <input type="checkbox" id="schedule_edit_external_filter"/> показывать только самое интересное</div>' + 
'		<div>' + 
'			группы ' + 
'			<div data-widget-name="domainInput" id="schedule_edit_cohort_filter" style="width:100px;display:inline-block;"></div><input style="margin:0px 10px" type="button" value="показать" onclick="shreds.scheduleEditTab.filterByCohort()"/>' + 
'		</div>' + 
'		<div>преподавателя <select id="schedule_edit_lector_filter"></select><input style="margin:0px 10px" type="button" value="показать" onclick="shreds.scheduleEditTab.filterByLector()"/></div>' + 
'		<div>в аудитории<div data-widget-name="domainInput" id="schedule_edit_room_filter" style="width:300px;display:inline-block;margin-left:10px"></div><input style="margin:0px 10px" type="button" value="показать" onclick="shreds.scheduleEditTab.filterByRoom()"/></div>' + 
'		<div>по предмету <div id="schedule_edit_subject_filter" style="width:400px;" data-widget-name="domainInput" data-widget-param-matching-mode="contains" data-widget-param-showed-entries-number="10"></div><input style="margin:0px 10px" type="button" value="показать" onclick="shreds.scheduleEditTab.filterBySubject()"/></div>' + 
'		<div> во время... <input type="button" value="Выбрать время и показать" onclick="shreds.scheduleEditTab.showSlotFilter()" /></div>' + 
'	</div>' + 
'</div>' + 
'<hr/>' + 
'	<div data-widget-name="gridTable" id="schedule_edit_grid_table">' + 
'		<div data-col-name="id">ID</div>' + 
'		<div data-col-name="type">Тип</div>' + 
'		<div data-col-name="room">Где</div>' + 
'		<div data-col-name="lector">Кто</div>' + 
'		<div data-col-name="cohort">У кого</div>' + 
'		<div data-col-name="subject">Что</div>' + 
'		<div data-col-name="slot">Когда</div>' + 
'		<div data-col-name="comment">Комментарий</div>' + 
'		<div data-col-name="buttons"></div>' + 
'	</div>' + 
'	<div style="margin-top:20px;text-align:right">' + 
'		<input type="button" value="Создать новое занятие в указанном расписании" onclick="shreds.scheduleEditTab.createLesson()"/>' + 
'	</div>' + 
'</div>'

});
