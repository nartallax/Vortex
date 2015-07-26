<?php

function getApiDataTemplate(){
	return '{
		name: isStr(),
		id: isInt(),
		looting_info: {
			value: isStr(),
			is_regexp: isBln()
		},
		
		note?: isStr() || isNull(),
		is_external?: isBln() || isNull()
	}'; 
}

function calledApiFunction($data){
	global $subject;

	if(!isset($data['note'])) $data['note'] = null;
	if(!isset($data['is_external'])) $data['is_external'] = false;
	
	return $subject->update($data);
}