// таб "просмотр расписания"

shred.define({
	requirements: ['contentTabBar'],
	name: 'scheduleDisplayTab',
	priority: -100,
	init: function(markup){ 
		bindTabToHash('schedule_display', ['schedule_display', 'schedule_edit']);
		
		var availableViewTypes = ['lector','cohort','subject','room'];
		
		var oldViewMisc, oldViewType, oldViewId;
		
		var onHashChange = function(){
			params = pageHash.getParams();
			
			if(params.page !== 'schedule_display') return;
			
			[el('schedule_display_week_oddity_select'), el('schedule_display_search_results_week_switch'), el('schedule_display_owned_oddity_select')].each(function(s){ s.value = params.odd || 'all'; });
			
			var localTabs = el('schedule_display_screen_tabs'), days = {}, haveDay = false;
			for(var i = 1; i <= 6; i++){
				days[i] = bool(params['d' + i]);
				haveDay = haveDay || days[i];
			}
			if(!haveDay)
				days = {0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true};
			
			if(params.start && params.end && params.rooms){
				localTabs.activate('free');
				var start = parseInt(params.start),
					end = parseInt(params.end),
					rooms = params.rooms.split('-').map(function(r){ return parseInt(r); }),
					once = bool(params.once),
					len = parseInt(params.len);
					
				if(once){
					var date = params.date.split('-');
					date = {day: parseInt(date[0]), month: parseInt(date[1]), year: parseInt(date[2])};
					shreds.scheduleDisplayTab.viewFreeRoomsOnce(start, end, rooms, date, len);
				} else {
					var odd = params.odd;
					shreds.scheduleDisplayTab.viewFreeRoomsRegular(start, end, rooms, odd, days, len);
				}
					
				return;
			}
			
			if(params.load && params.rooms){
				localTabs.activate('owned');
				var rooms = params.rooms.split('-').map(function(r){ return parseInt(r); });
				shreds.scheduleDisplayTab.viewRoomsLoad(rooms, params.odd || 'all');
				return;
			}
			
			localTabs.activate('main');
			
			if((el('schedule_display_advanced_toggler_arrow').className === 'arrow-down') === bool(params.advanced))
				shreds.scheduleDisplayTab.toggleAdvancedPanel();
		
			if(params.type === 'subject'){
				el('schedule_display_search_results_view_switch_container').style.display = 'none';
				params.grid = false;
			} else el('schedule_display_search_results_view_switch_container').style.display = 'inline';
				
			for(var i = 1; i <= 6; i++) el('schedule_display_dow_filter_' + i).checked = bool(params['d' + i]);
				
			if(availableViewTypes.contains(params.type) && db.data[params.type][params.id]){
				
				if(params.grid) shreds.scheduleDisplayTab.switchViewToGridTable();
				else shreds.scheduleDisplayTab.switchViewToBulletList();
				
				var misc = {odd: params.odd || 'all', dow: {0:true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true}},
					type = params.type,
					id = parseInt(params.id);
				if(params.advanced) misc.dow = days;
				
				if(type.equals(oldViewType) &&  id.equals(oldViewId) && misc.equals(oldViewMisc)) return;
				
				shreds.scheduleDisplayTab.viewScheduleBy(oldViewType = type, oldViewId = id, oldViewMisc = misc);
			} else resetView();
		};
		pageHash.listenChange(onHashChange);
		
		var contentTabBar = el('content_tab_bar');
		contentTabBar.addTab(markup, {name: 'schedule_display', title: 'Расписание'})
			.listen('switch', function(){
				if(!el('content_tab_bar').isActive('schedule_display') || pageHash.getParam('page') === 'schedule_display') return;
				pageHash.setParams({page:'schedule_display'});
			});
			
		var resetView = function(){
			el('schedule_display_search_results').style.display = 'none';
			el('schedule_display_cohort_columns').style.display = 'block';
			shreds.scheduleDisplayTab.switchViewToBulletList();
		};
		
		[el('top_bar_title_container'), el('footer_link_main')].each(function(target){
			addListener('click', function(){
				if(db.getRole() === 'protected') return;
				pageHash.setParams({page:'schedule_display'});
			}, target);
		});

		var mainSuggestFillWaiter = waiter(4, function(){
			var node = el('schedule_display_value_input');
			var items = {};
			({
				'room': db.data.room.map(room.toString),
				'lector': db.data.lector.map(lector.toString),
				'cohort': db.data.cohort.spawn(function(res, val, key){
					var str = cohort.toString(val), arr;
					if(str.match(/\s*\d+\s*\(.\d+\)/)){
						arr = str
							.replace(/[\(\)]/g, ' ')
							.replace(/\s+/g, ' ')
							.replace(/(^\s+|\s+$)/g, '')
							.split(' ');
						res[key] = arr;
					} else res[key] = str;
					return res;
				}, {}),
				'subject': db.data.subject.map(subject.toString)
			}).each(function(data, prefix){ 
				data.each(function(item, key){
					items[prefix + '|' + key] = item;
				});
			});
			
			node.data(items);
		});
		
		
		db.ents.cohort.listen('dataUpdated', mainSuggestFillWaiter.tick);
		db.ents.lector.listen('dataUpdated', mainSuggestFillWaiter.tick);
		db.ents.room.listen('dataUpdated', mainSuggestFillWaiter.tick);
		db.ents.subject.listen('dataUpdated', mainSuggestFillWaiter.tick);
		
		var renderCohortLinks = function(){
			if(db.data.schedule.isEmpty() || db.data.cohort.isEmpty() || db.data.lector.isEmpty()) return;
		
			var cols = [null];
			for(var i = 1; i <= 6; i++){
				cols[i] = el('schedule_display_year_column_' + i);
				cols[i].innerHTML = '';
			}
			var ourLectors = db.data.lector.flfield('is_external', false).map(function(l){ return true });
			
			var onLectorClick = function(){
				var params = pageHash.getParams();
				params.type = 'lector';
				params.id = this.getAttribute('data-id');
				pageHash.setParams(params);
			}
			var onRoomClick = function(){
				var params = pageHash.getParams();
				params.type = 'room';
				params.id = this.getAttribute('data-id');
				pageHash.setParams(params);
			}
			
			var colNum = 1, roomContainer = el('room_fast_links_container');
			roomContainer.innerHTML = '';
			db.data.room.flfield('is_external', false).toArr().sort(compareByFieldFunction('name')).each(function(l){
				var ltag = tag('span', 'color:#66CCFF;margin:10px;white-space:nowrap;cursor:pointer;', '', l.name, {'data-id':l.id});
				ltag.onclick = onRoomClick;
				roomContainer.appendChild(ltag);
				roomContainer.appendChild(tag('span', '', '', ' '));
			});
			
			var lectorCols = el('lector_fast_links_container').children
			for(var i = 0; i < lectorCols.length; i++) lectorCols[i].innerHTML = '';
			
			ourLectors
				.map(function(l, k){return db.data.lector[parseInt(k)];})
				.toArr()
				.sort(compareByFieldFunction('surname'))
				.each(function(l){
					var ltag = tag('div', 'color:#66CCFF;margin:10px;white-space:nowrap;cursor:pointer;', '', lector.toString(l), {'data-id':l.id});
					ltag.onclick = onLectorClick;
					el('lector_fast_links_container_' + colNum).appendChild(ltag);
					colNum = colNum === 6? 1: colNum + 1;
				});
			
			schedule.main().lessons
				.fl(function(l){ return ourLectors[l.lector] })
				.spawn(function(res, l){ return res.addAll(l.cohorts.map(function(c){ return c.cohort })); }, [])
				.uniq()
				.divide(cohort.studyYear)
				.each(function(yearCohorts){
					if(yearCohorts.isEmpty()) return;
				
					var year = cohort.studyYear(yearCohorts.first());
					if(!cols[year]) return;
				
					yearCohorts = yearCohorts
						.map(resolveFunction(db.data.cohort))
						.sort(compareByFieldFunction('name'))
						.map(function(c){ return c.id; });
					
					yearCohorts.each(function(k){
					
						var link = tag('div', 'cursor:pointer;color:#66CCFF;margin:10px 0px', null, cohort.toString(k));
						link.onclick = function(){ 
							var params = pageHash.getParams();
							params.type = 'cohort';
							params.id = k;
							pageHash.setParams(params);
						}
						cols[year].appendChild(link);
					
					});
				});
		
			
		}
		
		db.ents.lector.listen('dataUpdated', renderCohortLinks);
		db.ents.cohort.listen('dataUpdated', renderCohortLinks);
		db.ents.schedule.listen('dataUpdated', renderCohortLinks);
		
		shreds.scheduleDisplayTab.table = el('schedule_display_grid_table');
		
		var dataLoadWaiter = waiter(7, function(){ onHashChange(); });
		var hashChangeWrapperEnt = function(type){
			var result = function(){
				db.ents[type].unlisten('dataUpdated', result);
				dataLoadWaiter.tick();
			}
			return result;
		}
		db.ents.slot.listen('dataUpdated', hashChangeWrapperEnt('slot'));
		db.ents.subject.listen('dataUpdated', hashChangeWrapperEnt('subject'));
		db.ents.room.listen('dataUpdated', hashChangeWrapperEnt('room'));
		db.ents.lector.listen('dataUpdated', hashChangeWrapperEnt('lector'));
		db.ents.cohort.listen('dataUpdated', hashChangeWrapperEnt('cohort'));
		db.ents.schedule.listen('dataUpdated', hashChangeWrapperEnt('schedule'));
		db.ents.building.listen('dataUpdated', hashChangeWrapperEnt('building'));
	},	
	methods: {
		toggleAdvancedPanel: function(){
			var node = el('schedule_display_advanced_panel'),
				arr = el('schedule_display_advanced_toggler_arrow');
			if(arr.className === 'arrow-down'){
				node.style.maxHeight = '115px';
				arr.className = 'arrow-up';
				pageHash.setParam('advanced', true);
			} else {
				node.style.maxHeight = '1px';
				arr.className = 'arrow-down';
				pageHash.setParam('advanced', false);
			}
		},
		displayLessonsByFilter: function(){
			var newParams = pageHash.getParams();
			var rawVal = el('schedule_display_value_input').value().split('|');
			newParams.id = parseInt(rawVal[1]);
			newParams.type = rawVal[0];
			pageHash.setParams(newParams);
		},
		viewScheduleBy: function(viewType, argument, miscFilters){
			miscFilters = miscFilters || {odd:'all', dow:{1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7:true}};
			
			shreds.scheduleDisplayTab.miscFilters = miscFilters;
			shreds.scheduleDisplayTab.viewType = viewType;
			shreds.scheduleDisplayTab.viewArgument = argument;
			
			el('schedule_display_search_results').style.display = 'block';
			el('schedule_display_cohort_columns').style.display = 'none';
			
			var header = el('schedule_display_search_results_header'), data = undefined;
			switch(viewType){
				case 'cohort':
					header.textContent = 'Расписание занятий группы ' + cohort.toString(argument);
					data = schedule.main().lessons.fl(function(l){ return !l.cohorts.flfield('cohort', argument).isEmpty() });
					break;
				case 'lector':
					header.textContent = 'Расписание занятий (' + lector.toString(argument) + ')';
					data = schedule.main().lessons.flfield('lector', argument);
					break;
				case 'room':
					header.textContent = 'Расписание занятий в аудитории ' + db.data.room[argument].name;
					data = schedule.main().lessons.flfield('room', argument);
					break;
				case 'subject':
					header.textContent = 'Расписание занятий по дисциплине ' + subject.toString(argument);
					data = schedule.main().lessons.flfield('subject', argument);
					break;
			}
			
			if(miscFilters.odd !== 'all'){
				var odd = (miscFilters.odd === 'odd');
				data = data.fl(function(l){
					if(!db.data.slot[l.slot]) return true;
					return slot.breakSimple(db.data.slot[l.slot]).odd === odd;
				});
			}
			
			data = data.fl(function(l){
				if(!db.data.slot[l.slot]) return true;
				return bool(miscFilters.dow[slot.breakSimple(db.data.slot[l.slot]).dow + 1]);
			})
			
			data = data.cloneDeep();
			
			shreds.scheduleDisplayTab.generateBulletList(viewType, data);
			shreds.scheduleDisplayTab.generateGridTable(viewType, data);
		},
		switchViewToBulletList: function(){
			el('schedule_display_search_results_grid_table_view').style.display = 'none';
			el('schedule_display_search_results_bullet_list_view').style.display = 'block';
			el('schedule_display_result_view_switch_grid_table').style.background = '';
			el('schedule_display_result_view_switch_bullet_list').style.background = '#F2F2F2';
			pageHash.setParam('grid', false);
		},
		switchViewToGridTable: function(){
			el('schedule_display_search_results_grid_table_view').style.display = 'block';
			el('schedule_display_search_results_bullet_list_view').style.display = 'none';
			el('schedule_display_result_view_switch_grid_table').style.background = '#F2F2F2';
			el('schedule_display_result_view_switch_bullet_list').style.background = '';
			pageHash.setParam('grid', true);
		},
		generateBulletList: function(viewType, data){
			if(!data) return;
			data = data.each(function(l){ delete l.id; }).uniq().each(function(l, k){ l.id = parseInt(k); });
			data = lesson.glueOddEven(lesson.glueCohorts(data)).each(lesson.mergeNotes);
			
			var container = el('schedule_display_search_results_bullet_list_view');
			
			var getIdAndView = function(type){
				if(!this.getAttribute('data-val')) return;
				var params = pageHash.getParams();
				params.type = type;
				params.id = parseInt(this.getAttribute('data-val'));
				pageHash.setParams(params);
			}
			
			var onSubjectClick = getIdAndView.curry('subject'),
				onRoomClick = getIdAndView.curry('room'),
				onLectorClick = getIdAndView.curry('lector'),
				onCohortClick = getIdAndView.curry('cohort');
			
			var getLink = function(text, data, onClick){
				var result = tag('div', 'display:inline;cursor:pointer;text-decoration:underline', null, text, {'data-val':data});
				result.onclick = onClick;
				return result;
			}
			var getSubText = function(text){ return tag('div', 'display:block;color:#a1a1a1;margin-top:3px', null, text); }
			var commaTag = function(){ return tag('div', 'display:inline', null, ',') };
			var td = function(content, left, now){
				var result = tag('td', (!left?'': 'text-align:left;') + (!now?'':'background:#CEE7FF'));
				if(typeof(content) === 'string') result.textContent = content;
				else if(content) result.appendChild(content);
				return result;
			}
			
			var table = tag('table', 'width:100%', 'day-bullet-list-table'), 
				headers = tag('thead'), 
				tbody = tag('tbody'), 
				headerRow = tag('tr');
				
			table.appendChild(headers);
			table.appendChild(tbody);
			headers.appendChild(headerRow);
				
			headerRow.appendChild(td());
			headerRow.appendChild(td('Пара'));
			headerRow.appendChild(td('Время'));
			headerRow.appendChild(td('Неделя'));
			if(viewType !== 'subject') headerRow.appendChild(td('Предмет'));
			else headerRow.appendChild(td('Тип занятия'));
			if(viewType !== 'cohort') headerRow.appendChild(td('Группа'));
			if(viewType !== 'lector') headerRow.appendChild(td('Преподаватель'));
			if(viewType !== 'room') headerRow.appendChild(td('Аудитория'));
			
			var currentSlot = slot.current(), currentSlotOdd = null;
			if(currentSlot){
				currentSlotOdd = slot.breakSimple(currentSlot).odd;
				currentSlot = currentSlot.id;
			}
			
			var fillRowByLesson = function(row, l, odd, slotOddityMatch){
			
				row.appendChild(td(l.slots.length !== 1?'':odd?'нечет':'чет', false, slotOddityMatch));
				if(viewType !== 'subject') {
					var _td = td(getLink(subject.toString(l.subject), l.subject, onSubjectClick), true, slotOddityMatch);
					_td.appendChild(getSubText(lesson.typeToString(l)));
					row.appendChild(_td);
				}
				else row.appendChild(td(lesson.typeToString(l), true, slotOddityMatch));
				if(viewType !== 'cohort'){
					var first = true, _td = td('', false, slotOddityMatch);
					l.cohorts.each(function(c){
						if(first) first = false;
						else _td.appendChild(commaTag());
						_td.appendChild(getLink(cohort.onLesson.toString(c), c.cohort, onCohortClick));
					});
					row.appendChild(_td);
				}
				if(viewType !== 'lector') row.appendChild(td(getLink(lector.toString(l.lector), l.lector, onLectorClick), false, slotOddityMatch));
				if(viewType !== 'room') {
					var _room = db.data.room[l.room], _b = _room? db.data.building[_room.building]: undefined;
					var _td = td(getLink(_room? _room.name: '', l.room, onRoomClick), true, slotOddityMatch);
					_td.appendChild(getSubText(_b? _b.name: ''));
					row.appendChild(_td);
				}
				
				if(l.note){
					var noteNode = tag('div', 'position:absolute;right:3px;bottom:3px', 'small-yellow-attention-circle'),
						noteTd = row.children[row.children.length - 2];
					tooltip(tag('pre', 'display:block;background:#FFF4CE;padding:5px', 'arial', l.note + '')).bind(noteNode);
					noteTd.style.position = 'relative';
					noteTd.appendChild(noteNode);
				}
				
			}
			
			var spawnRowsFunction = function(res, s){
			
				var sid = s.id,
					comp = slot.complementary(sid),
					lessons = data.fl(function(l){ return l.slots.contains(sid) || l.slots.contains(comp); }),
					cells = [], lcount = lessons.size(),
					thisIsCurrentSlot = currentSlot === sid || currentSlot === comp;
					
				if(lcount === 0) return res;
				
				var broke = slot.break(null, s);
				cells.add(tag('td', {rowspan: lcount}))
					.add(tag('td', thisIsCurrentSlot? 'background:#CEE7FF':'', null, (slot.numberInDay(s) + 1) + '', {rowspan: lcount}))
					.add(tag('td', 'white-space:pre-wrap;' + (thisIsCurrentSlot? 'background:#CEE7FF':''), null, broke.str.starth + ':' + broke.str.startm + '\n' + broke.str.endh + ':' + broke.str.endm, {rowspan: lcount}));
					
				var rows = lessons.map(function(l){
					var row = tag('tr'),
						odd = slot.breakSimple(db.data.slot[l.slots.first()]).odd,
						slotOddityMatch = thisIsCurrentSlot && (currentSlotOdd === odd);
					fillRowByLesson(row, l, odd, slotOddityMatch);
					return row;
				});
				
				var firstRow = rows.first(), fchild = firstRow.children[0];
				firstRow.className = 'slot-first-row';
				cells.each(function(c){ firstRow.insertBefore(c, fchild); });
				return res.addAll(rows);
				
			}
			
			var addRowsForDay = function(slots, day){
				
				var rows = slots.fl(function(d){ return d.start_time < secondsInWeek }).spawn(spawnRowsFunction, []);
				
				if(rows.isEmpty()) return;
				rows.first().children.first().textContent = dayShortenings[day].capitalize() || 'Без указания времени';
				
				rows.add(tag('tr', null, 'empty-row')).each(function(row){ tbody.appendChild(row) });
				
			}
			
			db.data.slot.divide(function(s){ return ~~((s.start_time % secondsInWeek)/ secondsInDay) }).each(addRowsForDay);
			
			data.fl(function(d){ return !bool(db.data.slot[d.slots.first()]) }).each(function(l){
				l = l.cloneDeep();
				l.slots = [-1, -1];
				
				var row = tag('tr', '', 'slot-first-row');
				row.appendChild(td());
				row.appendChild(td());
				row.appendChild(td());
				
				fillRowByLesson(row, l, false, false);
				
				tbody.appendChild(row);
			});

			container.innerHTML = '';
			container.appendChild(table);
		},
		generateGridTable: function(viewType, data){
			if(!data) return;
			
			var getIdAndView = function(type){
				if(!this.getAttribute('data-val')) return;
				var params = pageHash.getParams();
				params.type = type;
				params.id = parseInt(this.getAttribute('data-val'));
				params.grid = params.grid && type !== 'subject';
				pageHash.setParams(params);
			}
			
			var onSubjectClick = getIdAndView.curry('subject'),
				onRoomClick = getIdAndView.curry('room'),
				onLectorClick = getIdAndView.curry('lector'),
				onCohortClick = getIdAndView.curry('cohort'),
				
				currentSlot = slot.current();
				
			currentSlot = currentSlot? currentSlot.id: currentSlot;
			
			var container = el('schedule_display_search_results_grid_table_view_container'),
				outerBlock = el('schedule_display_search_results_grid_table_view'),
				getTDforLessons = function(lessons){
					var containerTD = tag('td', 'position:relative', 'lesson-grid-table-data-cell' + (lessons.isEmpty()? '': ' not-empty'));
					
					lessons.each(function(l){
						var current = l.slots.spawn(function(res, s){ return res || s === currentSlot }, false);
						if(current) containerTD.style.background = '#CEE7FF';
											
						containerTD.appendChild(getLessonContainer(l));
					});
					
					return containerTD;
				}, 
				getLessonContainer = function(_lesson, current){
				var result = tag('div', 'overflow:hidden'),
					firstLine = tag('div', 'cursor:pointer;text-decoration:underline;overflow:visible;white-space:nowrap;text-align:left;margin:5px 0px 0px 5px'), 
					secondLine = tag('div', 'overflow:hidden;white-space:nowrap;text-align:left;margin:5px 0px 5px 5px'),
					rent = db.data.room[_lesson.room] || {building:undefined, name:''},
					buildingName = ((db.data.building[rent.building] || {}).name || '');
				
				result.appendChild(firstLine);
				result.appendChild(secondLine);
					
				if(viewType === 'lector'){
					firstLine.style.textDecoration = '';
					firstLine.appendChild(tag('span', 'cursor:pointer;text-decoration:underline', '', rent.name));
					firstLine.appendChild(tag('span', 'color: #999', '', ' ' + buildingName.shorten()))
					firstLine.setAttribute('data-val', _lesson.room);
					firstLine.onclick = onRoomClick;
				} else {
					firstLine.textContent = lector.toString(_lesson.lector);
					firstLine.style.fontWeight = 'bold';
					firstLine.setAttribute('data-val', _lesson.lector);
					firstLine.onclick = onLectorClick;
				}
				
				if(viewType === 'cohort'){
					secondLine.appendChild(tag('span', 'cursor:pointer;text-decoration:underline', '', rent.name));
					secondLine.appendChild(tag('span', 'color: #999', '', ' ' + buildingName.shorten()))
					secondLine.setAttribute('data-val', _lesson.room);
					secondLine.onclick = onRoomClick;
				} else {
					var first = true;
					secondLine.style.whiteSpace = '';
					secondLine.style.overflow = '';
					_lesson.cohorts.each(function(c){
						if(first) first = false;
						else secondLine.appendChild(tag('span', '', '', ', '))
					
						var clink = tag('span', 'cursor:pointer;text-decoration:underline', null, 
							cohort.onLesson.toString(c), {'data-val': c.cohort});
						clink.onclick = onCohortClick;
						secondLine.appendChild(clink)
					});
				}
				
				var ttip = tag('div', 'background:#ffffff;border: 1px solid #797979;width:210px;padding:10px', 'arial'),
					ttipLink = tag('span', 'cursor:pointer;text-decoration:underline', null, subject.toString(_lesson.subject)),
					ttipType = tag('span', 'color:#A1A1A1', null, ' (' + lesson.typeToString(_lesson) + ')'),
					ttipRoom = tag('div', 'margin-top:5px', '', rent.name + ' ');
					
				ttipRoom.appendChild(tag('span', 'color: #999', '', '(' + buildingName + ')'))
					
				ttip.appendChild(ttipLink);
				ttip.appendChild(ttipType);
				ttip.appendChild(ttipRoom);
				
				if(_lesson.note) {
					ttip.appendChild(tag('pre', 'margin:5px 0px 0px 0px', 'arial', (_lesson.note + '').trim()));
				}
				
				tooltip(ttip).bind(result);
				
				return result;
			}
			
			var table = renderLessonGrid(data, getTDforLessons);
			
			container.innerHTML = '';
			container.appendChild(table);
			
			var resizeListener = function(){
				var height = container.offsetHeight;
				if(height < 30) return setTimeout(resizeListener, 50);
				if(!table.parentNode) removeListener('resize', resizeListener, window);
				var w = window.innerWidth - 30;
				table.style.maxWidth = table.style.width = table.style.minWidth = container.style.width = w + 'px';
				container.style.left = '-' + (w/2) + 'px';
				outerBlock.style.height = container.offsetHeight + 'px';
			}
			addListener('resize', resizeListener, window);
			setTimeout(resizeListener, 1);
			
		},
		onFindFreeRoomClick: function(){
			var popupContent = template(
				'<div class="arial" style="margin:15px;overflow:auto;height:95%">'+
					'<div>Искать среди аудиторий:</div>'+
					'<div data-widget-name="roomInputPack" id="free_rooms_popup_room_list_input_pack" style="margin:10px"></div>'+
					'<div data-widget-name="tabGroup" data-widget-param-active-tab-header-class="unactive" data-widget-param-unactive-tab-header-class="active" id="free_rooms_popup_type_tabs">'+
					'	<div data-name="routined" data-title="Регулярное\nмероприятие" data-default-active="true" data-header-style="font-size:13px;text-decoration:underline;padding:5px 0px 3px 0px;top:1px;border:0px;width:50%" style="background:#f2f2f2;padding:15px">'+
					'		<div>Неделя:</div>'+
					'		<select id="free_rooms_popup_routined_week_oddity_select" style="margin:5px 0px;display:inline-block;width:150px">'+
					'			<option value="all" selected="selected">все</option>'+
					'			<option value="even">четная</option>'+
					'			<option value="odd">нечетная</option>'+
					'		</select>'+
					'		<div style="margin:5px 0px">День недели:</div>'+
					'		<input type="checkbox" id="free_rooms_popup_routined_dow_checkbox_1" style="margin-left:0px">Пн'+
					'		<input type="checkbox" id="free_rooms_popup_routined_dow_checkbox_2" style="margin-left:10px">Вт'+
					'		<input type="checkbox" id="free_rooms_popup_routined_dow_checkbox_3" style="margin-left:10px">Ср'+
					'		<input type="checkbox" id="free_rooms_popup_routined_dow_checkbox_4" style="margin-left:10px">Чт'+
					'		<input type="checkbox" id="free_rooms_popup_routined_dow_checkbox_5" style="margin-left:10px">Пт'+
					'		<input type="checkbox" id="free_rooms_popup_routined_dow_checkbox_6" style="margin-left:10px">Сб'+
					'	</div>'+
					'	<div data-name="single" data-title="Разовое\nмероприятие" style="background:#f2f2f2;padding:15px" data-header-style="font-size:13px;text-decoration:underline;padding:5px 0px 3px 0px;top:1px;border:0px;width:50%;">'+
					'		<div data-widget-name="dayCalendar" data-widget-param-selectable="true" id="free_rooms_popup_single_calendar" style="margin-left:auto;margin-right:auto;"></div>'+
					'	</div>'+
					'</div>'+
					'<div style="margin:10px">Время:</div>'+
					'<div>с <select id="free_rooms_popup_start_selector" style="margin:0px 10px"></select> до <select id="free_rooms_popup_end_selector" style="margin:0px 10px"></select></div>'+
					'<div style="margin:10px 0px">Длительность мероприятия:</div>'+
					'<div data-widget-name="timeGapInput" data-widget-param-accuracy="minutes" data-widget-param-hour-sign="ч" data-widget-param-minute-sign="м" style="margin:10px 0px" id="free_rooms_popup_event_length"></div>' + 
					'<div style="text-align:right"><input type="button" value="Показать" id="free_rooms_popup_show_button"/></div>'+
					'</div>'+
				'</div>'
			).toTag();
			var selectorPopup = popup(
				popupContent, 
				{title:'Свободная аудитория', width:min(window.innerWidth, 400), height: min(window.innerHeight, 600)-9}
			);
			
			el('free_rooms_popup_room_list_input_pack')
				.buildings(db.data.building.map(building.toString))
				.rooms(db.data.room)
				.value(db.data.room.flfield('is_external', false).map(function(v,k){return k}).toArr().first(10));
				
			var eventLengthInput = el('free_rooms_popup_event_length'),
				startTimeInput = el('free_rooms_popup_start_selector'),
				endTimeInput = el('free_rooms_popup_end_selector'),
				starts = slot.startTimes(), ends = slot.endTimes();
			
			endTimeInput.innerHTML = '';
			startTimeInput.innerHTML = '';
			
			eventLengthInput.value({hours:1, minutes:20});
			
			starts.each(function(str, time){ startTimeInput.appendChild(tag('option', '', '', str, {value:time})); });
			ends.each(function(str, time){ endTimeInput.appendChild(tag('option', '', '', str, {value:time})); });
			
			startTimeInput.onchange = function(){
				var s = parseInt(startTimeInput.value);
				endTimeInput.innerHTML = '';
				ends.fl(function(str, time){ time = parseInt(time); return time > s; })
					.each(function(str, time){ endTimeInput.appendChild(tag('option', '', '', str, {value:time})); });
			}
			
			endTimeInput.onchange = function(){
				var s = parseInt(endTimeInput.value);
				startTimeInput.innerHTML = '';
				starts.fl(function(str, time){ time = parseInt(time); return time < s; })
					.each(function(str, time){ startTimeInput.appendChild(tag('option', '', '', str, {value:time})); });
			}
			
			el('free_rooms_popup_show_button').onclick = function(){
				var params = pageHash.getParams();
				params.once = el('free_rooms_popup_type_tabs').getActiveTabName() === 'single';
				params.start = startTimeInput.value;
				params.end = endTimeInput.value;
				var len = eventLengthInput.value();
				params.len = ((len.hours * 60) + len.minutes) * 60;
				params.rooms = el('free_rooms_popup_room_list_input_pack').value().join('-');
				if(params.once){
					var date = el('free_rooms_popup_single_calendar').value();
					params.date = date.day + '-' + date.month + '-' + date.year;
				} else {
					params.odd = el('free_rooms_popup_routined_week_oddity_select').value;
					for(var i = 1; i <= 6; i++)
						params['d' + i] = el('free_rooms_popup_routined_dow_checkbox_' + i).checked;
				}
				selectorPopup.hide();
				pageHash.setParams(params);
			}
		},
		onShowRoomLoadClick: function(){
			var popupContent = template(
				'<div style="margin:15px;overflow:auto;height:95%">'+
				'	<div data-widget-name="roomInputPack" id="owned_rooms_popup_room_list_input_pack" style="margin:10px"></div>'+
				'	<div style="text-align:right"><input type="button" value="Показать" id="owned_rooms_popup_show_button"/></div>'+
				'</div>'
			).toTag();
			var selector = popup(
				popupContent, 
				{title:'График занятости аудиторий', width:min(window.innerWidth, 400), height: min(window.innerHeight, 250)-9}
			);
			
			el('owned_rooms_popup_room_list_input_pack')
				.buildings(db.data.building.map(building.toString))
				.rooms(db.data.room)
				.value(db.data.room.flfield('is_external', false).map(function(v,k){return k}).toArr().first(10));
			
			el('owned_rooms_popup_show_button').onclick = function(){
				var rooms = el('owned_rooms_popup_room_list_input_pack').value(),
					params = pageHash.getParams();
					
				params.load = true;
				params.rooms = rooms.join('-');
					
				pageHash.setParams(params);
				selector.hide();
			};
		},
		getCapableSpans: function(lessons, room, dayNum, odd, start, end, len){
		
			var span = new timeSpan(start, end);
			
			lessons.flfield('room', room)
				.map(function(l){ return slot.breakSimple(db.data.slot[l.slot]) })
				.fl(bool)
				.flfield('day', dayNum)
				.flfield('odd', odd)
				.toArr()
				.each(function(s){ 
					span.cut(
						(((s.starth * 60) + s.startm) * 60) % secondsInDay, 
						(((s.endh * 60) + s.endm) * 60) % secondsInDay
					);
				});
				
			return span.getCapable(len);
		
		},
		viewFreeRoomsOnce: function(start, end, rooms, date, len){
			// TODO: впилить поддержку одноразовых событий
			
			el('schedule_display_free_date').style.display = '';
			el('schedule_display_free_oddity').style.display = 'none';
			el('schedule_display_free_date_container').textContent = date.day + ' ' + monthNames[date.month][cases.genitive];
			el('schedule_display_free_start_container').textContent = slot.formatTime(start);
			el('schedule_display_free_end_container').textContent = slot.formatTime(end);
			el('schedule_display_free_length_container').textContent = slot.formatTime(len);
			
			var dow = (new Date(date.year, date.month, date.day).getDay() + 6) % 7,
				weekNum = getCompleteWeekNumber((new Date(date.year, date.month, date.day).getTime()) / 1000),
				odd = (weekNum % 2) !== 0,
				outerContainer = el('schedule_display_free_result_container'),
				resultContainer = tag('table', '', 'arial'),
				lessons = schedule.main().lessons;
				
			outerContainer.innerHTML = '';
			outerContainer.appendChild(resultContainer);
				
			var getRoomRow = function(r, spans){
				var row = tag('tr'),
					link = tag('td', 'text-decoration:underline;cursor:pointer;text-align:left;font-size:16px;padding:0px 5px', '', db.data.room[r].name),
					time = tag('td', 'text-align:left;color:#6B6B6B;font-size:14px;padding:0px 5px');
					
				var timeStr = '';
				spans.each(function(span){
					if(timeStr) timeStr += ', ';
					timeStr += 'c ' + slot.formatTime(span.start) + ' до ' + slot.formatTime(span.end);
				});
				
				time.textContent = '(свободна ' + timeStr + ')';
					
				row.appendChild(link);
				row.appendChild(time);
				
				link.onclick = function(){
					var params = pageHash.getParams();
					
					delete params.start;
					delete params.end;
					delete params.len;
					delete params.rooms;
					delete params.once;
					delete params.advanced;
					delete params.date;
					
					params.type = 'room';
					params.id = r;
					pageHash.setParams(params);
				}
				
				return row;
			}
				
			var resultRows = rooms.spawn(function(res, room){
				var spans = shreds.scheduleDisplayTab.getCapableSpans(lessons, room, dow, odd, start, end, len);
				return spans.isEmpty()? res: res.add(getRoomRow(room, spans));
			}, []);
			
			if(resultRows.isEmpty()){
				el('schedule_display_free_no_results').style.display = 'block';
				return;
			}
			
			el('schedule_display_free_no_results').style.display = 'none';
			resultRows.each(function(row){ resultContainer.appendChild(row); });
			
		}, 
		viewFreeRoomsRegular: function(start, end, rooms, odd, days, len){
		
			var getRoomLink = function(id, gaps){
				var result = tag('div', 'margin:10px 0px;cursor:pointer;text-decoration:underline;font-size:16px;text-align:left;width:140px', '', db.data.room[id].name);
				
				var tooltipWrap = tag('div', 'background:#f2f2f2;border:1px solid #333333;width:100px', '', 'Свободна:');
				gaps.each(function(g){
					tooltipWrap.appendChild(tag('div', '', '', slot.formatTime(g.start) + ' - ' + slot.formatTime(g.end)))
				});
				tooltip(tooltipWrap).bind(result);
				
				result.onclick = function(){
					var params = pageHash.getParams();
					
					delete params.start;
					delete params.end;
					delete params.len;
					delete params.rooms;
					delete params.once;
					delete params.advanced;
					
					params.type = 'room';
					params.id = id;
					pageHash.setParams(params);
				}
				return result;
			}
		
			var fillDowRoomRows = function(days, gapsByRooms, head, body){
				days.each(function(v, num){
					num = parseInt(num) - 1;
					
					if(!v || !dayNames[num]) return;
					
					head.appendChild(tag('td', 'padding:10px 0px 0px 10px;text-align:left;font-size:18px;width:140px;vertical-align:top;', '', dayNames[num].cases.first().capitalize()));
					var column = tag('td', 'padding:5px 0px 5px 10px;width:160px;vertical-align:top');
					body.appendChild(column);
					if(gapsByRooms[num].isEmpty()){
						column.appendChild(tag('div', 'text-align:left;width:150px;color:#868686;font-size:13px', '', 'свободных аудиторий нет, попробуйте изменить параметры поиска'));
					} else gapsByRooms[num].each(function(gaps, id){ 
						column.appendChild(getRoomLink(parseInt(id), gaps)) 
					});
				});
			}
			
			var renderOneTable = function(gapsByRooms, days){
				var result = tag('table', '', 'arial'), head = tag('tr'), body = tag('tr');
					
				result.appendChild(head);
				result.appendChild(body);
					
				fillDowRoomRows(days, gapsByRooms, head, body);
				
				return result;
			}
			
			var renderTwoTables = function(gapsByRooms, days){
				var result = tag('table', '', 'arial'), head, body, i;
				
				head = tag('tr');
				body = tag('tr');
				
				result.appendChild(head);
				result.appendChild(body);
				
				fillDowRoomRows(days, gapsByRooms.spawn(function(res, v, k){
					k = parseInt(k);
					if(k < 7)
						res[k] = v;
					return res;
				}, {}), head, body);
				
				for(i = 0; i < head.children.length; i++)
					head.children[i].style.borderBottom = '1px solid black';
				
				head.insertBefore(tag('td', 'border-right:1px solid black;text-align:left;vertical-align:top;font-size:18px;padding:10px 10px 0px 0px', '', 'Чет', {rowspan:'2'}), head.children[0]);
				
				result.appendChild(tag('tr', 'height:50px'));
				
				head = tag('tr');
				body = tag('tr');
				
				result.appendChild(head);
				result.appendChild(body);
				
				fillDowRoomRows(days, gapsByRooms.spawn(function(res, v, k){
					k = parseInt(k);
					if(k >= 7)
						res[k - 7] = v;
					return res;
				}, {}), head, body);
				
				for(i = 0; i < head.children.length; i++)
					head.children[i].style.borderBottom = '1px solid black';
				
				head.insertBefore(tag('td', 'border-right:1px solid black;text-align:left;vertical-align:top;font-size:18px;padding:10px 10px 0px 0px', '', 'Нечет', {rowspan:'2'}), head.children[0]);
				
				result.appendChild(tag('tr', 'height:50px'));
				
				return result;
			}
			
			if(!days || days.isEmpty() || !days.spawn(function(res, d){ return res || d }, false)){
				days = {1: true, 2: true, 3: true, 4: true, 5: true, 6: true};
				el('schedule_display_free_dow_container').style.display = 'none';
			} else {
				var dowContainer = el('schedule_display_free_dow_container');
				dowContainer.style.display = '';
				dowContainer.innerHTML = '';
				dowContainer.textContent = days.spawn(function(res, v, k){
					k = parseInt(k) - 1;
					return (!v || k > 6 || !dayShortenings[k])? res: res.add(dayShortenings[k]);
				}, []).join(', ');
			}
	
			el('schedule_display_free_date').style.display = 'none';
			switch(odd){
				case 'odd':
					el('schedule_display_free_oddity').style.display = '';
					el('schedule_display_free_oddity_container').textContent = 'нечетная';
					break;
				case 'even':
					el('schedule_display_free_oddity').style.display = '';
					el('schedule_display_free_oddity_container').textContent = 'четная';
					break;
				default:
					el('schedule_display_free_oddity').style.display = 'none';
					break;
			}
			
			el('schedule_display_free_start_container').textContent = slot.formatTime(start);
			el('schedule_display_free_end_container').textContent = slot.formatTime(end);
			el('schedule_display_free_length_container').textContent = slot.formatTime(len);
		
			var lessons = schedule.main().lessons;
			
			var getFreeRoomsForDay = function(day){
				var odd = (day / 7) >= 1;
				day %= 7;
				return rooms.spawn(function(res, room){
					var spans = shreds.scheduleDisplayTab.getCapableSpans(lessons, room, day, odd, start, end, len);
					if(!spans.isEmpty())
						res[room] = spans;
					return res;
				}, {});
			}
		
			var neededDays = [];
			if(odd === 'even' || odd === 'all')
				neededDays.addAll(days.spawn(function(res, v, k){ return v? res.add(parseInt(k) - 1): res }, []))
			if(odd === 'odd' || odd === 'all')
				neededDays.addAll(days.spawn(function(res, v, k){ return v? res.add(parseInt(k) + 6): res }, []))
				
			var roomsByDays = neededDays.spawn(function(res, v){
				res[v] = getFreeRoomsForDay(v);
				return res;
			}, {});
			
			var odditySplit = odd === 'all' && days.spawn(function(res, v, k){
				if(!v || res) return res;
				k = parseInt(k) - 1;
				return !roomsByDays[k].equals(roomsByDays[k + 7]);
			}, false);
			
			var empty = roomsByDays.spawn(function(res, r){ return res && r.isEmpty() }, true),
				resultContainer = el('schedule_display_free_result_container');
			
			resultContainer.innerHTML = '';
					
			if(empty){
				el('schedule_display_free_no_results').style.display = 'block';
				return;
			}
			
			el('schedule_display_free_no_results').style.display = 'none';
			
			if(!odditySplit && odd === 'odd'){
				roomsByDays = roomsByDays.spawn(function(res, v, k){
					res[parseInt(k) - 7] = v;
					return res;
				}, {});
			}
			
			resultContainer.appendChild((odditySplit? renderTwoTables: renderOneTable)(roomsByDays, days));
			
		},
		viewRoomsLoad: function(rooms, oddity){
			
			var table = tag('table', 'width:100%'),
				tr = tag('tr'),
				days = slot.days(),
				roomsRev = rooms.toReverseAssoc(true),
				roomsBySlots,
				rowspan = (oddity === 'all')? 2: 1;
				
			roomsBySlots = schedule.main().lessons
				.fl(function(l){ return roomsRev[l.room]; })
				.divideBy('slot')
				.map(function(div){
					return div.spawn(function(res, val){
						res[val.room] = true;
						return res;
					}, {});
				});
				
			table.appendChild(tr);
			
			tr.appendChild(tag('th', '', '', 'Пара'));
			tr.appendChild(tag('th', '', '', 'Время'));
			if(rowspan === 2)
				tr.appendChild(tag('th', '', '', 'Неделя'));
			
			days.each(function(d){ tr.appendChild(tag('th', '', '', d)); });
			
			var getFreeRoomIdsForSlot = function(slotId){
				return rooms.fl(function(rid){
					
					return !roomsBySlots[slotId] || !roomsBySlots[slotId][rid];
				});
			};
			
			var brokenSlots = db.data.slot.map(slot.breakSimple).spawn(function(res, s){
				res[s.start_time] = s;
				return res;
			}, {});
			
			var getSlotIdForComponents = function(dow, inDaySlot, odd){
				return brokenSlots[(dow * secondsInDay) + inDaySlot.start_time + (odd? secondsInWeek: 0)].id;
			};
			
			var getRoomLink = function(roomId){
				var result = tag('span', 'text-decoration:underline;cursor:pointer', '', db.data.room[roomId].name);
				result.onclick = function(){
					var params = pageHash.getParams();
					
					delete params.start;
					delete params.end;
					delete params.len;
					delete params.rooms;
					delete params.once;
					delete params.advanced;
					delete params.date;
					
					params.type = 'room';
					params.id = roomId;
					pageHash.setParams(params);
				}
				return result;
			};
			
			slot.inDay().each(function(inDaySlot){
				var broke = slot.break(null, inDaySlot),
					slotNum = slot.numberInDay(inDaySlot) + 1;
			
				table.appendChild(tr = tag('tr'));
				tr.appendChild(tag('th', '', '', slotNum, {rowspan: rowspan}));
				tr.appendChild(tag('th', '', '', broke.str.starth + ':' + broke.str.startm + ' - ' + broke.str.endh + ':' + broke.str.endm, {rowspan: rowspan}));
				
				var generateRowForOdd = function(odd){
					if(rowspan === 2)
						tr.appendChild(tag('th', '', '', odd? 'нечет': 'чет'));
					days.each(function(dayName, dow){
						dow = parseInt(dow);
						
						var td = tag('td','border: 1px solid #999');
						tr.appendChild(td);
						
						var slotId = getSlotIdForComponents(dow, inDaySlot, odd);
						getFreeRoomIdsForSlot(slotId).map(getRoomLink).each(function(link, key){
							if(parseInt(key) !== 0) td.appendChild(tag('span', '', '', ', '));
							td.appendChild(link);
						});
					});
				}
				
				if(oddity === 'odd' || oddity === 'all') generateRowForOdd(true);
				if(oddity === 'all') table.appendChild(tr = tag('tr'));
				if(oddity === 'even' || oddity === 'all') generateRowForOdd(false);
				
				
			});
			
			var resultTableContainer = el('schedule_display_owned_result_container');
			resultTableContainer.innerHTML = '';
			resultTableContainer.appendChild(table);
			
		}
	},
	markup: 
'<div data-widget-name="tabGroup" id="schedule_display_screen_tabs">'+
'	<div data-name="main" style="display:none" data-default-active="true">'+
		'<div style="width:94%;margin-left:3%">'+
		'	<div style="width:100%;margin:30px 0px 10px 0px;">'+
		'		<div style="font-size:20px;font-weight:bold;display:inline" class="arial">Поиск</div>'+
		'		<div data-widget-name="domainInput" id="schedule_display_value_input" style="width:250px;display:inline-block;margin:10px;" class="big-input-container"></div>'+
		'		<input type="button" value="Искать" onclick="shreds.scheduleDisplayTab.displayLessonsByFilter()"/>'+
		'	</div>'+
		'	<div style="width:100%" class="arial">'+
		'		<div style="text-decoration:underline;cursor:pointer" onclick="shreds.scheduleDisplayTab.toggleAdvancedPanel()">расширенный поиск'+
		'			<div style="display:inline-block" id="schedule_display_advanced_toggler_arrow" class="arrow-down"></div>'+
		'		</div>'+
		'		<div id="schedule_display_advanced_panel" style="transition-duration: 0.5s;max-height:1px;height:115px;overflow:hidden">'+
		'			<div style="margin-top:15px">'+
		'				<div style="display:inline-block;width:175px">Неделя</div>'+
		'				<div style="display:inline-block">День недели</div>'+
		'			</div>'+
		'			<div style="margin-top:5px">'+
		'				<div style="display:inline-block;width:175px">'+
		'					<select id="schedule_display_week_oddity_select" style="width:150px;height:22px" onchange="pageHash.setParam(\'odd\', el(\'schedule_display_week_oddity_select\').value)">'+
		'						<option value="all" selected="selected">все</option>'+
		'						<option value="even">четная</option>'+
		'						<option value="odd">нечетная</option>'+
		'					</select>'+
		'				</div>'+
		'				<div style="display:inline-block;">'+
		'					<input type="checkbox" id="schedule_display_dow_filter_1" onchange="pageHash.setParam(\'d1\', el(\'schedule_display_dow_filter_1\').checked)"> Пн'+
		'					<input type="checkbox" id="schedule_display_dow_filter_2" onchange="pageHash.setParam(\'d2\', el(\'schedule_display_dow_filter_2\').checked)"> Вт'+
		'					<input type="checkbox" id="schedule_display_dow_filter_3" onchange="pageHash.setParam(\'d3\', el(\'schedule_display_dow_filter_3\').checked)"> Ср'+
		'					<input type="checkbox" id="schedule_display_dow_filter_4" onchange="pageHash.setParam(\'d4\', el(\'schedule_display_dow_filter_4\').checked)"> Чт'+
		'					<input type="checkbox" id="schedule_display_dow_filter_5" onchange="pageHash.setParam(\'d5\', el(\'schedule_display_dow_filter_5\').checked)"> Пт'+
		'					<input type="checkbox" id="schedule_display_dow_filter_6" onchange="pageHash.setParam(\'d6\', el(\'schedule_display_dow_filter_6\').checked)"> Сб'+
		'				</div>'+
		'			</div>'+
		'			<div style="margin-top:15px">'+
		'				Найти '+
		'					<span style="text-decoration:underline;cursor:pointer" onclick="shreds.scheduleDisplayTab.onFindFreeRoomClick()">свободную аудиторию</span>'+
		'				или просмотреть'+
		'					<span style="text-decoration:underline;cursor:pointer" onclick="shreds.scheduleDisplayTab.onShowRoomLoadClick()">сводный график занятости аудиторий</span>'+
		'			</div>'+
		'		</div>'+
		'	</div>'+
		'</div>'+
		'<div style="width:94%;margin-left:3%;margin-top:30px" class="arial" id="schedule_display_cohort_columns">'+
		'	<hr style="margin:20px 0px"/>'+
		'	<span style="font-size:18px;margin:10px">Аудитории</span>'+
		'	<span id="room_fast_links_container" style="font-size:16px;">' +
		'	</span>' +
		'	<hr style="margin:20px 0px"/>'+
		'	<div style="margin:30px 0px 10px 10px;font-size:18px">'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block">I курс</div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block">II курс</div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block">III курс</div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block">IV курс</div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block">V курс</div>'+
		'		<div style="width:15%;display:inline-block">VI курс</div>'+
		'	</div>'+
		'	<div style="font-size:16px;margin-left:10px">'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block;vertical-align:top" id="schedule_display_year_column_1"></div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block;vertical-align:top" id="schedule_display_year_column_2"></div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block;vertical-align:top" id="schedule_display_year_column_3"></div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block;vertical-align:top" id="schedule_display_year_column_4"></div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block;vertical-align:top" id="schedule_display_year_column_5"></div>'+
		'		<div style="width:15%;display:inline-block;vertical-align:top" id="schedule_display_year_column_6"></div>'+
		'	</div>' +
		'	<hr style="margin:20px 0px"/>'+
		'	<div style="margin:10px;font-size:18px">Преподаватели</div>'+
		'	<div id="lector_fast_links_container" style="font-size:14px;">' +
		'		<div style="width:15%;margin-right:0.5%;display:inline-block;vertical-align:top" id="lector_fast_links_container_1"></div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block;vertical-align:top" id="lector_fast_links_container_2"></div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block;vertical-align:top" id="lector_fast_links_container_3"></div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block;vertical-align:top" id="lector_fast_links_container_4"></div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block;vertical-align:top" id="lector_fast_links_container_5"></div>'+
		'		<div style="width:15%;margin-right:0.5%;display:inline-block;vertical-align:top" id="lector_fast_links_container_6"></div>'+
		'	</div>' +
		'</div>' +
		'<div id="schedule_display_search_results" style="width:94%;margin-left:3%;margin-top:30px">'+
		'	<div id="schedule_display_search_results_header" style="width:100%;font-size:28px;font-weight:bold" class="arial">'+
		'	</div>'+
		'	<div style="width:100%;position:relative" class="arial">'+
		'		<div id="schedule_display_search_results_view_switch_container" style="display:inline;margin-right:30px;margin-top:15px">'+
		'			Вид расписания: '+
		'			<div style="display:inline-block;width:24px;height:24px;cursor:pointer;margin:3px 3px 0px 7px;position:relative;top:6px" onclick="pageHash.setParam(\'grid\', false)" id="schedule_display_result_view_switch_bullet_list">'+
		'				<div class="bullet-list-icon" style="margin:7px 5px"></div>'+
		'			</div>'+
		'			<div style="display:inline-block;width:24px;height:24px;cursor:pointer;margin:3px 3px 0px 3px;position:relative;top:6px" onclick="pageHash.setParam(\'grid\', true)" id="schedule_display_result_view_switch_grid_table">' +
		'				<div class="grid-table-icon" style="margin:6px"></div>'+
		'			</div>'+
		'		</div>'+
		'		<div id="schedule_display_search_results_week_switch_container" style="display:inline">'+
		'			Неделя'+
		'			<select id="schedule_display_search_results_week_switch" onchange="pageHash.setParam(\'odd\', el(\'schedule_display_search_results_week_switch\').value)" style="width:150px;margin-left:10px;">'+
		'				<option value="all">все</option>'+
		'				<option value="even">четная</option>'+
		'				<option value="odd">нечетная</option>'+
		'			<select>'+
		'		</div>'+
		'		<div style="position:absolute;right:0px;cursor:pointer" class="printer-icon"></div>'+
		'	</div>'+
		'	<div style="width:100%;margin-top:10px;">'+
		'		<div style="height:12px;width:12px;border:1px solid #99CCFF;background:#CEE7FF;display:inline-block;position:relative;top:3px"></div>'+
		'		 - текущее занятие'+
		'	</div>'+
		'	<div id="schedule_display_search_results_views_container">'+
		'		<div id="schedule_display_search_results_bullet_list_view"></div>'+
		'		<div id="schedule_display_search_results_grid_table_view" style="position:relative;width:0px;margin-left:auto;margin-right:auto">' +
		' 			<div id="schedule_display_search_results_grid_table_view_container" style="position:absolute;"></div>' +
		'		</div>'+
		'	</div>'+
		'</div>'+
'	</div>'+
'	<div data-name="free" style="display:none">'+
'		<div style="font-size:28px;margin:20px 0px" class="arial">Свободные аудитории</div>'+
'		<div style="font-size:16px;margin:0px 0px 20px 0px" class="arial">'+
'			<span id="schedule_display_free_oddity">'+
'				<span id="schedule_display_free_oddity_container" style="font-weight:bold"></span>'+
'			неделя </span>'+
'			<span id="schedule_display_free_date">на '+
'				<span id="schedule_display_free_date_container" style="font-weight:bold"></span>'+
'			</span>'+
'			<span id="schedule_display_free_dow_container" style="font-weight:bold"></span>'+
'			с <span id="schedule_display_free_start_container" style="font-weight:bold"></span>'+
'			до <span id="schedule_display_free_end_container" style="font-weight:bold"></span>'+
'			на <span id="schedule_display_free_length_container" style="font-weight:bold"></span>'+
'			<span style="color:#333;font-size:13px">'+
'				(<span style="text-decoration:underline;cursor:pointer" onclick="shreds.scheduleDisplayTab.onFindFreeRoomClick()">изменить параметры поиска</span>)'+
'			</span>'+
'		</div>'+
'		<div id="schedule_display_free_no_results">К сожалению, не удалось найти аудиторию, удовлетворящую данным условиям,<br/>попробуйте изменить параметры и повторите поиск</div>' + 
'		<div id="schedule_display_free_result_container"></div>'+
'	</div>'+
'	<div data-name="owned" style="display:none;margin:30px 3%">'+
'		<span style="font-size:28px" class="arial">Сводный график занятости аудиторий</span>'+
'		<span style="color:#333;font-size:13px">'+
'			(<span style="text-decoration:underline;cursor:pointer" onclick="shreds.scheduleDisplayTab.onShowRoomLoadClick()">изменить список аудиторий</span>)'+
'		</span>'+
'		<div style="margin:15px 0px"> Неделя '+
'			<select id="schedule_display_owned_oddity_select" onchange="pageHash.setParam(\'odd\', el(\'schedule_display_owned_oddity_select\').value)">'+
'				<option value="all">все</option>'+
'				<option value="even">четная</option>'+
'				<option value="odd">нечетная</option>'+
'			</select>'+
'		</div>'+
'		<div id="schedule_display_owned_result_container"></div>'+
'	</div>'+
'</div>'
});

