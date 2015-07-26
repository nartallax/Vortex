// кусок топБара, показывающийся при залогиненном лекторе

shred.define({
	requirements: ['topBar'],
	name: 'lectorTopBar',
	priority: 0,
	init: function(markup){ 
		el('top_bar_inner_container').appendChild(markup);
		
		var updateLectorNameLabel = function(){
			el('lector_top_bar_lector_name').textContent = lector.toString(db.data.lector[db.user.id]);
		}
		
		db.listen('roleChanged', function(){
			markup.style.display = db.getRole() === 'lector'? 'block': 'none';
			updateLectorNameLabel();
		});
		
		db.ents.lector.listen('dataUpdated', updateLectorNameLabel);
	},	
	methods: {
		logOff: function(){
			conjure('logOff').then(checkOkStatus).then(function(d){
				delete db.user.id;
				db.setRole('free');
			});
		}
	},
	markup: 
'<div style="position:absolute;right:0px;left:0px;">'+
'	<div style="position:absolute;right:110px;padding-top:4px" id="lector_top_bar_lector_name"></div>'+
'	<input style="position:absolute;right:0px;width:100px;height:24px" type="button" value="Выход" onclick="shreds.lectorTopBar.logOff()"/>'+
'</div>'
});
