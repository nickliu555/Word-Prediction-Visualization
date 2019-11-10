var sentence = null; // an array of words
var lstm_states = null; // 2-dimensional array: first dimension represents each hidden state value; second dimension refers to word

// widths and heights for our plots - you should use these in constructing scales
var lines_width = 1000, lines_height = 400;
var left_pad = 100, right_pad = 25, y_pad = 40
var lines_width = lines_width-(left_pad+right_pad), lines_height = lines_height-2*y_pad;

// initialize brush
var brush = d3.brushX()

function populate_sentences()  {
	d3.select('body').append('div').text('Select a sentence!')
	d3.select('body').append('div').append('select').selectAll('sentences').data(lstm_data).enter().append('option')
		.text(d => d.sentence.join(' ')).attr('value', (d,i) => i)
	d3.select('select')
		.on('change', function(d,i)  {
			var datum = d3.select(this).property('value');
			sentence = lstm_data[datum].sentence;
			lstm_states = lstm_data[datum].lstm;
			setup_vis(); // this is what you will implement - called each time a new sentence is chosen
		})
}

function plot_it()  {
	sentence = lstm_data[0].sentence;
	lstm_states = lstm_data[0].lstm;

	populate_sentences();

	d3.select('body').append('svg').attr('width', 1000).attr('height', 1000).attr('transform', 'translate(5,5)')
	// group that will contain line plot (id: lines)
	d3.select('svg').append('g').attr('transform', 'translate('+left_pad+','+y_pad+')').attr('id', 'lines')
	// group that will contain heatmap (id: hm)
	d3.select('svg').append('g').attr('transform', 'translate('+left_pad+','+(20+y_pad+lines_height)+')').attr('id', 'hm')

	// group that will contain y axis for our line plot (id: yaxis)
	d3.select('#lines').append('g').attr('id', 'yaxis')
	d3.select('#lines').append('g').attr('id', 'yaxis_word')
	// group that will contain x axis for both our line plot and heatmap (id: xaxis)
	d3.select('#lines').append('g').attr('id', 'xaxis')

	// plot labels
	d3.select('#lines').append('text').text('LSTM Visual Analysis')
		.attr('transform', 'translate('+(lines_width/2)+',-15)').attr('text-anchor', 'middle').attr('fill', '#000').attr('font-size', '20px')
	d3.select('#lines').append('text').text('Hidden State Activations')
		.attr('transform', 'translate('+(-35)+','+(lines_height/2)+') rotate(270)').attr('text-anchor', 'middle').attr('fill', '#000')

	// setup brush - its geometric extent, and add it to our lines group
	brush.extent([[0,lines_height],[lines_width,lines_height+20.5]])
	d3.select('#lines').call(brush)

	// this will be our horizontal line for the threshold (id: threshold)
	d3.select('#lines').append('line').attr('id', 'threshold')
		.attr('x1', 0).attr('x2', lines_width).attr('y1', lines_height/4).attr('y2', lines_height/4)
		.attr('fill', 'None').attr('stroke', d3.hcl(70,40,15)).attr('stroke-width', 6).attr('opacity', 0.8)
    
	setup_vis();
}

// value for the threshold
var threshold = 0.5;
// start and end value of the brush
var start = -1;
var end = -1;

// first time appending axis
var firstTime = true;

