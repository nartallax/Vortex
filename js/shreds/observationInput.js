// поле ввода отзывов

shred.define({
	requirements: ['topBar'],
	name: 'observationInput',
	priority: -100400,
	init: function(markup){ 
		var button = tag('div', 'display:inline;margin:10px', null, 'Оставить отзыв');
		button.onclick = function(){
			if(shreds.observationInput.popup){
				shreds.observationInput.popup.hide();
			}
			shreds.observationInput.popup = popup(markup);
			shreds.observationInput.popup.show();
			
			if(db.getRole() === 'lector'){
				var authorInput = el('observation_author');
				authorInput.disabled = true;
				authorInput.value = lector.toString(db.user.id);
			}
			
		}
		el('footer_links').appendChild(button);
	},	
	methods: {
		send: function(){
			var author = el('observation_author').value, text = el('observation_text').value;
			conjure('sendObservation', {poster:author, text:text}).then(checkOkStatus).then(function(r){
				if(el('observation_author').disabled + '' !== 'true') el('observation_author').value = '';
				el('observation_text').value = '';
				
				popup.alert('Отзыв успешно отправлен.');
				
				var obs = observation.ofPrefs();
				if(obs){
					obs[r.data.toString()] = text;
					db.ents.preference.fire('dataUpdated');
				}
				
				if(shreds.observationInput.popup){
					shreds.observationInput.popup.hide();
					shreds.observationInput.popup = undefined;
				}
			});
		}
	},
	markup: 
'<div style="position:absolute;top:5px;left:5px;right:5px;height:60px">'+
'	1. Все отправленные отзывы сохраняются на сервере и будут прочтены.<br/>'+
'	2. Наиболее ценны отзывы об отсутствующем/ошибочно реализованном функционале.<br/>'+
'</div>'+
'<div style="position:absolute;left:5px;right:5px;top:65px;bottom:35px">'+
'	<input type="text" placeholder="Автор" id="observation_author" style="position:absolute;left:0px;right:0px;top:0px;height:20px;width:100%;padding:0px;border:1px solid #999;margin:-1px"/>'+
'	<textarea placeholder="Текст отзыва" id="observation_text" style="resize:none;position:absolute;left:0px;right:0px;top:30px;bottom:0px;width:100%;padding:0px;border:1px solid #999;margin:-1px"></textarea>'+
'</div>'+
'<input type="button" value="Отправить" onclick="shreds.observationInput.send()" style="position:absolute;bottom:5px;height:20px;right:5px;width:100px"/>'
});
