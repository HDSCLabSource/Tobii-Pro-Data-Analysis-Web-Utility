
/*
 * Copyright (c) 2013, Bo Fu 
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

public class AngleAnalyzer extends Analyzer{
	
	public static final String NAME = "Angle";
	
	public static final String[] METRICS = {
		TobiiExport.ABSOLUTE_SACCADIC_DIRECTION,
		TobiiExport.RELATIVE_SACCADIC_DIRECTION
	};
	
	public static final String[] UNITS = {
		"degrees",
		"degrees"
	};
	
	public AngleAnalyzer(TobiiExport export) {
		
		super(parseExport(export), NAME);
		
		this.metrics = METRICS;
		this.units = UNITS;
	}
	
	private static TobiiExport parseExport(TobiiExport export) {
		return export.filtered(TobiiExport.GAZE_EVENT_TYPE, FixationAnalyzer.NAME)
				.removingDuplicates(TobiiExport.FIXATION_INDEX);
	}
}
