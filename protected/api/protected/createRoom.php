<?php

function getApiDataTemplate(){
	return '{
		name: isStr(),
		space: isInt() && me >= 0,
		building: isInt(),
		
		looting_info: {
			value: isStr(),
			is_regexp: isBln()
		},
		
		note?: isStr() || isNull(),
		is_external?: isBln() || isNull()
	}'; 
}

function calledApiFunction($data){
	global $room;

	if(!isset($data['note'])) $data['note'] = null;
	if(!isset($data['is_external'])) $data['is_external'] = false;
	
	$result = $room->create($data);
	return $result['id'];
}