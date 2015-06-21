<?php

function getApiDataTemplate(){
	return '{
		cohort: isInt(),
		schedule: isInt(),
		curriculums: [isInt()]
	}'; 
}

function calledApiFunction($data){
	global $curriculumForCohort;
	
	$rows = array();
	foreach($data['curriculums'] as $curr)
		$rows[] = array('cohort' => $data['cohort'], 'schedule' => $data['schedule'], 'curriculum' => $curr);

	$curriculumForCohort->delete(array('schedule' => $data['schedule'], 'cohort' => $data['cohort']));
	$curriculumForCohort->createPack($rows);
}