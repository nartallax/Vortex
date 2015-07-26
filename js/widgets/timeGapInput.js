widget.list.timeGapInput = (function(){

	var init = function(source){
		var params = widget.paramsOf(this),
			defval = getDefaultVal(params)
			input = tag('input', '', '', {placeholder:defval, value:defval});
			
		input.params = params;
		input.onblur = onInputBlur;
		this.appendChild(this.input = input);
	}
	
	var onInputBlur = function(){ 
		fixInput(this); 
		var e = createEvent('change');
		fireEvent(e, this);
	}
	
	var getDefaultVal = function(params){ return stringifyGap({hours:0, minutes: 0, seconds: 0}, params); }
	
	var numToTwoDigits = function(num){ return num < 10? '0' + num: '' + num; }
	
	var stringifyGap = function(gap, params){
		switch(params.accuracy){
			case 'hours': return numToTwoDigits(gap.hours) + params['hour-sign'];
			case 'minutes': return numToTwoDigits(gap.hours) + params['hour-sign'] + ' ' + numToTwoDigits(gap.minutes) + params['minute-sign']
			case 'seconds':
			default:
				return numToTwoDigits(gap.hours) + params['hour-sign'] + ' ' + numToTwoDigits(gap.minutes) + params['minute-sign'] + ' ' + numToTwoDigits(gap.seconds) + params['minute-sign']
		}
	}
	var parseGap = function(str){
		var digs = str.match(/\d+/g).map(function(v){ return parseInt(v); }),
			res = {hours: digs[0] || 0, minutes: digs[1] || 0, seconds: digs[2] || 0 };
		
		if(res.seconds >= 60){
			res.minutes += ~~(res.seconds / 60);
			res.seconds %= 60;
		}
		
		if(res.minutes >= 60){
			res.hours += ~~(res.minutes / 60);
			res.minutes %= 60;
		}
		
		return res;
	}
	
	var fixInput = function(input){ setValue(input, getValue(input)); }
	var setValue = function(input, newVal){ input.value = stringifyGap(newVal, input.params); }
	var getValue = function(input){ return parseGap(input.value); }
	
	return {
		init: init,
		className: "time-gap-input",
		base: "genericWidget",
		methods: {
			value: function(arg){
				if(arguments.length) {
					setValue(this.input, arg);
					return this;
				} else return getValue(this.input);
			}
		},
		parameters: {
			'accuracy':'seconds',
			'hour-sign':'h',
			'minute-sign':'m',
			'second-sign':'s'
		}
	}
})();