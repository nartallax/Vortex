<?php

function getApiDataTemplate(){
	return '{
		name: isStr(),
		surname: isStr(),
		patronym?: isStr() || isNull(),
		password?: isStr() || isNull(),
		
		looting_info: {
			value: isStr(),
			is_regexp: isBln()
		},
		
		is_external?: isBln() || isNull(),
		note?: isStr() || isNull()
	}'; 
}

function calledApiFunction($data){
	global $lector;

	if(!isset($data['patronym'])) $data['patronym'] = null;
	if(!isset($data['note'])) $data['note'] = null;
	if(!isset($data['password'])) $data['password'] = null;
	if(!isset($data['is_external'])) $data['is_external'] = false;
	
	$result = $lector->create($data);
	return $result['id'];
}