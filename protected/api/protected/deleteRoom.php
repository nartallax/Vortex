<?php

function getApiDataTemplate(){
	return '{
		id: isInt()
	}'; 
}

function calledApiFunction($data){
	global $room;
	
	$room->delete($data);
}