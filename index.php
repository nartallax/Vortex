<?php
	require_once('./protected/utils.php');
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html>
	<head>
		<!-- Vortex scheduling system -->
		<!-- Written by Nartallax, 2014-2015 -->
		<meta charset="UTF-8">
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
		<meta http-equiv="x-ua-compatible" content="ie=edge"/>
		
		<link rel="shortcut icon" href="data:image/x-icon;base64,AAABAAIAEBAAAAAAIABoBAAAJgAAACAgAAAAACAAqBAAAI4EAAAoAAAAEAAAACAAAAABACAAAAAAAEAEAAAAAAAAAAAAAAAAAAAAAAAA////Af///wH///8B////ASYmJjEjIyOXHx8f2RsbG/kWFhb5EhIS2Q4ODpcLCwsx////Af///wH///8B////Af///wH///8BNTU1CywsLJspKSn9JSUl3SsrK7E0NDSzLy8vsRwcHK8MDAzdCAgI/QkJCZsoKCgL////Af///wH///8BNTU1CzIyMsEvLy/zQkJCpWFhYc1dXV3/V1dX/1JSUv9LS0v/REREyx0dHaMkJCTzW1tbwYKCggn///8B////ATg4OJs1NTXzWVlZo2lpaf1lZWW7fHx8l4uLi5mEhISZaGhok0RERLk+Pj79REREoZWVlfO2traZ////AT4+PjE7Ozv9UVFRpXJycv13d3eboqKizZycnPuTk5PNioqKz4ODg/t6enrNRERElzc3N/2GhoajwcHB/bW1tTFBQUGXPz8/3Xh4eM12dna5ra2tzaioqNU9PT2BEhISs6ioqKuioqJrdXV103BwcM0yMjK5MDAwy7u7u925ubmXRUVF2VBQULF+fn7/mZmZkbW1tftKSkqBGRkZ/RAQEKGwsLCjsbGx/ZGRkW1qamr7S0tLlSkpKf+bm5uvtbW12UpKSvdhYWGzhISE/7a2tpe8vLzNLCwsvSoqKqX///8B////AaGhobednZ2pYWFhzVpaWpkkJCT/dnZ2sbKysvlOTk75Z2dnsYqKiv+ioqKVlpaWwTo6OrtAQECt////Af///wGOjo69kpKSp1hYWM9UVFSbHh4e/3JycrOurq75UlJS2V5eXq+QkJD/X19fkRQUFPM0NDR5Tk5O/V5eXrVycnK9gICA+3FxcWdQUFD7Nzc3lxgYGP+Pj4+xq6ur2VdXV5dYWFjdlJSUy5SUlLkMDAzNEBAQ1UVFRXNhYWGvbGxsq2NjY2dDQ0PVSUlJzxISErsVFRXNpaWl3aenp5daWloxXFxc/XV1daWcnJz9hoaGmxYWFs8cHBz7JiYmzy8vL803Nzf7Pj4+zRYWFpsLCwv9Z2dnpaGhof2lpaUx////AWBgYJtiYmLzjIyMo6SkpP2lpaW7YmJilTMzM5c5OTmXcXFxkWJiYrMTExP5OTk5o5ubm/OdnZ2Z////Af///wFkZGQLZWVlwWhoaPOEhISlqqqqzbGxsf+3t7f/vb29/8HBwf2Tk5PFdHR0o5WVlfOYmJjBnp6eCf///wH///8B////AWtrawtra2ubbm5u/XJyct2CgoKvlJSUsZmZma+QkJCti4uL3Y+Pj/2SkpKZk5OTC////wH///8B////Af///wH///8B////AXJycjF0dHSXeHh42Xx8fPeBgYH3hYWF2YmJiZeOjo4x////Af///wH///8B////AQAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8oAAAAIAAAAEAAAAABACAAAAAAAIAQAAAAAAAAAAAAAAAAAAAAAAAA////Af///wH///8B////Af///wH///8B////Af///wH///8B////ASIiIg8iIiJZISEhmx8fH80dHR3tGhoa+RcXF/kVFRXrFBQUyxISEpsRERFZERERD////wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////ASkpKSUmJiadJSUl9SMjI/8hISH/Hx8f/xwcHP8aGhr/FxcX/xUVFf8TExP/ERER/w8PD/8MDAz1CwsLnQ0NDSX///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////ATMzMwsrKyuNKSkp+SgoKP8mJib/JCQk/yEhIf8fHx/5HR0d2RsbG8cYGBjHFRUV2RISEvkQEBD/Dg4O/wwMDP8KCgr/CAgI+QcHB4sAAAAL////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wE1NTUnLi4u1SwsLP8rKyv/KSkp/ycnJ+kkJCSLODg4X1ZWVmtYWFiLVFRUn1NTU59QUFCJSUlJaSYmJl0ODg6LCgoK6QkJCf8HBwf/BQUF/xAQENUoKCgn////Af///wH///8B////Af///wH///8B////Af///wH///8BMjIyMzExMesvLy//Li4u/ywsLPMrKyt7Xl5eZ2BgYM1eXl7/XFxc/1lZWf9WVlb/VFRU/1FRUf9OTk7/SkpK/UdH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C/MfHx9pmJiYv5qamv+bm5v/nZ2d05mZmQv///8B////Af///wH///8B////AWRkZCdkZGTrZmZm/2dnZ/9paWnPjo6OV6enp8+qqqr/ra2t/6+vr/+zs7P/tra2/7i4uP27u7v9v7+//8LCwv/CwsL9oaGh93JycvdJSUnJW1tbVZaWls+Xl5f/mJiY/5qamuuenp4l////Af///wH///8B////Af///wH///8B////AWVlZTNnZ2fraWlp/2pqav9tbW3zcXFxfaWlpWmsrKzNsLCw/7Ozs/+2trb/ubm5/7y8vP++vr7/wcHB/8PDw/2ysrLDiYmJY5GRkXuSkpLzlJSU/5WVlf+WlpbrmJiYM////wH///8B////Af///wH///8B////Af///wH///8B////AWtraydpaWnVbGxs/21tbf9vb2//cXFx6XV1dYuLi4tfra2tZ7S0tIe2traburq6mb29vYW6urplmpqaW4qKio2NjY3pj4+P/5GRkf+SkpL/lJSU05OTkyf///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AWZmZgtubm6Lbm5u+3BwcP9ycnL/dHR0/3d3d/95eXn5fHx82X9/f8eBgYHHg4OD24WFhfmIiIj/ioqK/4yMjP+Ojo7/j4+P+ZGRkYuZmZkL////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wF1dXUlcnJynXNzc/V1dXX/d3d3/3l5ef98fHz/fn5+/4CAgP+Dg4P/hYWF/4eHh/+JiYn/i4uL9Y6Ojp2QkJAl////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8Bd3d3D3Z2dll4eHibeXl5y3t7e+t9fX33gICA94ODg+mEhITLhoaGmYmJiVeIiIgP////Af///wH///8B////Af///wH///8B////Af///wH///8B////AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"/>
		
		<title>Vortex</title>
		<script type="text/javascript"> var browserIsCompatible = true; </script>
		<script type="text/javascript">
			/*<![CDATA[*//*---->*/
			try {
			<?php
				$files = getFilesRecursive('./js', '.js');
				foreach($files as $file){
					if($file === './js/main.js') continue;
					readfile($file);
					echo("\n");
				}
				readfile('./js/main.js');
			?>
			} catch(e){ 
				console.log(e);
				browserIsCompatible = false; 
			}
			/*--*//*]]>*/
		</script>
		<style type="text/css">
			<?php
				$files = getFilesRecursive('./css', '.css');
				foreach($files as $file){
					readfile($file);
					echo("\n");
				}
			?>
		</style>
		<style type='text/css'>
		
			.arial { 
				font-family: 'Arial Narrow', 'Arial'; 
				font-size: 13px;
			}
			
			.khmer {
				font-family: 'Khmer UI Обычный', 'Khmer UI';
				font-weight: 400;
				font-size: 20px;
			}
		
			.link {
				cursor:pointer;
				text-decoration:underline;
			}
			
			.light-hr hr{
				border-color:#D7D7D7;
			}
		
			span {
				padding: 0px;
				margin: 0px;
				border: 0px;
				display: inline;
			}
		
			hr {
				width:100%;
				height:0px;
				border:0px solid black;
				border-bottom:1px solid black;
			}
			
			td, th{
				text-align:center;
				margin:0px;
				padding:2px 5px;
				font-weight: normal;
				font-size: 13px;
				height:30px;
			}
			
			th{
				background-color:#f2f2f2;
				padding-left:0px;
				border:1px solid #999;
			}
			
			table { border-collapse: collapse; }
				
			.refresh-icon {
				height: 32px;
				width: 32px;
				background-repeat: no-repeat;
				background-image: url('data:image/gif;base64,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');
			}
			
			.arrow-down {
				width:10px;
				height:8px;
				background-repeat: no-repeat;
				background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAICAYAAADA+m62AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAABfSURBVChTYwCCBiD+TwCD1DAIAPF9qAA2DJITYPj/H8RmSIAKYsMJYDUgAqp4P5IkDO+HyyMpdEBSAMMOGAqhiucjKZqPIofCYWBQAOL3UKyAIofMAQtAgqIBVfw/AwAmZYGBHp78LAAAAABJRU5ErkJggg==');
			}
			
			.arrow-up {
				width: 10px;
				height: 8px;
				background-repeat: no-repeat;
				background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAICAYAAADA+m62AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAABcSURBVChTbdBRDcAgDIThkzAJSEEKUnCCFKRMwiR014UmPQbJl1D6PwEzEzzd/d5lAAo9S5GdDMAgv7ghuxTVFIV6CmcKwpSQp6Xlrq0GF920B8F33nzfcQoS9Bez7oGBRJ9H/gAAAABJRU5ErkJggg==');
			}
			
			.bullet-list-icon {
				width: 14px;
				height: 10px;
				background-repeat: no-repeat;
				background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAAwSURBVChTYwCC90D8H0T//w+iGASQxHBhkDyZGkGKycFYBYnBIDDqR+yYXD8yvAcARib/3y/Hap8AAAAASUVORK5CYII=');
			}
			
			.grid-table-icon {
				width: 12px;
				height: 12px;
				background-repeat: no-repeat;
				background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAA8SURBVChTYwCC80D8Hwmf////PwMIg9hI4mA5IEYRAGMkDRhyQIwpSHUNpPkBJkksxiqID4PACAtWhvMAtfvkGUGsHBMAAAAASUVORK5CYII=');
			}

			.printer-icon {
				width: 20px;
				height: 17px;
				background-repeat: no-repeat;
				background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAARCAYAAADdRIy+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAC7SURBVDhPrZKBDYMwDAQzQkdgFEZgJDboCB2hIzBKR2CENI9s92t9CqJEOoTeZ0eElFqrpC08umTfkSHIAzLZd2QI8oBM9p3PSylT49FY0XAQuOiZvgZagcUzrDHwSrDutsMVYJYs/IMMcabzDr1zl+GizoeBQz4jw1kNYeCQz8id4l71gEO+s2TJCzfOFXDM3e5f5CQMJrxY+AVc6xkio+Joxadne8C1njEyKvYO+QjxE3mg73YG+6pa3tPYT2FJ2q3qAAAAAElFTkSuQmCC');
			}
			
			.round-arrow-left {
				width:            12px;
				height:           12px;
				background-repeat: no-repeat;
				background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAABZSURBVChTY/j//z8YKykpxQLxNiD+j4ZBYrEwdciK0RWiY7AmYhXDcCxIAzZnAA0D24wuvg2bIFgxDg2YgjDFtNMAwoQ0kOxp0oIVahLxEQcikDQRSBr/GQDqzuUxl/JKgQAAAABJRU5ErkJggg==');
			}
			
			.round-arrow-right {
				width:            12px;
				height:           12px;
				background-repeat: no-repeat;
				background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAABlSURBVChTrZILCgAhCEQ9i+eqY9bxamcKQcqlDVZ4ZDoD9hGGqpIMKuiOBgpIQ8jAxsReuELjNCE5iQ2aMg3RGKz7mtVr2HCjrr3+amAg3/r/GbBGvWG4PvT1tX4xURy+9uFriDz9vKFhobAL2QAAAABJRU5ErkJggg==');
			}
			
			.cross-image {
				width: 13px;
				height: 13px;
				background-repeat: no-repeat;
				background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAACoSURBVChThZLrDcMgDIS9SjsK3Y0BEPCD3Vq1k6R3yDxqaGLpFLDv4+EgjJyzTyk9Qwi3mjCB+h31F30t4aFD9bYgcgQ+k8cLd5gSFSylVBBjCxz0Cw00mgKNzgLQOAnBjcFqOfoVuAItYoyPDUA5tfwGCsulJ/Xm9EDyDGgaICY7gN10+u15+iqIwfKf2qVp4Hyu08+dTl/EpqvjKXGFf23VHfXtiXwBaZxDvZ+E+qYAAAAASUVORK5CYII=');
			}
			
			.big-input-container input {
				height: 20px;
			}
			
			.empty-row {
				border: 0px;
				height: 30px;
			}
			
			.day-bullet-list-table {
				font-family: 'Arial Narrow', 'Arial'; 
				margin-top:20px;
			}
			
			.day-bullet-list-table td {
				border:1px solid #999;
			}
			
			.day-bullet-list-table .slot-first-row td:first-child {
				font-size:18px;
			}
			
			.day-bullet-list-table .slot-first-row td:first-child,
			.day-bullet-list-table thead td { 
				border: 0px;
				width: 40px;
				padding:0px;
				height:25px;
				vertical-align:top;
			}
			
			.day-bullet-list-table td {
				padding: 5px 10px;
			}
			
			.lesson-grid-table-day-cell,
			.lesson-grid-table-data-cell {
				border-top:1px solid #999;
				border-bottom:1px solid #999;
				padding: 0px;
				overflow:hidden;
			}
			
			.lesson-grid-table-data-cell.lesson-both { border:1px solid #999; }
			.lesson-grid-table-data-cell.lesson-even { border-right:1px solid #ccc; border-left:1px solid #999;  }
			.lesson-grid-table-data-cell.lesson-odd  { border-left:1px solid #ccc;  border-right:1px solid #999; }
			
			.lesson-grid-table-data-cell {
				height:50px;
			}
			
			.lesson-grid-table-data-cell > * {
				width:113px;
			}
			
			.lesson-grid-table-data-cell.not-empty,
			.lesson-container-ordinary {
				background:#E4E4E4;
				text-align:left;
				vertical-align:top;
			}
			
			.lesson-grid-table-data-cell{
				min-height: 50px;
			}
			
			.cross-small-hoverable {
				width: 10px;
				height: 10px;
				background-repeat: no-repeat;
				background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAABwSURBVChTdZBdDsAgCIM9zXZKd00Tf97YORxVMIhZkz7QfhFDSCndtVZix+CUc37QgQkCdfGCBdKcAEYTDNhBnef5AEpbWC9IxeEBHxDk14l38AdST9hDWIfSZpi389g/odScTePgpZTXQiqBqbV2fRVq/s6oIKt1AAAAAElFTkSuQmCC');
			}
			
			.cross-small-hoverable:hover {
				width: 10px;
				height: 10px;
				background-repeat: no-repeat;
				background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAABtSURBVChTjdDRDYAwCATQTtIRdRpIWK3DWDkERfpTEpMKj0vTJiKdiAYzH62U9k/MYPADNPW7Mgby/oRpGDoy7CkZfQE+eHGcfyiq4FhY7r0HHWUQC3bnBenZUkr6k6xNe55Atq2VMczmg0u/Ac1uvtsJepHeAAAAAElFTkSuQmCC');
			}
			
			.small-yellow-attention-circle {
				width: 12px;
				height: 12px;
				background-repeat: no-repeat;
				background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAACnSURBVChTnZEtFsJADIQjeogejQNUIBC9GaKiAoHA5hbIarBhZrNDtwUM897XbZKZ9/bHImLF7QDO4F7h/9B6ZOzBBURBUu12BT0674DMz7JKbY+hEshttIM0U6rdHnU9MsB9tsPqhvZ9t4kBHm47kPZ9t+WvwOeWfjMzMNRCB/uGZiO+5Vp5z+tA2ppvoFOAD6dQminVaW4eTridwASWygxG0KUn7AVPZpiTCjmFcgAAAABJRU5ErkJggg==');
			}
			
			.altered-lesson-basic {
				background: #FFF4CA!important;
			}
			
			.altered-lesson-created {
				color: #CC0000;
			}
			
			.altered-lesson-deleted {
				color: #339933;
			}
			
			.lesson-small-comparison-table th,
			.lesson-small-comparison-table td{
				padding: 3px;
				border: 1px solid #999;
				max-width:110px;
				white-space:normal;
				overflow:hidden;
			}
			
			.lesson-small-comparison-table .altered-param-row td {
				font-weight: bold;
				
			}
			
			.screenlocker {
				position: absolute;
				display: block;
				
				top: 0px;
				bottom: 0px;
				left: 0px;
				right: 0px;
			}
			.screenlocker[data-lock = "0"] { display:none  }
			
		</style>
		<script type="text/javascript">
			var pressureData = [[1145,1,'Компьютерная инженерная графика',0+34+34,'НГР','ГГХ'],[1146,1,'Компьютерная инженерная графика',0+34+34,'НГР','ГГХ'],[1147,1,'Компьютерная инженерная графика',0+34+34,'НГР','ГГХ'],[1155,1,'Компьютерная инженерная графика',0+34+34,'НГР','ВПБ'],[1163,1,'Компьютерная инженерная графика',0+34+34,'НГР','ВПБ'],[1166,1,'Начертательная геометрия и инженерная графика',0+34+34,'НГР','ВПБ'],[1202,1,'Компьютерная инженерная графика',0+34+34,'ЛАМ','ЛАМ'],[1203,1,'Компьютерная инженерная графика',0+34+34,'ЛАМ','ЛАМ'],[1350,1,'Компьютерная инженерная графика',0+34+34,'АСА','АСА'],[1350,1,'Системы геометрического моделирования',17+17+34,'АСА','АСА'],[1351,1,'Компьютерная инженерная графика',0+34+34,'АСА','АСА'],[1353,1,'Компьютерная инженерная графика',0+34+34,'АСА','АСА'],[1353,1,'Системы геометрического моделирования',17+17+34,'АСА','АСА'],[1354,1,'Компьютерная инженерная графика',0+34+34,'АСА','АСА'],[1354,1,'Системы геометрического моделирования',17+17+34,'АСА','АСА'],[1355,1,'Компьютерная инженерная графика',0+34+34,'АСА','АСА'],[1355,1,'Системы геометрического моделирования',17+17+34,'АСА','АСА'],[1641,1,'Информатика',34+34+0,'АВЛ'],[1641,1,'Начертательная геометрия',0+34+34,'НГР'],[1641,1,'Основы компьютерного дизайна',34+0+17,'ЛМК','ЕКС'],[1641,1,'Основы программирования',34+34+0,'АВЛ'],[1642,1,'Информатика',34+34+0,'АВЛ'],[1642,1,'Начертательная геометрия',0+34+34,'НГР'],[1642,1,'Основы компьютерного дизайна',34+0+17,'ЛМК','ЕКС'],[1642,1,'Основы программирования',34+34+0,'АВЛ'],[1643,1,'Введение в специальность',0+34+0,'ВАЛ'],[1643,1,'Информатика',34+51+0,'ИВК'],[1643,1,'Основы композиции',0+34+17,'ЛПС'],[1643,1,'Проекционная геометрия',0+34+17,'НГР'],[1643,1,'Рисунок',0+34+17,'ЕКС'],[1645,1,'Введение в специальность',0+34+0,'ВАЛ'],[1645,1,'Информатика',34+51+0,'ИВК'],[1645,1,'Основы композиции',0+34+17,'ЕКС'],[1645,1,'Проекционная геометрия',0+34+17,'НГР'],[1645,1,'Рисунок',0+34+17,'ЕКС'],[1650,1,'Компьютерная инженерная графика',0+34+34,'НГР'],[1660,1,'Компьютерная инженерная графика',0+34+34,'НГР'],[1675,1,'Компьютерная инженерная графика',0+34+34,'НГР'],[1108,2,'Компьютерная графика',17+34+0,'ГГХ'],[1166,2,'Компьютерная графика',0+51+0,'ВПБ'],[1520,2,'Мультимедийные технологии',17+17+0,'ЛАМ'],[1521,2,'Мультимедийные технологии',17+17+0,'ЛАМ'],[1522,2,'Мультимедийные технологии',17+17+0,'ЛАМ'],[1641,2,'Базы данных',34+34+0,'ДАВ'],[1641,2,'История искусств и дизайна',0+34+0,'АМС'],[1641,2,'Основы компьютерного дизайна',17+34+0,'ЛМК','ЕКС'],[1641,2,'Основы проектирования и инженерная графика',0+34+0,'ЮМЛ'],[1641,2,'Программирование',34+34+0,'АВЛ'],[1642,2,'Базы данных',34+34+0,'ДАВ'],[1642,2,'История искусств и дизайна',0+34+0,'АМС'],[1642,2,'Основы компьютерного дизайна',17+34+0,'ЛМК','ЕКС'],[1642,2,'Основы проектирования и инженерная графика',0+34+0,'ЮМЛ'],[1642,2,'Программирование',34+34+0,'АВЛ'],[1643,2,'Общая психология',17+34+0,'ВАЛ'],[1643,2,'Основы композиции',0+34+34,'ЛПС'],[1643,2,'Основы проектирования и инженерная графика',0+34+17,'ЮМЛ'],[1643,2,'Рисунок',0+34+34,'ЕКС'],[1645,2,'Общая психология',17+34+0,'ВАЛ'],[1645,2,'Основы композиции',0+34+34,'ЛПС'],[1645,2,'Основы проектирования и инженерная графика',0+34+17,'ЮМЛ'],[1645,2,'Рисунок',0+34+34,'ЕКС'],[1707,2,'Компьютерная графика',17+34+0,'ГГХ'],[1810,2,'Компьютерная инженерная графика',0+0+34,'ВПБ'],[2108,3,'Мультимедийные технологии',17+34+0,'АВМ'],[2641,3,'Математические основы пректирования БД',17+34+0,'ДАВ'],[2641,3,'Объектно-ориентированное программирование',34+34+0,'АСМ'],[2641,3,'Основы проектирования и инженерная графика',0+34+0,'ЮМЛ'],[2641,3,'Психология визуального восприятия',0+34+0,'ААС'],[2642,3,'Математические основы пректирования БД',17+34+0,'ДАВ'],[2642,3,'Объектно-ориентированное программирование',34+34+0,'АСМ'],[2642,3,'Основы проектирования и инженерная графика',0+34+0,'ЮМЛ'],[2642,3,'Психология визуального восприятия',0+34+0,'ААС'],[2643,3,'Возрастная психология и психофизиология',34+34+0,'ВАЛ'],[2643,3,'История искусств',17+0+17,'АМС'],[2643,3,'Основы композиции',0+34+17,'ЛПС'],[2643,3,'Основы проектирования и инженерная графика',0+34+17,'ЮМЛ'],[2643,3,'Рисунок',0+34+17,'ЛМК'],[2707,3,'Мультимедийные технологии',17+34+0,'АВМ'],[2641,4,'Математические основы методов вычислений.',17+34+17,'АСМ'],[2641,4,'Объектно-ориентированный анализ и проектирование',17+34+0,'АСМ'],[2641,4,'Психология визуального восприятия',17+34+0,'ААС'],[2641,4,'Системы сквозного проектирования',17+34+0,'АСЛ'],[2641,4,'Телекоммуникационные системы и технологии',34+34+0,'АВВ'],[2641,4,'Трехмерное моделирование и анимация',0+51+0,'КАЗ'],[2642,4,'Математические основы методов вычислений.',17+34+17,'АСМ'],[2642,4,'Объектно-ориентированный анализ и проектирование',17+34+0,'АСМ'],[2642,4,'Психология визуального восприятия',17+34+0,'ААС'],[2642,4,'Системы сквозного проектирования',17+34+0,'АСЛ'],[2642,4,'Телекоммуникационные системы и технологии',34+34+0,'АВВ'],[2642,4,'Трехмерное моделирование и анимация',0+51+0,'КАЗ'],[2643,4,'Живопись',15+45+0,'АНВ'],[2643,4,'История искусств',15+0+30,'АМС'],[2643,4,'Пластическая анатомия',0+30+0,'ЕКС'],[2643,4,'Практика',0+0+0,'ЛПС','АСЛ'],[2643,4,'Пропорционирование перспектива',0+30+0,'ЛПС'],[2643,4,'Психология профессионального образования',15+30+0,'ВАЛ'],[2643,4,'Системы сквозного проектирования',15+30+0,'АСЛ'],[2643,4,'Типографика',0+30+0,'ААБ'],[3641,5,'WEB-дизайн',17+34+0,'МДК'],[3641,5,'Математические основы компьютерной графики',34+34+0,'АВМ'],[3641,5,'Мультимедийные технологии',17+34+0,'АВМ'],[3641,5,'Системы сквозного проектирования',17+34+0,'АСЛ'],[3641,5,'Структуры данных и алгоритмы',17+34+0,'АСМ'],[3641,5,'Техн.архитек.дизайна',0+34+0,'ОБУ'],[3641,5,'Трехмерное моделирование и анимация',0+34+0,'КАЗ'],[3643,5,'Живопись',17+34+0,'АНВ'],[3643,5,'Инженерная психология',17+34+0,'ЕКС'],[3643,5,'Методика профессионального обучения',17+34+0,'АНВ'],[3643,5,'Пластическая анатомия',0+34+0,'ЕКС'],[3643,5,'Полиграфический дизайн',0+51+0,'ААБ'],[3643,5,'Пропорционирование перспектива',0+34+0,'ЛАМ'],[3643,5,'Системы сквозного проектирования',17+34+0,'АСЛ'],[3643,5,'Теория хранения и обработки информации',17+34+0,'ИВК','МДК'],[3155,6,'Геом.мод.впроекц.зад',13+26+0,'ЛАМ'],[3641,6,'Практика',0+0+0,'ААБ'],[3641,6,'Разработка графических приложений',15+45+0,'АВВ'],[3641,6,'Структуры данных и алгоритмы',15+30+0,'АСМ'],[3641,6,'Техн.архитек.дизайна',0+15+15,'ОБУ'],[3641,6,'Технологии программирования',30+30+0,'АСА'],[3643,6,'История, философия и теория педагогики',13+26+0,'ИВК'],[3643,6,'Компьютерные коммуникации и сети',13+39+0,'МДК'],[3643,6,'Методы трехмерного моделирования',0+26+0,'КАЗ'],[3643,6,'Полиграфический дизайн',13+13+0,'ААБ'],[3643,6,'Практика',0+0+0,'ВАЛ'],[3643,6,'Проектирование и разработка компьютерных средств обучения',13+26+0,'ВАЛ'],[3643,6,'Твердотельное моделирование',13+26+0,'АСЛ'],[3643,6,'Теория хранения и обработки информации',0+26+0,'ИВК','МДК'],[4641,7,'Система компьютерной обработки изображений',0+34+0,'АВМ'],[4641,7,'Технологии виртуальной реальности',34+34+0,'АВМ'],[4641,7,'Типографика и системы верстки',17+34+0,'ААБ'],[4642,7,'Система компьютерной обработки изображений',0+34+0,'АВМ'],[4642,7,'Технологии виртуальной реальности',34+34+0,'АВМ'],[4642,7,'Типографика и системы верстки',17+34+0,'ААБ'],[4643,7,'Архитектурная графика',0+34+17,'ОБУ'],[4643,7,'История, философия и теория педагогики',17+34+0,'ИВК'],[4643,7,'Компьютерные коммуникации и сети',17+51+0,'МДК'],[4643,7,'Методы трехмерного моделирования',0+34+0,'КАЗ'],[4643,7,'Проектирование и разработка компьютерных средств обучения',17+34+0,'АВЛ'],[4643,7,'Фото-дизайн',17+34+0,'МИГ'],[4645,7,'История, философия и теория педагогики',17+34+0,'ИВК'],[4645,7,'Компьютерные коммуникации и сети',17+51+0,'МДК'],[4645,7,'Проектирование корпоративных информационных систем',0+34+34,'АСМ'],[4645,7,'Проектирование и разработка компьютерных средств обучения',17+34+0,'АВЛ'],[4645,7,'Экспертные системы',17+17+0,'АСМ'],[4641,8,'Выполнение ВКР',0+0],[4641,8,'ГАК (член ГАК)',0+0],[4641,8,'Гос.экзамен напр',0+0],[4641,8,'Защ. ВКР',0+0],[4641,8,'Практика',0+0],[4641,8,'Система компьютерной обработки изображений',14+28+0,'АВМ'],[4641,8,'Технологии виртуальной реальности',0+42+0,'АВМ'],[4641,8,'Фотодизайн',14+28+0,'ДИБ'],[4642,8,'Выполнение ВКР',0+0],[4642,8,'ГАК (член ГАК)',0+0],[4642,8,'Гос.экзамен напр',0+0],[4642,8,'Защ. ВКР',0+0],[4642,8,'Практика',0+0],[4642,8,'Система компьютерной обработки изображений',14+28+0,'АВМ'],[4642,8,'Технологии виртуальной реальности',0+42+0,'АВМ'],[4642,8,'Фотодизайн',14+28+0,'ДИБ'],[4643,8,'Выполнение ВКР',0+0],[4643,8,'ГАК (члены ГАК)',0+0],[4643,8,'Гос.экзамен напр',0+0],[4643,8,'Защ. ВКР',0+0],[4643,8,'Метод.восп.работ.',14+42+0,'ВАЛ'],[4643,8,'Методы трехмерного моделирования',0+14+56,'КАЗ'],[4643,8,'Практика',0+0],[4645,8,'Выполнение ВКР',0+0],[4645,8,'ГАК (члены ГАК)',0+0],[4645,8,'Гос.экзамен напр',0+0],[4645,8,'Защ. ВКР',0+0],[4645,8,'Метод.восп.работ.',14+42+0,'ВАЛ'],[4645,8,'Практика',0+0],[5641,9,'Информационные системы в компьютерном прикладном дизайне',0+0+24,'ААБ'],[5641,9,'Компьютерная обработка изображений',0+0+24,'АВМ'],[5641,9,'Моделирование сложных поверхностей',0+24+0,'АВМ'],[5641,9,'Основы графической культуры',0+24+0,'ЛПС'],[5641,9,'Осн.архит.стр.гр',24+24+0,'ОБУ'],[5641,9,'Преддиплом.практика',0+0],[5641,9,'Системы сквозного проектирования',0+24+0,'АСЛ'],[5642,9,'Информационные системы в компьютерном прикладном дизайне',0+0+24,'ААБ'],[5642,9,'Компьютерная обработка изображений',0+0+24,'АВМ'],[5642,9,'Моделирование сложных поверхностей',0+24+0,'АВМ'],[5642,9,'Основы графической культуры',0+24+0,'ЛПС'],[5642,9,'Осн.архит.стр.гр',24+24+0,'ОБУ'],[5642,9,'Преддиплом.практика',0+0],[5642,9,'Системы сквозного проектирования',0+24+0,'АСЛ'],[5643,9,'Методика профессионального обучения',0+36+18,'ЮМЛ'],[5643,9,'Осн.архит.стр.гр',0+36+0,'ОБУ'],[5643,9,'Полиграф.диз.рек',0+36+0,'ЛМК'],[5643,9,'Сист.мультим.вир.реа',0+36+18,'КАЗ'],[5643,9,'Системы сквозного проектирования',0+36+0,'АСЛ'],[5644,9,'Анал.модел.пр.управл',0+0+34,'АОД'],[5644,9,'НИР',0+0],[5644,9,'Практика',0+0],[5644,9,'Проек.с.комп.гр.диз.',0+0+34,'АОД'],[5645,9,'Компьютерные коммуникации и сети',0+36+36,'МДК'],[5645,9,'Мультимедиа',0+36+36,'АСА'],[5645,9,'Проектирование экспертных систем',0+36+36,'АСМ'],[5641,10,'Гос.экзам.',0+0],[5641,10,'Диплом.проектиров.',0+0],[5641,10,'Защ. ВКР',0+0],[5641,10,'Преддиплом.практика',0+0],[5641,10,'Реценз-е ВКР',0+0],[5642,10,'Гос.экзам.',0+0],[5642,10,'Диплом.проектиров.',0+0],[5642,10,'Защ. ВКР',0+0],[5642,10,'Преддиплом.практика',0+0],[5642,10,'Реценз-е ВКР',0+0],[5643,10,'Гос.экзам.',0+0],[5643,10,'Диплом.проектиров.',0+0],[5643,10,'Защ. ВКР',0+0],[5643,10,'Преддиплом.практика',0+0],[5643,10,'Проф. развит.карьера',0+28+0,'ВАЛ'],[5643,10,'Реценз. дипломн.',0+0],[5644,10,'НИР',0+0],[5644,10,'Практика',0+0],[5644,10,'Проек.с.комп.гр.диз.',0+102+0,'АОД'],[5644,10,'Технол.виртуал.сред',0+0+34,'АВМ'],[5645,10,'Гос.экзам.',0+0],[5645,10,'Диплом.проектиров.',0+0],[5645,10,'Защ. ВКР',0+0],[5645,10,'Преддиплом.практика',0+0],[5645,10,'Проф. развит.карьера',0+28+0,'ВАЛ'],[5645,10,'Реценз. дипломн.',0+0],[6644,11,'WEB-дизайн',17+68+0,'МДК'],[6644,11,'Графич.Интернет-прил',17+68+0,'АВВ'],[6644,11,'НИР',0+0],[6644,11,'Практика',0+0],[6644,11,'Проек.с.комп.гр.диз.',0+68+0,'АОД'],[6644,11,'Систем.2D 3D визуал.',0+68+0,'КАЗ'],[6644,11,'Технол.виртуал.сред',17+34+68,'АВМ'],[6644,11,'Технол.мультипликац.',0+68+0,'ЛАМ'],[6109,12,'ГАК (член ГАК)',0+0],[6644,12,'Гос.экзамен напр',0+0],[6644,12,'Защ. ВКР',0+0],[6644,12,'Магист.диссерт.',0+0],[6644,12,'Практика',0+0],[6709,12,'ГАК (член ГАК)',0+0]];
		</script>
		<script type="text/javascript">
		
		var checkBrowser = function(){
			if(	browserIsCompatible && 
				typeof(features) === 'object' && 
				typeof(features.getAbsent) === 'function' && 
				features.getAbsent().length === 0){
				
				document.getElementById('startup_loading_blocker').style.display = 'none';
				return true;
				
			}
			return false;
		}
		
		
		</script>
	</head>
	<body style="position:relative;display:block;width:100%;height:100%" onload="checkBrowser() && startApp()">
		
		<div id="startup_loading_blocker" style="top:65px;overflow:visible;width:50%;position:absolute;height:400px">
			<div style="position:absolute;right:-335px;width:610px;border:1px solid black;top:0px;bottom:0px;padding:25px 30px;" class='arial'>
			
				<div style="font-size: 22px;font-weight:bold;font-family:'Arno Pro Bold','Arno Pro';">Система управления учебным расписанием</div>
				<div style="margin: 30px 0px 0px 0px;font-size:14px">К сожалению, ваш браузер не поддерживается системой.</div>
				<div style="margin: 10px 0px 0px 0px;font-size:14px;font-weight:bold">Используйте:</div>
				<div style="margin: 10px 0px 0px 0px;font-size:14px;">Internet Explorer <span style="font-size:13px;color:#868686">(версии 10.0 и выше),</span></div>
				<div style="margin: 3px 0px 0px 0px;font-size:14px;">Google Chrome <span style="font-size:13px;color:#868686">(версии 40 и выше),</span></div>
				<div style="margin: 3px 0px 0px 0px;font-size:14px;">Opera <span style="font-size:13px;color:#868686">(версии 28 и выше),</span></div>
				<div style="margin: 3px 0px 0px 0px;font-size:14px;">Mozilla Firefox <span style="font-size:13px;color:#868686">(версии 35 и выше),</span></div>
				<div style="margin: 3px 0px 0px 0px;font-size:14px;">Safari <span style="font-size:13px;color:#868686">(версии 5 и выше),</span></div>
				<div style="margin: 3px 0px 0px 0px;font-size:14px;">Яндекс.Браузер <span style="font-size:13px;color:#868686">(версии 15 и выше).</span></div>
				<div style="margin: 20px 0px 0px 0px;font-size:14px;max-width:350px">Если вы и так пользуетесь одним из вышеуказанных браузеров - сообщите администратору системы об ошибке.</div>
				
				<div style="position:absolute;right:30px;bottom:30px;width:190px;height:200px;background-image: url('data:image/png;base64,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');
"></div>
				
			</div>
		</div>
		
	</body>
</html>