<?php

function getApiDataTemplate(){
	return '{
		id: isInt(),
	
		name: isStr(),
		surname: isStr(),
		patronym?: isStr() || isNull(),
		password?: isStr() || isNull(),
		
		looting_info: {
			value: isStr(),
			is_regexp: isBln()
		},
		
		note?: isStr() || isNull(),
		is_external?: isBln() || isNull()
	}'; 
}

function calledApiFunction($data){
	global $lector;

	if(!isset($data['patronym'])) $data['patronym'] = null;
	if(!isset($data['note'])) $data['note'] = null;
	if(!isset($data['password']) || $data['is_external'] == '') $data['password'] = null;
	if(!isset($data['is_external'])) $data['is_external'] = false;
	
	$lector->update($data);
}