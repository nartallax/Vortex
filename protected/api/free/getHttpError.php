<?php

function getApiDataTemplate(){
	return '{
		status_line?: isStr() || isNull()
	}'; 
}

function calledApiFunction($data){
	$line = isset($data['status_line'])? $data['status_line'] : ' 404 Not Found';
	header($_SERVER['SERVER_PROTOCOL'] . $line);
}