<?php

function getApiDataTemplate(){
	return '{
		query: isStr()
	}'; 
}

function calledApiFunction($data){
	return db\executeQuery($data['query']);
}