var timeSpan = (function(){

	var timeSpan = function(start, end){
		this.innerSpans = [];
		this.add(start, end);
	}
	
	timeSpan.prototype.cut = function(start, end){
		this.innerSpans = this.innerSpans
			.fl(function(s){ return s.start <= start || s.end >= end})
			.spawn(function(res, s){
				var startIn = s.start <= start && s.end > start,
					endIn = s.end >= end && s.start < end;
					
				if(startIn && endIn)
					return res
						.add({start: s.start, end: start})
						.add({start: end, end: s.end});
				
				if(startIn) s.end = start;
				if(endIn) s.start = end
				return res.add(s);
					
			}, []);
	}
	
	timeSpan.prototype.add = function(start, end){
		var merged = this.innerSpans
			.toAssoc()
			.fl(function(s){
				return 	(s.start <= start && s.end >= s.start) ||
						(s.start <= end && s.end >= s.end);
			}).each(function(s, k){
				start = min(start, s.start);
				end = max(end, s.end);
				delete this.innerSpans[parseInt(k)];
			});
		
		this.innerSpans = this.innerSpans.fl(bool).add({start: start, end: end});
	}
	
	timeSpan.prototype.getCapable = function(len){
		return this.innerSpans.fl(function(s){ return (s.end - s.start) >= len; }).cloneDeep();
	}
	
	return timeSpan;
	
})();