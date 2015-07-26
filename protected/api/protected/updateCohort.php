<?php

function getApiDataTemplate(){
	return '{
		id: isInt(),
		name: isStr(),
		disciples: isInt(),
		looting_info: {
			value: isStr(),
			is_regexp: isBln()
		},
		
		note?: isStr() || isNull(),
		is_external?: isBln() || isNull()
	}'; 
}

function calledApiFunction($data){
	global $cohort;

	if(!isset($data['note'])) $data['note'] = null;
	if(!isset($data['is_external'])) $data['is_external'] = false;
	
	$cohort->update($data);
}