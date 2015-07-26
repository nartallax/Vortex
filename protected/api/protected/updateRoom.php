<?php

function getApiDataTemplate(){
	return '{
		id: isInt(),
		name: isStr(),
		space: isInt(),
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
	
	$room->update($data);
}