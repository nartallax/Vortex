<?php

function getApiDataTemplate(){
	return '{}'; 
}

function calledApiFunction($data){
	global $schedule;
	
	return $schedule->fetch();
}