function setup_vis()  {
	// TODO: setup scales, as well as your d3.line. For simplicity: for your y scale set the domain to [-1,1],
	
	// scale for hidden state value to height in plot
	var hiddenState_scale = d3.scaleLinear().domain([-1, 1]).range([lines_height, 0]);
	// inverse scale for the hiddenState_scale
	var inverseState_scale = d3.scaleLinear().domain([0, lines_height]).range([1, -1]);
	
	// an array containing indices of all the words
	var wordsDomain = [];
	for(var i=0; i<sentence.length; i++)
	    wordsDomain.push(i);
    
    // scale converting word index to location on plot for the x-axis
    var words_X_scale = d3.scalePoint().domain(wordsDomain).range([0, lines_width]);
    // scale converting word index to location on plot for the y-axis
    var words_Y_scale = d3.scaleBand().domain(wordsDomain).range([0, lines_height]);
    
    // scale that determines the word index given the location on the x-axis
    var width_to_index_scale = d3.scaleLinear().domain([0, lines_width]).range([0, 24]);
    
    // generates a line given an array [x, y]
    var lineGenerator = d3.line()
        .x(function(d, i) { return d[0] })
        .y(function(d, i) { return d[1] });

	// TODO: perform data join for lines: here, you should have separate selections for enter, and update -> the update selection should perform a transition as well
    
    // enter data join
    d3.select('#lines').selectAll('path').data(lstm_states).enter().append('path')
        .attr('stroke-opacity', 0)
        .transition().duration(1200)
		.attr('d', d => {
			var points = [];
			for(var i=0; i<d.length; i++)
			    points.push([ words_X_scale(i), hiddenState_scale(d[i]) ]);
			
			return lineGenerator(points);
		})
		.attr('fill', 'None').attr('stroke', d3.hsl(0, 1, 0)).attr('stroke-width', 2).attr('stroke-opacity', 0.12).attr('id', 'lineGraph');
		
	// update data join
	d3.select('#lines').selectAll('#lineGraph')
        .attr('stroke-opacity', 0)
        .transition().duration(1200)
		.attr('d', d => {
			var points = [];
			for(var i=0; i<d.length; i++)
			    points.push([ words_X_scale(i), hiddenState_scale(d[i]) ]);
			
			return lineGenerator(points);
		})
		.attr('fill', 'None').attr('stroke', d3.hsl(0, 1, 0)).attr('stroke-width', 2).attr('stroke-opacity', 0.12).attr('id', 'lineGraph');
	
	/*
	// Keeps the previous selections
	d3.select('#lines').selectAll('#lineGraph')
	    .filter(d => {
	        for(var i=0; i<d.length; i++)
	        {
	            if(i >= start && i <= end && d[i] >= threshold)
	                return true;
	            else
	                return false;
	        }
	    })
	    .attr('fill', 'None').attr('stroke',  d3.hsl(210, 1, 0.5)).attr('stroke-width', 3).attr('stroke-opacity', 0.8).attr('id', 'lineGraph');
    */
     
	// TODO: create axes; for the x axis, you will need to ensure that the text displayed are the words from `sentence`: use d3.tickFormat for this purpose
	d3.select('#yaxis').attr('transform', 'translate('+(0)+ ','+ (0)+')').attr('id', 'hiddenState').call(d3.axisLeft(hiddenState_scale));
	
	if(firstTime)
	{
	    // enter
	    d3.select('#xaxis').append('g').attr('transform', 'translate('+(0)+ ','+ (lines_height)+')').attr('id', 'xwords')
	        .call(d3.axisBottom(words_X_scale).tickFormat(d => sentence[d]));
    }
    else
    {    
        // update
        d3.select('#xaxis').selectAll('#xwords').attr('transform', 'translate('+(0)+ ','+ (lines_height)+')').attr('id', 'xwords')
	        .call(d3.axisBottom(words_X_scale).tickFormat(d => sentence[d]));
	}
    
	// TODO: construct your similarity matrix that will serve as the data for your heatmap -> a matrix that is sentence.length x sentence.length
	// Note: there are different ways to create a heatmap, as we discussed in class - use the one that you think would be most appropriate here
	var similiarityMatrixMin = 100;
	var similiarityMatrixMax = -100;
	var similiarityMatrix = [];
	for(var i=0; i<sentence.length; i++)
	{
	    for(var j=0; j<sentence.length; j++)
	    {
	        // dot product
	        var similiarityVal = 0;
	        for(var x=0; x<sentence.length; x++)
	            similiarityVal += ( lstm_states[x][i] * lstm_states[x][j] );
	        
	        // update the min
	        if(similiarityVal < similiarityMatrixMin)
	            similiarityMatrixMin = similiarityVal;
	        // update the max
	        else if(similiarityVal > similiarityMatrixMax)
	            similiarityMatrixMax = similiarityVal;
	        
	        // an object that contains the dot product, and 2 word indexes it associates to
	        var info = {similarity: similiarityVal, word1Index: i, word2Index: j};
	        similiarityMatrix.push(info);
	    }
	}

	// TODO: construct color scale(s) for your heatmap	
	var lum_scale = d3.scaleLinear().domain([similiarityMatrixMin, similiarityMatrixMax]).range([0.9, 0.1]);

	// TODO: data join for your heatmap
	
    // enter
    d3.select('#hm').selectAll('rect').data(similiarityMatrix).enter().append('rect')
        .attr('fill', d => d3.hsl(0, 1, 1))
        .transition().duration(1200)
        .attr('id', 'heatRect')
        .attr('x', d => words_X_scale(d.word2Index)-17).attr('y', d => words_Y_scale(d.word1Index))
        .attr('width', 33).attr('height', words_Y_scale.bandwidth()-2)
        .attr('fill', d => d3.hsl(0, 1, 1))
        .transition().duration(1200)
        .attr('fill', d => d3.hsl(0, 1, lum_scale(d.similarity)));
             
    // update
    d3.select('#hm').selectAll('rect')
        .attr('fill', d => d3.hsl(0, 1, 1))
        .transition().duration(1200)
        .attr('id', 'heatRect')
        .attr('x', d => words_X_scale(d.word2Index)-17).attr('y', d => words_Y_scale(d.word1Index))
        .attr('width', 33).attr('height', words_Y_scale.bandwidth()-2)
        .attr('fill', d => d3.hsl(0, 1, 1))
        .transition().duration(1200)
        .attr('fill', d => d3.hsl(0, 1, lum_scale(d.similarity)));
            
	// TODO: data join to display words vertically, to the left of the heatmap
	
	if(firstTime)
	{
	    // enter
	    d3.select('#yaxis_word').append('g').attr('transform', 'translate('+(-20)+ ','+ (lines_height+20)+')').attr('id', 'ywords')
	    .call(d3.axisLeft(words_Y_scale).tickFormat(d => sentence[d]));
	}
	else
	{
	    // update
	    d3.select('#yaxis_word').selectAll('#ywords').attr('transform', 'translate('+(-20)+ ','+ (lines_height+20)+')').attr('id', 'ywords')
	        .call(d3.axisLeft(words_Y_scale).tickFormat(d => sentence[d]));
	}
	
	firstTime = false;

	// Strongly recommended TODO: write a function that takes in a set of word indices, identifies hidden state dimensions (e.g. lines) whose values at these words
	// are greater than or equal to the current threshold, and modifies the appearance of these lines -> this function will be called multiple times
	var updateLines = function(array)
	{
	    // if array is empty, then just set all lines back to normal
	    // (this is when no brush has been selected)
	    if(array.length == 0)
	    {
	        d3.select('#lines').selectAll('#lineGraph')
		        .attr('fill', 'None').attr('stroke',  d3.hsl(0, 1, 0)).attr('stroke-width', 2).attr('stroke-opacity', 0.12).attr('id', 'lineGraph');
	    }
	    else
	    {
	        // revert the ones who do not fit the threshold
	        d3.select('#lines').selectAll('#lineGraph')
		    .filter(d => {
		        for(var i=0; i<array.length; i++)
		        {
		            if(d[array[i]] < threshold)
		                return true;
		        }
		        return false;
		    })
		    .attr('fill', 'None').attr('stroke',  d3.hsl(0, 1, 0)).attr('stroke-width', 2).attr('stroke-opacity', 0.12).attr('id', 'lineGraph');
    	    
    	    
	        // modify the ones that fit the threshold
	        d3.select('#lines').selectAll('#lineGraph')
		    .filter(d => {
		        for(var i=0; i<array.length; i++)
		        {
		            if(d[array[i]] < threshold)
		                return false;
		        }
		        return true;
		    })
		    .attr('fill', 'None').attr('stroke',  d3.hsl(210, 1, 0.5)).attr('stroke-width', 3).attr('stroke-opacity', 0.8).attr('id', 'lineGraph');
		 }
	};

	// TODO: setup event listener for the 'brush' event on your brush object - here you should determine what words have been selected by the brush,
	// modify the appearance of these words, and finally, update the lines

	brush.on('brush', function()  {
	    // update brushCreated
	    brushCreated = true;
	    
	    // get the details of the brush created
		var rect_select = d3.event.selection;
		
		// get the word indices
		start = width_to_index_scale(rect_select[0]);
		end = width_to_index_scale(rect_select[1]);
		
		// if start is not an integer, round up
		if(start % 1 != 0)
		    start = Math.ceil( start );
		
		// if end is not an integer, round down
		if(end % 1 != 0)
		    end = Math.floor( end );
		
		// makes sure end does not go over 25
		end = end+1;
		if(end > 25)
		    end = 25;
		
		// update the appearance of the lines
		var wordIndices = d3.range(start, end);
		updateLines(wordIndices);
		
		// change back the colors of words that are no longer selected
		d3.select('#xwords').selectAll('.tick')
		    .filter(d => {
		        if(d >= start && d < end)
		            return false;
		        else
		            return true;
		    })
		    .attr('stroke',  'none').attr('stroke-width', 1);
		
		//Change the color of the selected words
		d3.select('#xwords').selectAll('.tick')
		.filter(d => {
		    if(d >= start && d < end)
		        return true;
		    else
		        return false;
		})
		.attr('stroke',  d3.hsl(210, 1, 0.5)).attr('stroke-width', 1);
	});

	// TODO: setup event listener for modifying the threshold; use d3.drag for this purpose -> update appearance of lines after setting new threshold
	d3.select('#lines').selectAll('#threshold').raise().call(d3.drag().on('drag', function() {
	    var selection = d3.mouse(this);
	    
	    // if you are over dragging the threshold line
	    if(selection[1] > 320)
	        selection[1] = 320;
	    
	    if(selection[1] < 0)
	        selection[1] = 0;
	    
	    // update the new position of the threshold line
	    d3.select('#lines').selectAll('#threshold')
		    .attr('y1', selection[1]).attr('y2', selection[1]);
	    
	    // get the new threshold
	    threshold = inverseState_scale(selection[1]);
	    
	    // if you haven't selected a brush yet
	    if(start == -1 || end == -1)
	        return;
	    
	    // update the appearance of the lines
	    var wordIndices = d3.range(start, end);
		updateLines(wordIndices);
	}));

	// TODO: setup event listeners for heatmap interaction: mousing over, and mousing out -> update appearance of lines for the selected pair of words
	
	// update rectangle apperance as it is hovered
	d3.select('#hm').selectAll('rect')
	    .on('mouseover', function(x)  {
		    updateLines([x.word1Index, x.word2Index]);
		    
		    // update rectangle mark as it is hovered over
		    d3.select('#hm').selectAll('#heatRect')
		    .filter(d => {
		        if(d.word1Index == x.word1Index && d.word2Index == x.word2Index)
		            return true;
		        else
		            return false;
		    })
		    .attr('fill', d3.hsl(240, 1, 0.5)); 
	    });   
	
	// update rectangle appearance as it is unhovered
    d3.select('#hm').selectAll('rect')
        .on('mouseout', function(d)  {
	        var wordIndices = d3.range(start, end);
	        updateLines(wordIndices);
		    
	        d3.select('#hm').selectAll('#heatRect')
	        .attr('fill', d => d3.hsl(0, 1, lum_scale(d.similarity)));
        });
	
}