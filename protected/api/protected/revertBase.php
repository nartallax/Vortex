<?php

function getApiDataTemplate(){
	return '{}'; 
}

function calledApiFunction($data){
	$scriptArr = file('db.sql');
	$script = '';
	foreach($scriptArr as $row)
		$script .= $row . "\n";
	$script = preg_replace("/\/\*(\n|[^\n])*?\*\//", '', $script);
	$script = preg_replace("/--.*?\n/", '', $script);
	$script = preg_replace("/\n/", '', $script);
	$script = preg_replace("/;/", ";\n", $script);
	$script = explode("\n", $script);
	foreach($script as $row){
		$row = trim($row);
		if($row != '')
			db\getRows($row);
	}
}