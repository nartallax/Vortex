// главный шред. к нему привязываются все остальные шреды
shred.define({
	requirements: [],
	name: 'main',
	init: function(tag){ document.body.appendChild(tag); },
	methods: {},
	markup: 
'<div style="position:relative;width:100%;height:100%;overflow-y:scroll">'+
'	<div style="position:relative;max-width:1000px;margin-left:auto;margin-right:auto;min-height:100%;box-sizing:border-box;padding-bottom:80px">' +
'		<div id="main_shred" style="width:100%;height:100%"></div>' +
'		<div style="position:absolute;bottom:0px;left:0px;right:0px;height:80px;">' + 
'			<div style="max-width:1000px;margin-left:auto;margin-right:auto;margin-top:10px;font-size:13px" class="arial">' +
'				<hr/>' + 
'				<div style="position:absolute;top:35px;left:40px">ИТМО 2014-2015</div>'+ 
'				<div style="position:absolute;top:35px;left:0px;right:0px;text-align:center;text-decoration:underline;cursor:pointer" id="footer_links"><div style="display:inline;margin:10px" id="footer_link_main">Главная</div></div>'+ 
'			</div>' +
'		</div>' +
'	</div>'+
'</div>'
});