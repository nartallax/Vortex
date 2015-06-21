<?php

function getApiDataTemplate(){
	return '[{
		name: isStr(),
		looting_info:{
			value: isStr(),
			is_regexp: isBln()
		}
		
		note?: isStr() || isNull(),
		is_external?: isBln() || isNull()
	}]';
}

function calledApiFunction($data){
	global $subject;

	foreach($data as $k => &$v){
		if(!isset($v['note'])) $v['note'] = null;
		if(!isset($v['is_external'])) $v['is_external'] = false;
	} unset($v);
	
	$subject->createPack($data);
	return $subject->fetch();
}