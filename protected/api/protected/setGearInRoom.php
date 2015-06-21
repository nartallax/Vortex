<?php

function getApiDataTemplate(){
	return '{
		type: isInt(),
		amount: isInt() && me >= 0
		room?: isInt() || isNull()
	}';
}

function calledApiFunction($data){
	global $gearInRoom;

	if(!isset($data['room'])) $data['room'] = null;	
	
	if($data['amount'] === 0){
		unset($data['amount']);
		$gearInRoom->delete($data);
	} else {
		$gearInRoom->updateBy(array('amount' => $data['amount']), array('type' => $data['type'], 'room' => $data['room']));
	}
}