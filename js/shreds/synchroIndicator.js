// индикатор общения с сервером
shred.define({
	requirements: ['main'],
	name: 'synchroIndicator',
	priority: -100500,
	init: function(markup){ 
		document.body.appendChild(markup);
	},	
	methods: {
		show: function(){
			shreds.synchroIndicator.lockLevel++;
			setTimeout(shreds.synchroIndicator.checkLevel, 50);
		}, hide: function(){
			shreds.synchroIndicator.lockLevel--;
			setTimeout(shreds.synchroIndicator.checkLevel, 50);
		},
		checkLevel: function(){
			var isShown = el('synchro_indicator').style.opacity === '1',
				mustBeShown = shreds.synchroIndicator.lockLevel !== 0;
			if(isShown === mustBeShown) return;
			
			if(shreds.synchroIndicator.handle !== undefined)
				clearTimeout(shreds.synchroIndicator.handle);
			
			var node = el('synchro_indicator');
			
			setTimeout(function(){ node.style.opacity = mustBeShown? '1': '0'; }, 1);
			if(mustBeShown){
				node.style.opacity = '0';
				node.style.display = 'block';
			} else shreds.synchroIndicator.handle = setTimeout(function(){ node.style.display = 'none'; }, 250);
		},
		lockLevel: 0,
		handle: undefined
	},
	markup: 
'<div id="synchro_indicator" style="opacity:0;position:absolute;right:0px;bottom:0px;border:1px solid #999;background:#eee;width:275px;height:42px;transition-duration:0.25s">' + 
'	<div style="display:block;position:absolute;top:5px;left:5px" class="refresh-icon"></div>'+
'	<div style="display:block;position:absolute;top:13px;left:42px;right:5px;text-align:center">Обмен данными...</div>' +
'</div>'
});
