<?php

function getApiDataTemplate(){
	return '[{
		name: isStr(),
		looting_info:{
			value: isStr(),
			is_regexp: isBln()
		},
		
		note?: isStr() || isNull(),
		is_external: isBln()
	}]'; 
}

function calledApiFunction($data){
	global $building;

	foreach($data as $k => &$v){
		if(!isset($v['note'])) $v['note'] = null;
		if(!isset($v['is_external'])) $v['is_external'] = false;
	} unset($v);
	
	$building->createPack($data);
	return $building->fetch();
}