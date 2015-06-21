<?php

function getApiDataTemplate(){
	return '{
		name: isStr(),
		looting_info:{
			value: isStr(),
			is_regexp: isBln()
		},
		
		note?: isStr() || isNull(),
		is_external: isBln()
	}'; 
}

function calledApiFunction($data){
	global $building;

	if(!isset($data['note'])) $data['note'] = null;
	if(!isset($data['is_external'])) $data['is_external'] = false;
	
	$result = $building->create($data);
	return $result['id'];
}