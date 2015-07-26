<?php

function getApiDataTemplate(){
	return '[{
		name: isStr(),
		space: isInt() && me >= 0,
		building: isInt(),
		
		looting_info: {
			value: isStr(),
			is_regexp: isBln()
		},
		
		note?: isStr() || isNull(),
		is_external?: isBln() || isNull()
	}]'; 
}

function calledApiFunction($data){
	global $room;

	foreach($data as $k => &$v){
		if(!isset($v['note'])) $v['note'] = null;
		if(!isset($v['is_external'])) $v['is_external'] = false;
	} unset($v);
	
	$room->createPack($data);
	return $room->fetch();
}