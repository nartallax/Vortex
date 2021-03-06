// таб "предложения"

shred.define({
	requirements: ['contentTabBar'],
	name: 'propositionsTab',
	priority: -100,
	init: function(markup){ 
		bindTabToHash('propositions');
		el('content_tab_bar').addTab(markup, {name: 'propositions', title: 'Предложения'});
		
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
	},	
	methods: {
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
				var totalValue = undefined,
					lector = db.data.lector[pref.proposer];
					
				lector = lector.name + ' ' + lector.surname;
				
				var date = new Date();
				date.setTime(pref.creation_date * 1000);
				date = date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
				
				switch(pref.type){
					case 'alter_slot':
						valuePart = ' пусть оно проходит по ' + slot.toString(db.data.slot[pref.new_val]);
						break;
					case 'add_cohort':
						valuePart = ' добавить ' + (pref.rate * 100) + '% учеников группы ' + db.data.cohort[pref.cohort].name;
						break;
					case 'remove_cohort':
						valuePart = ' убрать группу ' + db.data.cohort[pref.cohort].name;
						break;
					case 'alter_cohort':
						valuePart = ' изменить процент учеников группы ' + db.data.cohort[pref.cohort].name + ' на ' + (pref.new_val * 100);
						break;
					case 'alter_type':
						var fake_lesson = {};
						fake_lesson[pref.new_val] = true;
						valuePart = ' изменить тип занятия на "' + lesson.typeToString(fake_lesson) + '"';
						break;
					case 'alter_room':
						valuePart = ' переместить занятие в аудиторию ' + db.data.room[pref.new_val].name;
						break;
					case 'delete':
						valuePart = ' удалить это занятие';
						break;
					case 'create':
						totalValue = lector + " в " + date + ' предложил создать занятие: ' + lesson.toString(pref) + (pref.note? '; заметка: ' + pref.note:'');
						break;
					case 'alter_lesson_lector':
						var target_lector = db.data.lector[pref.lector];
						valuePart = ' пусть это занятие ведет ' + target_lector.name + ' ' + target_lector.surname;
						break;
					case 'alter_subject_lector':
						var target_lector = db.data.lector[pref.lector];
						totalValue = lector + " в " + date + ' предложил: пусть все занятия по "' + db.data.subject[pref.subject].name + '" ведет ' + target_lector.name + ' ' + target_lector.surname + (pref.note? '; заметка: ' + pref.note:'');
						break;
					default:
						throw 'Unknown proposition type: ' + pref.type;
				}
				
				
				node.appendChild(tag('div','margin:5px', null,totalValue? totalValue: lector + ' в ' + date + ' предложил изменение относительно ' + lesson.toString(mainSchedule.lessons[pref.lesson], 'genitive') + ': ' + valuePart + (pref.note? '; заметка: ' + pref.note:'')));
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
'<div style="margin:10px 10px;font-size:18px">' + 
'	<b>Предложения по изменению существующего расписания</b><br/>' + 
'	Пока что система в разработке, поэтому:<br/>' + 
'	1. Вы <b>не</b> можете вносить предложения по изменению пар, которых нет на ИСУ в данный момент, или чужих пар.<br/>' + 
'	2. Вы можете только вносить предложения, любые другие действия с ними недоступны.<br/>' + 
'	Если у вас есть более общие пожелания относительно расписания, перейдите на страницу "пожелания" (кнопка вверху страницы, доступна после входа) и попробуйте указать их там.<br/>' + 
'	Если вы хотите предложить какое-то изменение, тип которого не предусмотрен системой, воспользуйтесь кнопкой "отзыв".<br/>' + 
'	(и вообще, пользуйтесь этой кнопкой по любому удобному поводу)<br/>' + 
'	<hr/>' + 
'</div>' + 
'<div style="margin:10px;text-align:center;" id="propositions_container">' + 
'	Загрузка...' + 
'</div>' + 
'<div style="margin:10px 10px 10px 10px;text-align:center;">' + 
'	<hr/>' + 
'	<div id="proposition_input_not_logged">Чтобы предложить изменение расписания, войдите как преподаватель.</div>' + 
'	<div style="display:none;text-align:left;line-height:25px" id="proposition_input_logged">' + 
'		<div style="text-align:center;line-height:15px">Выберите одно из возможных изменений, задайте нужное значение полям, после чего кликните на соответствующую кнопку "Предлагаю". Обратите внимание на поле "заметка" в самом низу - вы можете вводить в него заметки для любого типа изменений и они будут прикреплены к ним.</div>' + 
'		<div style="margin-top:10px">' + 
'			Цель изменения:' + 
'			<select id="alteration_target_lesson">' + 
'				<option value="-1">загрузка...</option>' + 
'			</select>' + 
'		</div>' + 
'		<div style="margin-left:30px">' + 
'			<input value="Предлагаю" type="button" onclick="shreds.propositionsTab.alterSlot()"/> передвинуть её на' + 
'			<select id="alter_slot_oddity">' + 
'				<option value="0">четный</option>' + 
'				<option value="1">нечетный</option>' + 
'			</select>' + 
'			<select id="alter_slot_day">' + 
'				<option value="0">понедельник</option>' + 
'				<option value="86400">вторник</option>' + 
'				<option value="172800">среду</option>' + 
'				<option value="259200">четверг</option>' + 
'				<option value="345600">пятницу</option>' + 
'				<option value="432000">субботу</option>' + 
'				<option value="518400">воскресенье</option>' + 
'			</select>,' + 
'			<select id="alter_slot_time">' + 
'				<option value="28800:4800">с 8:00 до 9:20</option>' + 
'				<option value="34200:4800">с 9:30 до 10:50</option>' + 
'				<option value="39600:4800">с 11:00 до 12:20</option>' + 
'				<option value="45600:4800">с 12:40 до 14:00</option>' + 
'				<option value="51600:4800">с 14:20 до 15:40</option>' + 
'				<option value="57000:4800">с 15:50 до 17:10</option>' + 
'				<option value="62400:4800">с 17:20 до 18:40</option>' + 
'				<option value="67800:4200">с 18:50 до 20:00</option>' + 
'				<option value="72600:4200">с 20:10 до 21:20</option>' + 
'			</select>' + 
'		</div>' + 
'		<div style="margin-left:30px">' + 
'			<input value="Предлагаю" type="button" onclick="shreds.propositionsTab.addCohort()"/>: пусть на неё ходит еще и группа' + 
'			<div data-widget-name="domainInput" id="add_cohort_target_cohort" style="width:100px;display:inline-block"></div>' + 
' 			(<input type="number" id="add_cohort_target_cohort_rate" value="100"/> процентов учеников)' + 
'		</div>' + 
'		<div style="margin-left:30px">' + 
'			<input value="Предлагаю" type="button" onclick="shreds.propositionsTab.removeCohort()"/>: пусть на неё НЕ ходит группа' + 
'			<div data-widget-name="domainInput" id="remove_cohort_target_cohort" style="width:100px;display:inline-block"></div>' + 
'		</div>' + 
'		<div style="margin-left:30px">' + 
'			<input value="Предлагаю" type="button" onclick="shreds.propositionsTab.alterCohort()"/>: пусть на неё ходит <input type="number" id="alter_cohort_target_cohort_rate" value="100" style="width:50px"/> процентов учеников группы' + 
'			<div data-widget-name="domainInput" id="alter_cohort_target_cohort" style="width:100px;display:inline-block"></div>' + 
'		</div>' + 
'		<div style="margin-left:30px">' + 
'			<input value="Предлагаю" type="button" onclick="shreds.propositionsTab.alterType()"/> считать эту пару  ' + 
'			<select id="alter_type_target_type">' + 
'				<option value="is_lec">лекцией</option>' + 
'				<option value="is_lab">лабораторной</option>' + 
'				<option value="is_prk">практикой</option>' + 
'				<option value="is_srs">СРС</option>' + 
'				<option value="is_etc">чем-нибудь вне списка</option>' + 
'			</select>' + 
'		</div>' + 
'		<div style="margin-left:30px">' + 
'			<input value="Предлагаю" type="button" onclick="shreds.propositionsTab.alterRoom()"/> проводить эту пару в ' + 
'			<div data-widget-name="domainInput" id="alter_room_target_room" style="width:100px;display:inline-block"></div>' + 
'		</div>' + 
'		<div style="margin-left:30px">' + 
'			<input value="Предлагаю" type="button" onclick="shreds.propositionsTab.deleteLesson()"/> удалить эту пару вообще' + 
'		</div>' + 
'		<div style="margin-left:30px">' + 
'			<input value="Предлагаю" type="button" onclick="shreds.propositionsTab.alterLessonLector()"/>: пусть эту пару ведет' + 
'			<div data-widget-name="domainInput" id="alter_lesson_lector_select" style="width:100px;display:inline-block"></div>' + 
'		</div>' + 
'		<div>' + 
'			<input value="Предлагаю" type="button" onclick="shreds.propositionsTab.alterSubjectLector()"/>: пусть ' + 
'			<div data-widget-name="domainInput" id="alter_subject_lector_select_lector" style="width:100px;display:inline-block"></div>' + 
'			ведет все занятия по предмету '+
'			<div data-widget-name="domainInput" id="alter_subject_lector_select_subject" style="width:100px;display:inline-block"></div>' + 
'		</div>' + 
'		<div>' + 
'			<input value="Предлагаю" type="button" onclick="shreds.propositionsTab.createLesson()"/> создать' + 
'			<select id="create_lesson_type">' + 
'				<option value="is_lec">лекцию</option>' + 
'				<option value="is_lab">лабораторную</option>' + 
'				<option value="is_prk">практику</option>' + 
'				<option value="is_srs">СРС</option>' + 
'				<option value="is_etc">просто пару</option>' + 
'			</select> по ' + 
'			<div data-widget-name="domainInput" id="create_lesson_subject" style="width:100px;display:inline-block"></div>' + 
'			, которая будет проходить в' + 
'			<div data-widget-name="domainInput" id="create_lesson_room" style="width:100px;display:inline-block"></div>' + 
'			 и на которую придет <input type="number" id="create_lesson_cohort_rate" value="100" style="width:50px"/> процентов учеников группы ' + 
'			<div data-widget-name="domainInput" id="create_lesson_cohort" style="width:100px;display:inline-block"></div>' + 
'			, которая будет проходить по' + 
'			<select id="create_lesson_oddity">' + 
'				<option value="0">четным</option>' + 
'				<option value="1">нечетным</option>' + 
'			</select>' + 
'			<select id="create_lesson_day">' + 
'				<option value="0">понедельникам</option>' + 
'				<option value="86400">вторникам</option>' + 
'				<option value="172800">средам</option>' + 
'				<option value="259200">четвергам</option>' + 
'				<option value="345600">пятницам</option>' + 
'				<option value="432000">субботам</option>' + 
'				<option value="518400">воскресеньям</option>' + 
'			</select>' + 
'			<select id="create_lesson_time">' + 
'				<option value="28800:4800">с 8:00 до 9:20</option>' + 
'				<option value="34200:4800">с 9:30 до 10:50</option>' + 
'				<option value="39600:4800">с 11:00 до 12:20</option>' + 
'				<option value="45600:4800">с 12:40 до 14:00</option>' + 
'				<option value="51600:4800">с 14:20 до 15:40</option>' + 
'				<option value="57000:4800">с 15:50 до 17:10</option>' + 
'				<option value="62400:4800">с 17:20 до 18:40</option>' + 
'				<option value="67800:4200">с 18:50 до 20:00</option>' + 
'				<option value="72600:4200">с 20:10 до 21:20</option>' + 
'			</select>' + 
'		</div>' + 
'		<hr/>' + 
'		<div style="width:100%;height:100px">' + 
'			<textarea resize="none" id="proposition_note_input" style="width:100%;height:100%" placeholder="Заметка"></textarea>' + 
'		</div>' + 
'	</div>' + 
'</div>'
});
