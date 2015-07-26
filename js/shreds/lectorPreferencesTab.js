// таб с предпочтениями лектора

shred.define({
	requirements: ['contentTabBar'],
	name: 'lectorPreferencesTab',
	priority: -100,
	init: function(markup){
		bindTabToHash('lector_preferences');
		var tabBar = el('content_tab_bar').addTab(markup, {name: 'lector_preferences', title: 'Пожелания'});
		
		db.listen('roleChanged', function(){
			if(db.getRole() !== 'lector'){
				if(tabBar.isActive('lector_preferences'))
					tabBar.activate('propositions');
				tabBar.hideTab('lector_preferences');
			} else tabBar.showTab('lector_preferences');
		});
		
		db.ents.slot.listen('dataUpdated', function(){
			shreds.lectorPreferencesTab.renderSlotTable(shreds.lectorPreferencesTab.lastSetSlotData || {});
		});
		
		db.ents.preference.listen('dataUpdated', shreds.lectorPreferencesTab.renderPreferences);
		
		db.ents.schedule.listen('dataUpdated', function(){
			var select = el('lector-preferences-target-schedule'),
				val = select.value || undefined;
			select.innerHTML = '';
			db.data.schedule.each(function(s){
				select.appendChild(tag('option', null, null, schedule.toString(s), {value:s.id}));
				if(s.is_main && val === undefined) val = s.id;
			});
			select.value = val;
			shreds.lectorPreferencesTab.renderPreferences();
		});
		
		db.ents.cohort.listen('dataUpdated', function(){
			var data = db.data.cohort.map(cohort.toString);
			['lector_cohorts_merging_cohort_a','lector_cohorts_merging_cohort_b','lector_cohorts_splitting_cohort']
				.map(el)
				.each(function(input){ input.data(data); });
		});
		
		db.ents.subject.listen('dataUpdated', function(){
			var data = db.data.subject.map(subject.toString);
			['lector_room_preferences_target_subject','lector_cohorts_splitting_target_subject','lector_cohorts_merging_target_subject']
				.map(el)
				.each(function(input){ input.data(data); });
		});
		
		db.ents.room.listen('dataUpdated', function(){
			el('lector_rooms_preferences_room').data(db.data.room.map(room.toString));
		});
		
	},	
	methods: {
		showInputs: function(){
			el('lector_preference_inputs').style.display = 'block'; 
			el('lector_preferences_show_inputs_button').style.display='none'; 
			document.body.children.clarr().each(function(c){ c.scrollTop = 1000000; });
		},
		renderPreferences: function(){
		
			if(db.getRole() !== 'lector') return;
				
			var targetSchedule = parseInt(el('lector-preferences-target-schedule').value),
				totalPrefs = db.data.preference.toAssoc(),
				prefs = totalPrefs.flfield('schedule', targetSchedule),
				slotPrefs = slot.lectorPreconceived(),
				slotPrefKey = db.data.preference.keyOf(slotPrefs);
				
			slotPrefs = slotPrefs.flfield('schedule', targetSchedule);
			
			prefs = prefs.flfieldneq('type', undefined).map(preference.toString);
			if(!slotPrefs.isEmpty())
				prefs.all_slot_preference_data = 'Данные о расписании';
			observation.ofPrefs().each(function(obs, key){ prefs['observation|' + key] = obs; });
			
			el('lector_preferences_list').data(prefs).listenRemove(function(e){
			
				var haveSlot = false, haveRegular = false;
			
				e.each(function(row, key){
					if(key === 'all_slot_preference_data'){
						db.data.preference[slotPrefKey] = db.data.preference[slotPrefKey]
							.fl(function(p){ return p.schedule !== targetSchedule; })
						haveSlot = true;
						return;
					}
					if(!key.startsWith('observation')) {
						clog(key);
						clog(totalPrefs);
						delete totalPrefs[parseInt(key)];
						haveRegular = true;
					}
					else {
						var id = parseInt(key.split('|')[1]);
						conjure('deleteObservation', {id:id});
						delete observation.ofPrefs()[id];
					}
				});
			
				if(haveSlot) db.ents.preference.set(db.data.preference);
				else if(haveRegular) db.ents.preference.set(totalPrefs);
				
			});
			
			shreds.lectorPreferencesTab.renderSlotTable(slotPrefs);
		},
		renderSlotTable: function(slots){
			
			shreds.lectorPreferencesTab.lastSetSlotData = slots;
			el('lectorTimePreferencesTable')
				.timeGaps(slot.asWeekTableGaps())
				.value(preference.slotsToWeekTableData(slots))
				.listenChange(shreds.lectorPreferencesTab.onSlotTableChanged);
		},
		onSlotTableChanged: function(){
			var targetSchedule = parseInt(el('lector-preferences-target-schedule').value),
				totalSlots = slot.lectorPreconceived(),
				totalSlotsKey = parseInt(db.data.preference.keyOf(totalSlots)),
				oldData = totalSlots.flfieldneq('schedule', targetSchedule),
				newData = el('lectorTimePreferencesTable')
					.value()
					.fl(function(d){ return parseInt(d.value) !== 0 })
					.map(function(data){
						data.day = parseInt(data.day);
						return {slot: slot.match(data), value: parseInt(data.value), schedule: targetSchedule};
					});
				
			db.data.preference[totalSlotsKey] = oldData.concat(newData);
			db.ents.preference.set(db.data.preference);
		},
		submitMergingPreference: function(){
			var cohort_a = el('lector_cohorts_merging_cohort_a').value(),
				cohort_b = el('lector_cohorts_merging_cohort_b').value(),
				subject = el('lector_cohorts_merging_target_subject').value(),
				targetSchedule = parseInt(el('lector-preferences-target-schedule').value),
				prefs = db.data.preference.flfield('schedule', targetSchedule);
				
			if(cohort_a === undefined || cohort_b === undefined || !subject) return popup.alert('Некоторые поля не заполнены.');
			if(cohort_a === null || cohort_b === null) return popup.alert('Некоторые из указанных групп не существуют.');
				
			cohort_a = parseInt(cohort_a);
			cohort_b = parseInt(cohort_b);
			subject = parseInt(subject);
			
			try{
			
				if(cohort_a === cohort_b) throw 'Вы не можете совмещать группу саму с собой.';
			
				prefs.flfield('type', 'split_cohort').each(function(pref){
					if(pref.cohort == cohort_a && pref.subject == subject)
						throw 'Вы не можете одновременно хотеть разделять и совмещать группу на одном и том же предмете. (группа ' + cohort.toString(cohort_a) + ')';
					if(pref.cohort == cohort_b && pref.subject == subject)
						throw 'Вы не можете одновременно хотеть разделять и совмещать группу на одном и том же предмете. (группа ' + cohort.toString(cohort_b) + ')';
				});
				
				prefs.flfield('type', 'merge_cohorts').each(function(pref){
					if(	pref.subject == subject && 
						(pref.cohort_a == cohort_a || pref.cohort_b == cohort_a) && 
						(pref.cohort_a == cohort_b || pref.cohort_b == cohort_b))
						throw 'У вас уже есть пожелание о совмещении этих двух групп на этом предмете.';
				});
				
			} catch(note){ return popup.alert(note); }
				
			db.data.preference.push({cohort_a: cohort_a, cohort_b:cohort_b, subject:subject, type: 'merge_cohorts', schedule: targetSchedule});
			db.ents.preference.set(db.data.preference);
		},
		submitSplittingPreference: function(){
			var cohort = el('lector_cohorts_splitting_cohort').value(),
				subject = el('lector_cohorts_splitting_target_subject').value(),
				parts = parseInt(el('lector_cohorts_splitting_parts').value),
				targetSchedule = parseInt(el('lector-preferences-target-schedule').value),
				prefs = db.data.preference.flfield('schedule', targetSchedule);
				
			if(cohort === undefined || !subject) return popup.alert('Некоторые поля не заполнены.');
				
			if(cohort === null) return popup.alert('Указанная группа не существует.');
				
			subject = parseInt(subject);
			cohort = parseInt(cohort);
			
			try {
			
				if(parts < 2) throw 'Вы не можете разделять группу менее чем на 2 подгруппы.';
			
				prefs.each(function(pref){
					if(pref.type === 'merge_cohorts' && (pref.cohort_a == cohort || pref.cohort_b == cohort) && pref.subject == subject)
						throw 'Вы не можете одновременно хотеть разделять и совмещать группу на одном и том же предмете.';
				});
			
			} catch(e){ return popup.alert(e); }
			
			var matched = false;
			for(var i in prefs){
				var pref = prefs[i];
				if(pref.type === 'split_cohort' && pref.subject === subject && pref.cohort === cohort){
					pref.parts = parts;
					matched = true;
					break;
				}
			}
			
			if(!matched) db.data.preference.push({cohort:cohort, subject:subject, parts:parts, type: 'split_cohort', schedule: targetSchedule});
			
			db.ents.preference.set(db.data.preference);
		},
		submitRoomsPreference: function(){
			var room = el('lector_rooms_preferences_room').value(),
				subject = el('lector_room_preferences_target_subject').value(),
				targetSchedule = parseInt(el('lector-preferences-target-schedule').value),
				prefs = db.data.preference.flfield('schedule', targetSchedule);
				
			if(room === undefined || !subject) return popup.alert('Некоторые поля не заполнены.');
			if(room === null) return popup.alert('Указанная аудитория не существует.');
				
			room = parseInt(room);
			subject = parseInt(subject);
				
			var matched = false;
			for(var i in prefs) {
				var pref = prefs[i];
				if(pref.type === 'room_to_subject' && pref.subject === subject){
					pref.room = room;
					matched = true;
					break;
				}
			}
			
			if(!matched) db.data.preference.push({room:room, subject:subject, type:'room_to_subject', schedule: targetSchedule});
				
			db.ents.preference.set(db.data.preference);
		},
		submitPreference: function(){
			var panel = el('lector_preference_radiopanel_group').getActivePanel();
			switch(panel.getAttribute('id')){
				case 'cohorts-merging-radiopanel': return shreds.lectorPreferencesTab.submitMergingPreference();
				case 'cohorts-splitting-radiopanel': return shreds.lectorPreferencesTab.submitSplittingPreference();
				case 'subject-room-radiopanel': return shreds.lectorPreferencesTab.submitRoomsPreference();
				case 'freeform-preference-input': 
					var text = el('observation_preference_text').value.replace(/(^\s+|\s+$)/,'');
					if(!text) return popup.alert('Текст пожелания не введен.');
					
					conjure('sendObservation', {poster:lector.toString(db.user.id), text:text}).then(checkOkStatus).then(function(r){
						observation.ofPrefs()[r.data.toString()] = text;
						db.ents.preference.fire('dataUpdated');
					});
					break;
				default:
					throw 'Unexpected radiopanel id: "' + panel.getAttribute('id') + '".';
			}
		}
	},
	markup: 
'<div style="margin:0px 10px">' + 
'	<div style="margin:30px;font-size:20px">' + 
'		Нагрузка на <b>весенний</b> семестр' + 
'	</div>' + 
'	<div id="pressure_container" style="margin:10px;"></div>' + 
'	<div style="margin-top:20px;font-size:14px;">' + 
'		<div style="font-size:20px;">Пожелания</div>' + 
'		<div style="margin:10px">' + 
'		Редактировать пожелания, которые относятся к: <select id="lector-preferences-target-schedule" onchange="shreds.lectorPreferencesTab.renderPreferences();"></select>' + 
'	</div>' + 
'		<div style="margin-left:10px;margin-top:10px">' + 
'			Здесь вы можете указать, какое время является для Вас удобным для проведения занятий, а какое нет.<br/>' + 
'			Выделите ячейки с промежутком времени и выберите один из вариантов:' + 
'		</div>' + 
'		<div style="position:relative" class="week-timetable">' + 
'			<div style="position:absolute;top:0px;left:15px;height:13px;width:13px;border:1px solid #999" data-value="-2"></div>' + 
'			<div style="margin-left:35px"> - КРАЙНЕ нежелательно ввести занятия</div>' + 
'			<div style="position:absolute;top:16px;left:15px;height:13px;width:13px;border:1px solid #999" data-value="-1"></div>' + 
'			<div style="margin-left:35px"> - нежелательно ввести занятия</div>' + 
'			<div style="position:absolute;top:32px;left:15px;height:13px;width:13px;border:1px solid #999" data-value="1"></div>' + 
'			<div style="margin-left:35px"> - желательно ввести занятия</div>' + 
'			<div style="position:absolute;top:48px;left:15px;height:13px;width:13px;border:1px solid #999" data-value="0"></div>' + 
'			<div style="margin-left:35px"> - неважно, будут занятия в это время или нет</div>' + 
'		</div>' + 
'		<div style="margin-left:10px;margin-bottom:15px">' + 
'			Пожелания, которые вы внесете сейчас, будут переданы диспетчерам, составляющим расписание на весенний семестр.' + 
'		</div>' + 
'	</div>' + 
'	<div style="margin-left:20px">' + 
'		<div id="lector_time_preferences_container" style="margin-top:10px">' + 
'			<div data-widget-name="weekTimetable" id="lectorTimePreferencesTable"></div>' + 
'		</div>' + 
'	</div>' + 
'	<div style="font-size:14px;margin-top:30px">Здесь вы можете внести свои пожелания по проведению занятий.</div>' + 
'	<div style="font-size:18px;margin-top:5px">Добавленные пожелания:</div>' + 
'	<div data-widget-name="deletableItemList" id="lector_preferences_list"></div>' + 
'	<input type="button" value="Добавить пожелание" onclick="shreds.lectorPreferencesTab.showInputs();" style="height:30px;margin-top:20px" id="lector_preferences_show_inputs_button"/>' + 
'	<div style="display:none" id="lector_preference_inputs">' + 
'		<div style="margin:20px 0px 15px 0px;font-size:18px">Новое пожелание</div>' + 
'		<div style="margin:0px 0px 20px 0px;font-size:14px">Выберите один из предложенных шаблонов или оставьте пожелание в свободной форме. Предпочтительнее использование шаблонов; оставляйте пожелание в свободной форме только в том случае, если оно не подходит ни под один шаблон.</div>' + 
'		<div data-widget-name="radiopanelGroup" style="width:100%;line-height: 25px" id="lector_preference_radiopanel_group">' + 
'			<div id="cohorts-merging-radiopanel">' + 
'				Мне хотелось бы совмещать группу' + 
'				<div data-widget-name="domainInput" id="lector_cohorts_merging_cohort_a" style="width:100px;display:inline-block"></div>' + 
'				c группой' + 
'				<div data-widget-name="domainInput" id="lector_cohorts_merging_cohort_b" style="width:100px;display:inline-block"></div>' + 
'				на парах по' + 
'				<div data-widget-name="domainInput" data-widget-param-matching-mode="contains" id="lector_cohorts_merging_target_subject" style="width:300px;display:inline-block"></div>' + 
'			</div>' + 
'			<div id="cohorts-splitting-radiopanel">' + 
'				Мне хотелось бы разделять группу' + 
'				<div data-widget-name="domainInput" id="lector_cohorts_splitting_cohort" style="width:100px;display:inline-block"></div>' + 
'				на ' + 
'				<select id="lector_cohorts_splitting_parts">' + 
'					<option value="2">2</option>' + 
'					<option value="3">3</option>' + 
'					<option value="4">4</option>' + 
'				</select>' + 
'				равных подгрупп <br/>и вести у каждой из них занятия по ' + 
'				<div data-widget-name="domainInput" data-widget-param-matching-mode="contains" id="lector_cohorts_splitting_target_subject" style="width:300px;display:inline-block"></div>' + 
'				отдельно.' + 
'			</div>' + 
'			<div id="subject-room-radiopanel">' + 
'				Мне хотелось бы вести ' + 
'				<div data-widget-name="domainInput" data-widget-param-matching-mode="contains" id="lector_room_preferences_target_subject" style="width:300px;display:inline-block"></div>' + 
'				в аудитории' + 
'				<div data-widget-name="domainInput" id="lector_rooms_preferences_room" style="width:300px;display:inline-block"></div>' + 
'			</div>' + 
'			<div style="height:100px;position:relative" id="freeform-preference-input">' + 
'				Поле для ввода пожеланий' + 
'				<textarea id="observation_preference_text" style="resize:none;position:absolute;left:0px;right:0px;top:30px;bottom:0px;width:100%;padding:0px;border:1px solid #999;margin:-1px"></textarea>' + 
'			</div>' + 
'		</div>' + 
'		<div style="text-align:right">'+
'			<input type="button" style="margin:25px 0px 15px 0px;height:30px;padding-left:15px;padding-right:15px" value="Добавить пожелание" onclick="shreds.lectorPreferencesTab.submitPreference();"/>' + 
'		</div>' +
'	</div>' + 
'</div>'
});
