// таб "предложения"

shred.define({
	requirements: ['contentTabBar'],
	name: 'propositionsTab',
	priority: -100,
	init: function(markup){ 
		bindTabToHash('propositions');
		el('content_tab_bar').addTab(markup, {name: 'propositions', title: 'Предложения'});
		
		var precalcVirtualChangedLessons = null,
			calculateVirtualChangedLessons = function(){
				var mainSched = schedule.main(),
					lessons = schedule.getActualLessons(mainSched),
					ongoingChangesets = schedule.getPropositionChangesets(mainSched);
					
				ongoingChangesets.each(function(cset){ 
					cset.changes.each(function(c){ 
						change.virtualApply(c, lessons); 
					}); 
				});
				precalcVirtualChangedLessons = lessons;
			};
		
		var updateViewTypeState = function(){
			if(pageHash.getParam('page') !== 'propositions') {
				precalcVirtualChangedLessons = null;
				return;
			}
		
			if(pageHash.getParam('view')) {
				shreds.propositionsTab.showSubmittedPropositions();
				var r = parseInt(pageHash.getParam('room'));
				if(!db.data.room[r]) return;
				renderSubmittedViewByRoom(r);
			}
			else {
				shreds.propositionsTab.showPropositionInputs();
				if(pageHash.getParam('list')) shreds.propositionsTab.switchViewToList();
				else shreds.propositionsTab.switchViewToGrid();
			}
		};
		
		var updateSubmittedRooms = function(){
			var rooms = el('lector_submitted_propositions_room_list_input').value(),
				tabs = el('lector_submitted_propositions_room_tabs'),
				active = tabs.getActiveTabName();
				
			tabs.clearTabs();
			rooms.each(function(r){
				r = r + '';
				tabs.addTab(tag('div'), {name:r, title:db.data.room[r].name}); 
				if(r === active) {
					tabs.activate(r);
					active = false;
				}
			});
			
			if(active !== false && !rooms.isEmpty())
				tabs.activate(rooms.first() + '');
		}
		
		var renderSubmittedViewByRoom = function(activeRoom){
			if(!precalcVirtualChangedLessons) calculateVirtualChangedLessons();
			
			var container = el('lector_submitted_propositions_table_container'),
				lessons = precalcVirtualChangedLessons.fl(function(l){
					return l.room === activeRoom || (l.altered && l.altered.room === activeRoom);
				});
				
			lessons = lesson.virtualAlteredsToPlain(lessons).flfield('room', activeRoom);
				
			container.innerHTML = '';
			container.appendChild(generateSubmittedTable(lessons));
		}
		
		var onViewRoomSwitch = function(){
			pageHash.setParam('room', el('lector_submitted_propositions_room_tabs').getActiveTabName());
		}
		
		var generateSubmittedTable = function(lessons){
			
			var getIdAndView = function(type){
				if(!this.getAttribute('data-val')) return;
				var params = pageHash.getParams();
				params.type = type;
				params.id = parseInt(this.getAttribute('data-val'));
				params.grid = params.grid && type !== 'subject';
				pageHash.setParams(params);
			}
			
			var onLectorClick = getIdAndView.curry('lector'),
				onCohortClick = getIdAndView.curry('cohort');
			
			var getTDforLessons = function(lessons){
				var result = tag('td', 'position:relative', 'lesson-grid-table-data-cell' + (lessons.isEmpty()? '': ' not-empty'));
				
				lessons.each(function(l){ result.appendChild(getLessonContainer(l)); });
				if(!lessons.isEmpty() && lessons.last().basicChanged) addClass(result, 'altered-lesson-basic')
				
				return result;
			};
			
			var appendComparisonRowFunction = function(table){
				return function(name, a, b, strFunc){
					var tr = tag('tr', '', equals(a, b)? '': 'altered-param-row');
					table.appendChild(tr);
					tr.appendChild(tag('th', '', '', name));
					tr.appendChild(tag('td', '', '', strFunc(a)));
					tr.appendChild(tag('td', '', '', strFunc(b)));
				}
			}
			
			var generateComparisonTable = function(l){
			
				var result = tag('table', '', 'lesson-small-comparison-table'), 
					addRow = appendComparisonRowFunction(result);
			
				result.appendChild(tr = tag('tr'));
				tr.appendChild(tag('th'));
				tr.appendChild(tag('th', '', '', 'есть'));
				tr.appendChild(tag('th', '', '', 'будет'));
				
				addRow('преподаватель', l.lector, l.altered.lector, lector.toString);
				addRow('группы', l.cohorts, l.altered.cohorts, cohort.onLesson.toString);
				addRow('аудитория', l.room, l.altered.room, room.toStringShort);
				addRow('предмет', l.subject, l.altered.subject, subject.toString);
				addRow('тип занятия', lesson.getTypeOf(l), lesson.getTypeOf(l.altered), lesson.typeToString);
				addRow('время', l.slot, l.altered.slot, slot.toString);
				
				return result;
			}
			
			var getLessonContainer = function(l){
				var result = tag('div', 'padding:5px 0px'),
					rent = db.data.room[l.room] || {building:undefined, name:''},
					buildingName = ((db.data.building[rent.building] || {}).name || ''),
					lectorContainer = tag('div', 'margin:0px 5px;font-weight:bold;white-space: nowrap;', 'link', lector.toString(l.lector), {'data-val': l.lector}),
					cohortContainer = tag('div', 'margin:5px 5px 0px 5px;');

				if(l.basicChanged) addClass(result, 'altered-lesson-basic');
				else addClass(result, 'lesson-container-ordinary');
				if(l.isNewLesson) addClass(result, 'altered-lesson-created');
				if(l.isOldLesson) addClass(result, 'altered-lesson-deleted');
					
				lectorContainer.onclick = onLectorClick;
				
				result.appendChild(lectorContainer);
				result.appendChild(cohortContainer);
				
				var first = true;
				l.cohorts.each(function(c){
					if(first) first = false;
					else cohortContainer.appendChild(tag('span', '', '', ', '));
				
					var clink = tag('span', '', 'link', cohort.onLesson.toString(c), {'data-val': c.cohort});
					clink.onclick = onCohortClick;
					cohortContainer.appendChild(clink);
				});
				
				if(l.baseLesson || l.note){
					var ttip = tag('div', 'background:#ffffff;border: 1px solid #797979;padding:10px', 'arial');
					
					if(l.baseLesson) ttip.appendChild(generateComparisonTable(l.baseLesson));
					if(l.note) ttip.appendChild(tag('pre', 'margin:5px 0px 0px 0px', 'arial', (l.note + '').trim()));
					tooltip(ttip).bind(result);
				}
				
				return result;
			}
			
			return renderLessonGrid(lessons, getTDforLessons);
		}
		
		var onDataUpdate = function(){
			if(	!schedule.main() ||
				db.data.lector.isEmpty() ||
				db.data.room.isEmpty() ||
				db.data.slot.isEmpty() ||
				db.data.subject.isEmpty() ||
				db.data.cohort.isEmpty()) return;
				
			el('lector_submitted_propositions_room_list_input')
				.buildings(db.data.building.map(building.toString))
				.rooms(db.data.room)
				.value(db.data.room.flfield('is_external', false).map(function(v,k){return k}).toArr().first(10))
				.listen('change', updateSubmittedRooms);
				
			el('lector_submitted_propositions_room_tabs')
				.listen('switch', onViewRoomSwitch);
				
			updateSubmittedRooms();
		}
		
		db.ents.schedule.listen('dataUpdated', onDataUpdate);
		db.ents.lector.listen('dataUpdated', onDataUpdate);
		db.ents.room.listen('dataUpdated', onDataUpdate);
		db.ents.slot.listen('dataUpdated', onDataUpdate);
		db.ents.subject.listen('dataUpdated', onDataUpdate);
		db.ents.cohort.listen('dataUpdated', onDataUpdate);
		
		pageHash.listenChange(updateViewTypeState);
		updateViewTypeState();
		
		/*
		var onDataUpdate = function(){
			if(!schedule.main()) return;
			
			var select = el('alteration_target_lesson');
			select.innerHTML = '';
			schedule.main().lessons.flfield('lector', db.user.id).each(function(l){
				select.appendChild(tag('option', null, null, lesson.toString(l), {value: l.id}));
			});
			
			var cohorts = db.data.cohort.map(cohort.toString),
				rooms = db.data.room.map(room.toString),
				lectors = db.data.lector.map(lector.toString),
				subjects = db.data.subject.map(subject.toString);
				
			[	el('add_cohort_target_cohort'), 
				el('remove_cohort_target_cohort'), 
				el('alter_cohort_target_cohort'),
				el('create_lesson_cohort')].each(function(input){ input.data(cohorts) });
			[el('create_lesson_room'), el('alter_room_target_room')].each(function(input){ input.data(rooms) });
			[el('alter_lesson_lector_select'), el('alter_subject_lector_select_lector')].each(function(input){ input.data(lectors) });
			[el('alter_subject_lector_select_subject'), el('create_lesson_subject')].each(function(input){ input.data(subjects) });
			
			var props = [];
			schedule.getPropositionChangesets(schedule.main()).each(function(changeset){
				props = props.concat(changeset.changes.fl(function(change){return typeof(change.proposer) === 'number'}).toArr());
			});
				
			shreds.propositionsTab.setDisplayedPropositions(props);
		}
		
		db.ents.schedule.listen('dataUpdated', onDataUpdate);
		db.ents.lector.listen('dataUpdated', onDataUpdate);
		db.ents.room.listen('dataUpdated', onDataUpdate);
		db.ents.slot.listen('dataUpdated', onDataUpdate);
		db.ents.subject.listen('dataUpdated', onDataUpdate);
		db.ents.cohort.listen('dataUpdated', onDataUpdate);
		
		db.listen('roleChanged', function(){
		
			if(db.getRole() === 'lector'){
				el('proposition_input_not_logged').style.display = 'none';
				el('proposition_input_logged').style.display = 'block';
			} else {
				el('proposition_input_not_logged').style.display = 'block';
				el('proposition_input_logged').style.display = 'none';
			}
		});
		*/
	},	
	methods: {	
		switchViewToGrid: function(){
			el('lector_propositions_list_view_switch').style.background = '';
			el('lector_propositions_grid_view_switch').style.background = '#F2F2F2';
			
			el('lector_proposition_view_submit_form').style.display = 'none';
			el('lector_proposition_grid_submit_form').style.display = '';
			
			el('lector_proposition_list_table_container').style.display = 'none';
			el('lector_proposition_grid_tables_container').style.display = '';
		},
		switchViewToList: function(){
			el('lector_propositions_list_view_switch').style.background = '#F2F2F2';
			el('lector_propositions_grid_view_switch').style.background = '';
			
			el('lector_proposition_view_submit_form').style.display = '';
			el('lector_proposition_grid_submit_form').style.display = 'none';
			
			el('lector_proposition_list_table_container').style.display = '';
			el('lector_proposition_grid_tables_container').style.display = 'none';
		},
		showSubmittedPropositions: function(){
			el('lector_proposition_inner_tabs').activate('submitted_view');
		},
		showPropositionInputs: function(){
			el('lector_proposition_inner_tabs').activate('edit');
		},
		
		
		setDisplayedPropositions: function(props){
			var node = el('propositions_container'), valuePart, totalValue;   
			if(props.length === 0) {
				node.style.textAlign = 'center';
				node.innerHTML = 'Пока что ни одного изменения расписания не предложено.';
				return;
			}
			node.style.textAlign = 'left';
			node.innerHTML = '';
			
			var mainSchedule = db.data.schedule.flfield('is_main', true).first();
			
			props.sort(compareByFieldFunction('creation_date')).each(function(pref){
				node.appendChild(tag('div','margin:5px', null, change.toString(pref, true, true, true)));
			});
		},
		alterSlot: function(){
			var mainSchedule = db.data.schedule.flfield('is_main', true).first(),
				lesson = mainSchedule.lessons[parseInt(el('alteration_target_lesson').value)],
				
				oddity = parseInt(el('alter_slot_oddity').value),
				dow = parseInt(el('alter_slot_day').value),
				time = el('alter_slot_time').value,
				note = el('proposition_note_input').value || null,
				
				start_time = (oddity * 7 * 24 * 3600) + dow + parseInt(time.match(/^\d+/)),
				duration = parseInt(time.match(/\d+$/)),
				slot = db.data.slot.flfield('start_time', start_time).flfield('duration', duration).first().id,
				
				data = {lesson:lesson.id, end_slot:slot, note: note, type: 'alter_slot'};
				
			if(slot === lesson.slot) return alert('Это занятие и так проходит в это время!');
			
			mainSchedule.unsubmittedProposition = data;
			db.ents.schedule.update(mainSchedule);
		},
		addCohort: function(){
			var mainSchedule = db.data.schedule.flfield('is_main', true).first(),
				lesson = mainSchedule.lessons[parseInt(el('alteration_target_lesson').value)],
				cohort = parseInt(el('add_cohort_target_cohort').value()),
				rate = parseFloat(el('add_cohort_target_cohort_rate').value) / 100,
				note = el('proposition_note_input').value || null,
				
				data = {lesson:lesson.id, cohort:cohort, rate:rate, note: note, type: 'add_cohort'};
				
			for(var i in lesson.cohorts)
				if(lesson.cohorts[i].cohort === cohort)
					return alert('Эта группа и так уже ходит на это занятие!');
					
			if(rate <= 0 || rate > 1) return alert('На одно занятие должно приходить более 0% и до 100% учеников группы.');
			
			mainSchedule.unsubmittedProposition = data;
			db.ents.schedule.update(mainSchedule);
		},
		removeCohort: function(){
			var mainSchedule = db.data.schedule.flfield('is_main', true).first(),
				lesson = mainSchedule.lessons[parseInt(el('alteration_target_lesson').value)],
				cohort = parseInt(el('remove_cohort_target_cohort').value()),
				note = el('proposition_note_input').value || null,
				
				data = {lesson:lesson.id, cohort:cohort, note: note, type: 'remove_cohort'},
				
				haveCohort = false;
				
			for(var i in lesson.cohorts)
				if(lesson.cohorts[i].cohort === cohort){
					haveCohort = true;
					break;
				}
			if(!haveCohort) return alert('Эта группа не ходит на это занятие!');
			
			mainSchedule.unsubmittedProposition = data;
			db.ents.schedule.update(mainSchedule);
		},
		alterCohort: function(){
			var mainSchedule = db.data.schedule.flfield('is_main', true).first(),
				lesson = mainSchedule.lessons[parseInt(el('alteration_target_lesson').value)],
				cohort = parseInt(el('alter_cohort_target_cohort').value()),
				rate = parseFloat(el('alter_cohort_target_cohort_rate').value)/100,
				note = el('proposition_note_input').value || null,
				
				data = {lesson:lesson.id, cohort:cohort, rate:rate, note: note, type: 'alter_cohort'},
				
				haveCohort = false;
				
			for(var i in lesson.cohorts)
				if(lesson.cohorts[i].cohort == cohort){
					haveCohort = true;
					break;
				}
			if(!haveCohort) return alert('Эта группа не ходит на это занятие!');
			if(rate <= 0 || rate > 1) return alert('На одно занятие должно приходить более 0% и до 100% учеников группы.');
			
			mainSchedule.unsubmittedProposition = data;
			db.ents.schedule.update(mainSchedule);
		},
		alterType: function(){
			var mainSchedule = db.data.schedule.flfield('is_main', true).first(),
				lesson = mainSchedule.lessons[parseInt(el('alteration_target_lesson').value)],
				type = el('alter_type_target_type').value,
				note = el('proposition_note_input').value || null,
				
				data = {lesson:lesson.id, note: note, type: 'alter_type'};
			
			if(lesson[type]) return alert('Это занятие и так этого типа!');
			
			data[type] = true;
			
			clog(data);
			
			mainSchedule.unsubmittedProposition = data;
			db.ents.schedule.update(mainSchedule);
		},
		alterRoom: function(){
			var mainSchedule = db.data.schedule.flfield('is_main', true).first(),
				lesson = mainSchedule.lessons[parseInt(el('alteration_target_lesson').value)],
				room = parseInt(el('alter_room_target_room').value()),
				note = el('proposition_note_input').value || null,
				
				data = {lesson:lesson.id, room:room, note: note, type: 'alter_room'};
			
			if(lesson.room === room) return alert('Это занятие и так проходит в этой аудитории!');
			
			mainSchedule.unsubmittedProposition = data;
			db.ents.schedule.update(mainSchedule);
		},
		deleteLesson: function(){
			var mainSchedule = db.data.schedule.flfield('is_main', true).first(),
				lesson = mainSchedule.lessons[parseInt(el('alteration_target_lesson').value)],
				note = el('proposition_note_input').value || null,
				
				data = {lesson:lesson.id, type: 'delete', note: note};
				
			mainSchedule.unsubmittedProposition = data;
			db.ents.schedule.update(mainSchedule);
		},
		alterLessonLector: function(){
			var mainSchedule = db.data.schedule.flfield('is_main', true).first(),
				lesson = mainSchedule.lessons[parseInt(el('alteration_target_lesson').value)],
				lector = parseInt(el('alter_lesson_lector_select').value()),
				note = el('proposition_note_input').value || null,
				
				data = {lesson:lesson.id, lector:lector, note: note, type: 'alter_lesson_lector'};
			
			if(lesson.lector === lector) return alert('Это занятие и так ведет этот преподаватель!');
			
			mainSchedule.unsubmittedProposition = data;
			db.ents.schedule.update(mainSchedule);
		},
		alterSubjectLector: function(){
			var mainSchedule = db.data.schedule.flfield('is_main', true).first(),
				note = el('proposition_note_input').value || null,
				lector = parseInt(el('alter_subject_lector_select_lector').value()),
				subject = parseInt(el('alter_subject_lector_select_subject').value()),
			
				data = {subject:subject, lector:lector, note: note, type: 'alter_subject_lector'};
			
			mainSchedule.unsubmittedProposition = data;
			db.ents.schedule.update(mainSchedule);
		},
		createLesson: function(){
			var mainSchedule = db.data.schedule.flfield('is_main', true).first(),
				type = el('create_lesson_type').value,
				subject = parseInt(el('create_lesson_subject').value()),
				room = parseInt(el('create_lesson_room').value()),
				rate = parseFloat(el('create_lesson_cohort_rate').value)/100,
				cohort = parseInt(el('create_lesson_cohort').value()),
				note = el('proposition_note_input').value || null,
				
				oddity = parseInt(el('create_lesson_oddity').value),
				dow = parseInt(el('create_lesson_day').value),
				time = el('create_lesson_time').value,
				
				start_time = (oddity * 7 * 24 * 3600) + dow + parseInt(time.match(/^\d+/)),
				duration = parseInt(time.match(/\d+$/)),
				_slot = slot.match({start_time:start_time, duration:duration}),
				
				data = {subject:subject, slot:_slot, room:room, cohorts:[{cohort:cohort, rate:rate}], note: note, type: 'create'};
				
			if(rate <= 0 || rate > 1) return alert('На одно занятие должно приходить более 0% и до 100% учеников группы.');
			
			data[type] = true;
			
			mainSchedule.unsubmittedProposition = data;
			db.ents.schedule.update(mainSchedule);
		}
	},
	markup: 
'<div data-widget-name="tabGroup" id="lector_proposition_inner_tabs" style="margin:30px 3%">'+
'	<div data-name="edit" style="display:none" data-default-active="true">'+
'		<div class="arial light-hr">'+
'			<div>'+
'				Здесь вы можете вносить изменения в текущее расписание.<br/>'+
'				Внесенные вами изменения будут отправлены администратору системы на утверждение.'+
'			</div>'+
'			<div style="margin:10px 0px">'+
'				Вид: '+
'				<div style="display:inline-block;width:24px;height:24px;cursor:pointer;margin:3px 3px 0px 7px;position:relative;top:6px" onclick="pageHash.setParam(\'list\', true);" id="lector_propositions_list_view_switch">'+
'					<div class="bullet-list-icon" style="margin:7px 5px"></div>'+
'				</div>'+
'				<div style="display:inline-block;width:24px;height:24px;cursor:pointer;margin:3px 3px 0px 3px;position:relative;top:6px" onclick="pageHash.setParam(\'list\', false);" id="lector_propositions_grid_view_switch">'+
'					<div class="grid-table-icon" style="margin:6px"></div>'+
'				</div>'+
'			</div>'+
'			<div id="lector_proposition_list_table_container"></div>'+
'			<div style="position:relative;margin:15px 0px">'+
'				<span class="khmer">Добавленные изменения:</span>'+
'				<span style="position:absolute;right:0px" class="link" onclick="pageHash.setParam(\'view\', true);">Планируемые изменения</span>'+
'			</div>'+
'			<hr/>'+
'			<div id="lector_submitted_propositions_container"></div>'+
'			<hr/>'+
'			<div id="lector_proposition_grid_tables_container"></div>'+
'			<div id="lector_proposition_grid_submit_form">'+
'				<div class="khmer" style="margin:15px 0px">Текущие изменения:</div>'+
'				<hr/>'+
'				<div id="lector_propositions_unsubmitted_container"></div>'+
'				<div style="text-align:right">'+
'					<input type="button" value="Подтвердить" style="padding:5px 20px"/>'+
'				</div>'+
'			</div>'+
'			<div id="lector_proposition_view_submit_form">'+
'				<div class="khmer" style="margin:15px 0px">Добавить изменение</div>'+
'			</div>'+
'		</div>'+
'	</div>'+
'	<div data-name="submitted_view" style="display:none">'+
'		<div class="khmer" style="margin:15px 0px">Планируемые изменения в расписании:</div>'+
'		<div>Отображаемые аудитории: <div data-widget-name="roomInputPack" id="lector_submitted_propositions_room_list_input"></div></div>'+
'		<div style="margin:15px 0px" data-widget-name="tabGroup" id="lector_submitted_propositions_room_tabs" data-widget-param-tab-header-class="tab-header tiny arial"></div>'+
'		<div id="lector_submitted_propositions_table_container"></div>'+
'		<div class="arial">'+
'			<div style="margin:5px"><div style="height:15px;width:15px;display:inline-block;position:relative;top:4px" class="altered-lesson-basic"></div> - изменения, не касающиеся времени и аудиторий проведения занятий</div>'+
'			<div style="margin:5px"><div class="altered-lesson-created" style="display:inline">Иванов И.И.</div> - если изменение будет одобрено администратором, ячейка будет занята</div>'+
'			<div style="margin:5px"><div class="altered-lesson-deleted" style="display:inline">Иванов И.И.</div> - если изменение будет одобрено администратором, ячейка будет свободна</div>'+
'		</div>'+
'	</div>'+
'</div>'
});
