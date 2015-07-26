// кусок топБара, показывающийся при залогиненном админе

shred.define({
	requirements: ['topBar'],
	name: 'adminTopBar',
	priority: 0,
	init: function(markup){ 
		el('top_bar_inner_container').appendChild(markup);
		
		db.listen('roleChanged', function(){
			markup.style.display = db.getRole() === 'protected'? 'block': 'none';
		});
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
'	<div style="position:absolute;right:110px;padding-top:4px">Администратор</div>'+
'	<input style="position:absolute;right:0px;width:100px;height:24px" type="button" value="Выход" onclick="shreds.adminTopBar.logOff()"/>'+
'</div>'
});
