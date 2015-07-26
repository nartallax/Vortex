<?php

function getApiDataTemplate(){
	return '{
		url: isStr(),
		method?: (isStr() && (me == "GET" || me == "POST")) || isNull(),
		headers?: [true],
		port?: (isInt() && me > 0) || isNull(),
		body?: isStr() || isNull(),
		timeout?: (isInt() && me > 0) || isNull(),
		charset?: isStr() || isNull()
	}'; 
}

function calledApiFunction($data){
	if(!set_time_limit(600)) throw new Exception('server_error');
	
	$method = isset($data['method'])? $data['method']: 'GET';
	$headers = isset($data['headers'])? $data['headers']: array();
	$port = isset($data['port'])? $data['port']: 80;
	$body = isset($data['body'])? $data['body']: '';
	$timeout = isset($data['timeout'])? $data['timeout']: 15000;
	$charset = isset($data['charset'])? $data['charset']: null;
	
	foreach($headers as $k => $v) if(!is_str($v) || strlen($k) < 1) throw new Exception('not_validated');
	
	$url = parse_url($data['url']);
	
	if(!isset($url['host'])) throw new Exception('not_validated');
	
	$queryString = (isset($url['path'])?$url['path']:'/') . (isset($url['query'])?'?'.$url['query']:'');

	return utils::HttpRequest($url['host'], $port, $queryString, $method, $headers, $body, $timeout, $charset);
}