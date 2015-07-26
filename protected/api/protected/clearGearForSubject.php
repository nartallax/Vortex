<?php

function getApiDataTemplate(){
	return '{
		type: isInt(),
		subject: isInt(),
		per_group?: isBln() || isNull(),
		per_lesson?: isBln() || isNull(),
		per_disciple?: isBln() || isNull()
	}:oneOf(per_group, per_lesson, per_disciple)'; 
}

function calledApiFunction($data){
	global $gearForSubject;

	if(!isset($data['per_group'])) $data['per_group'] = false;
	if(!isset($data['per_lesson'])) $data['per_lesson'] = false;
	if(!isset($data['per_disciple'])) $data['per_disciple'] = false;
	
	$gearForSubject->delete($data);
}