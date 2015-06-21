// полоска с элементами управления наверху страницы

shred.define({
	requirements: ['main'],
	name: 'topBar',
	priority: 0,
	init: function(markup){
		el('main_shred').appendChild(markup);
		
		var weekDisplay = el('week_number_top_bar_display'),
			weekEdit = el('week_number_top_bar_edit'),
			weekEditOddity = el('week_number_top_bar_edit_oddity_container'),
			weekEditInput = el('week_number_top_bar_edit_input');
		
		db.listen('roleChanged', function(){
			(db.getRole() === 'protected'? weekEdit: weekDisplay).style.display = 'inline';
			(db.getRole() !== 'protected'? weekEdit: weekDisplay).style.display = 'none';
		});
		
		db.misc.weekShift.listen('dataUpdated', function(){
			var displayedNum = getRawWeekNumber() + db.misc.weekShift.value;
			
			weekEditInput.value = displayedNum;
			weekEditOddity.textContent = (displayedNum % 2) === 0? 'четная': 'нечетная';
			weekDisplay.textContent = weekEditOddity.textContent + ' ' + displayedNum;
		});
	},	
	methods: {
		setWeekNumber: function(){
			var val = el('week_number_top_bar_edit_input').value;
			if(parseInt(val).toString() !== val) return db.misc.weekShift.fire('dataUpdated');
			var shift = parseInt(el('week_number_top_bar_edit_input').value) - getRawWeekNumber();
			conjure('setWeekShift', {value: shift}).then(function(){
				db.misc.weekShift.value = shift;
				db.misc.weekShift.fire('dataUpdated');
			});
		}
	},
	markup: 
'<div style="position:relative;background:#F2F2F2;height:auto;overflow:visible;min-height:60px" id="top_bar">' + 
'	<div style="position:relative;width:100%;height:100%">' + 
'		<div style="" id="top_bar_additional_button_container"></div>' + 
'		<div style="position:absolute;left:40px;font-size:22px;top:18px;font-weight:bold;cursor:pointer;" id="top_bar_title_container">' + 
'			Система управления учебным расписанием' + 
'		</div>' +
'		<div style="position:absolute;left:540px;top:20px;padding:3px;border:1px solid #BCBCBC;background:#E4E4E4;font-size:13px" class="arial">' + 
'			<div id="week_number_top_bar_display" style="display:none">загрузка...</div>' +
'			<div id="week_number_top_bar_edit" style="display:none">' +
'				<div style="display:inline" id="week_number_top_bar_edit_oddity_container">загрузка...</div>' +
'				<input type="number" value="0" id="week_number_top_bar_edit_input" style="width:50px" onchange="shreds.topBar.setWeekNumber()"/>' +
'			</div>' +
'			неделя' +
'		</div>' +
'		<div style="position:absolute;right:30px;left:0px;top:20px;bottom:0px;overflow:visible" id="top_bar_inner_container"></div>' + 
'	</div>' + 
'</div>'
});
