// таб-группа с основным содержимым страниц

shred.define({
	requirements: ['main'],
	name: 'contentTabBar',
	priority: -100,
	init: function(tag){ 
		el('main_shred').appendChild(tag); 
	},	
	methods: {
		activate: function(name){ el('content_tab_bar').activate(name); }
	},
	markup:  '<div id="content_tab_bar" data-widget-name="tabGroup" style="margin-top:25px"></div>'
});
