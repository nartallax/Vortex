<?php

function getApiDataTemplate(){
	return '{
		name: isStr(),
		disciples: isInt() && me >= 0,
		is_external?: isBln() || isNull(), 
		note?: isStr() || isNull(), 
		looting_info: {
			value: isStr(),
			is_regexp: isBln()
		}
	}'; 
}

function calledApiFunction($data){
	global $cohort;

	if(!isset($data['note'])) $data['note'] = null;
	if(!isset($data['is_external'])) $data['is_external'] = false;
	
	$result = $cohort->create($data);
	return $result['id'];
}