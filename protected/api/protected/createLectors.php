<?php

function getApiDataTemplate(){
	return '[{
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
	}]'; 
}

function calledApiFunction($data){
	global $lector;

	foreach($data as $k => &$v){
		if(!isset($v['patronym'])) $v['patronym'] = null;
		if(!isset($v['note'])) $v['note'] = null;
		if(!isset($v['password'])) $v['password'] = null;
		if(!isset($v['is_external'])) $v['is_external'] = false;
	}
	
	$lector->createPack($data);
	return $lector->fetch();
}