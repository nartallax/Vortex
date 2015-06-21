// таб со всеми пожеланиями, которые преподаватели оставляли

shred.define({
	requirements: ['contentTabBar'],
	name: 'totalPreferencesTab',
	priority: -100,
	init: function(markup){ 
		bindTabToHash('total_preferences');
		var tabBar = el('content_tab_bar').addTab(markup, {name: 'total_preferences', title: 'Пожелания'});
		
		db.listen('roleChanged', function(){
			if(db.getRole() !== 'protected'){
				if(tabBar.isActive('total_preferences'))
					tabBar.activate('propositions');
				tabBar.hideTab('total_preferences');
			} else tabBar.showTab('total_preferences');
		});
		
		var filter = el('total_preferences_lector_filter_input');
		
		addListener('change', function(){
		
			var val = filter.value(),
				params = pageHash.getParams();
				
			if((parseInt(val) + '') !== val){
				delete params.lector;
			} else {
				switch(val){
					case -1:
						delete params.lector;
						break;
					case -2:
						params.lector = 'anon';
						break;
					default:
						params.lector = val;
						break;
				}
			}
			
			pageHash.setParams(params);
			
		}, filter);
		
		pageHash.listenChange(function(){
			
			if(pageHash.getParam('page') !== 'total_preferences') return;
			renderSelectedPreferences();
			
		});
		
		var getPreferencesForLector = function(id){
			var result = {}, mainSchedule = schedule.main();
			
			result.commonPrefs = mainSchedule.preferences.flfield('lector', id);
			result.slots = mainSchedule.preconceived_lector_slots.flfield('lector', id);
			result.observations = mainSchedule.observations[id] || {};
			
			return (result.commonPrefs.isEmpty() && result.slots.isEmpty() && result.observations.isEmpty())? undefined: result;
		}
		
		var renderPreferences = function(preferences, name){
		
			if(!preferences.slots) preferences.slots = {};
			if(!preferences.observations) preferences.observations = {};
			if(!preferences.commonPrefs) preferences.commonPrefs = {};
			
			var tableContainer, 
				commonContainer = tag('ul','display:block'),
				wrapper = tag('div', 'margin:25px 0px');
				
			wrapper.appendChild(tag('b', '', '', name));
			wrapper.appendChild(tag('hr'));
				
			if(!preferences.slots.isEmpty()){
				tableContainer = tag('div', 'width:220px;float:left;margin:10px 0px 20px 0px;');
				commonContainer.style.marginLeft = '230px';
				wrapper.appendChild(tableContainer);
				
				var table = widget(tag('div', '', 'tiny', {'data-widget-name':'weekTimetable', 'data-widget-param-editable':'false'}));
				table.timeGaps(slot.asWeekTableNumberedGaps()).value(preference.slotsToWeekTableData(preferences.slots))
				tableContainer.appendChild(table);
			}
			
			preferences.observations.each(function(text){ commonContainer.appendChild(tag('li', '', '', text)); });
			preferences.commonPrefs.each(function(pref){ commonContainer.appendChild(tag('li', '', '', preference.toString(pref))); });
			
			wrapper.appendChild(commonContainer);
			wrapper.appendChild(tag('hr'));
			return wrapper;
		}
		
		var renderSelectedPreferences = function(){
		
			var resultEl = el('total_preferences_inner_container');
			resultEl.innerHTML = '';
			
			var renderForLector = function(l){
				var prefs = getPreferencesForLector(l.id);
				if(!prefs) return;
				resultEl.appendChild(renderPreferences(prefs, lector.toStringFull(l)));
			}
			
			var selectedLector = pageHash.getParam('lector');
			if(selectedLector === undefined)
				db.data.lector.each(renderForLector);
			else if(selectedLector !== 'anon')
				renderForLector(db.data.lector[parseInt(selectedLector)]);
			
			if(selectedLector === undefined || selectedLector === 'anon'){
				var anonObservs = schedule.main().observations[-1];
				if(anonObservs && !anonObservs.isEmpty())
					resultEl.appendChild(renderPreferences({observations: anonObservs}, 'Анонимные отзывы'));
			}
		
		}
		
		var onDataUpdated = function(){
			if(	db.getRole() !== 'protected'|| 
				db.data.schedule.isEmpty() || db.data.lector.isEmpty() || 
				!schedule.main() ||!schedule.main().observations) 
				return;
				
			var lectors = db.data.lector.fl(function(l){ return bool(getPreferencesForLector(l.id)); }).map(lector.toString),
				anonObservs = schedule.main().observations[-1];
			if(anonObservs && !anonObservs.isEmpty())
				lectors['-1'] = 'Анонимные отзывы';
				
			filter.data(lectors);
			
			renderSelectedPreferences();
		}
		
		db.ents.schedule.listen('dataUpdated', onDataUpdated);
		db.ents.lector.listen('dataUpdated', onDataUpdated);
		db.listen('roleChanged', onDataUpdated);
	},	
	methods: {},
	markup: 
'<div style="margin:0px 35px;padding:25px 0px" class="arial">'+
'	Преподаватель <div data-widget-name="domainInput" id="total_preferences_lector_filter_input" style="display:inline-block"></div>'+
'	<div id="total_preferences_inner_container" class="light-hr"></div>'+
'</div>'
});
