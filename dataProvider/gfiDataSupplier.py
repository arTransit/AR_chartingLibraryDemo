from flask import Flask, jsonify, request,g,Response
from contextlib import closing
import sqlite3
import json
import os
import datetime
import calendar

# testing
#  wget -Sq --header="Accept: application/vnd.bctransit-com.bi+json;chart=google" http://localhost:5000/gfi/xx/12 -O -


# configuration
DATABASE = os.path.dirname(os.path.abspath(__file__)) +'\GFI_VIC2.db'
DEBUG = True


app = Flask(__name__)
app.config.from_object(__name__)
#app.run('10.170.7.101', 5000)

@app.route('/') 
def rootLevel():
    return 'gfiDataSupplier.py - use http://<url>/gfi/google'

    
@app.route('/gfiall')    
@app.route('/gfiall/<dataFormat>')
def gfiData( dataFormat='None' ):
    FORMATS = {'google':googleData, 'rickshaw':rickshawData, 'flot':flotData }
    query = "select TS_DAY,UPASS,MONTHLYPASS,DISCOUNTPASS,ANNOTATION from PIVOT order by TS_DAY"
    r = query_db( query )
    names=['Discount Pass','Monthly Pass','Upass']
    
    if (dataFormat in FORMATS.keys()) and r:
        return jsonify( columns=names,gfiData=FORMATS[ dataFormat ](r) )
    else:
        return jsonify( columns='', gfiData='')

@app.route('/gfi')
@app.route('/gfi/<dataFormat>')
def gfiDataYearly( dataFormat='None' ):
    FORMATS = {'google':googleData, 'rickshaw':rickshawData, 'flot':flotData }
    query = 'select TS_DAY,UPASS_2010,UPASS_2011,UPASS_2012,UPASS_2013,MONTHLYPASS_2010,MONTHLYPASS_2011,MONTHLYPASS_2012,MONTHLYPASS_2013,DISCOUNTPASS_2010,DISCOUNTPASS_2011,DISCOUNTPASS_2012,DISCOUNTPASS_2013, ANNOTATION from V_YEARSPREAD order by TS_DAY'
    r = query_db( query )
    names=['Discount Pass 2010','Discount Pass 2011','Discount Pass 2012','Discount Pass 2013','Monthly Pass 2010','Monthly Pass 2011','Monthly Pass 2012','Monthly Pass 2013','Upass 2010','Upass 2011','Upass 2012','Upass 2013']
    
    if (dataFormat in FORMATS.keys()) and r:
        return jsonify( columns=names, gfiData=FORMATS[ dataFormat ](r) )
    else:
        return jsonify( columns='', gfiData='')


def googleData( result ):
    data = []
    splitDate = lambda d: [str(d)[:4],str(d)[4:6],str(d)[6:8]]
    for r in result:
        d = splitDate(r['TS_DAY'])
        for k in sorted( r.iterkeys() ):
            if k not in  ('TS_DAY','ANNOTATION') : d.append( r[k])
        d.append( r['ANNOTATION'])
        data.append( d )
    return data
    
    
def rickshawData( result ):
    # data: [ { x: 0, y: 22 }, { x: 1, y: 25 }, ...]
    splitDate = lambda d: [int(str(d)[:4]),int(str(d)[4:6]),int(str(d)[6:8])]
    data = {}

    for r in result:
        #calc unix timestamp from '20120131'
        t =  calendar.timegm( datetime.date( *splitDate( r['TS_DAY'] )).timetuple() ) 
        #loop over fields
        for k in sorted( r.iterkeys() ):
            if k!='TS_DAY':
                # create new array for each field
                if k not in data.keys(): data[k] = []
                if r[k] != None:
                    data[k].append({'x':t, 'y':r[k]})
    dataOrdered = []
    for c in sorted( data.iterkeys() ):
        if c != 'ANNOTATION': dataOrdered.append( data[c] )
    
    return {'data':dataOrdered, 'annotations':data['ANNOTATION']}

    
def flotData( result ):
    splitDate = lambda d: [int(str(d)[:4]),int(str(d)[4:6]),int(str(d)[6:8])]
    # data: [{ data: [[x1,y1],[x2,y2],...], label:"data01"},{ data: [[x1,y1],[x2,y2],...], label:"data02"}]
    data = {}

    for r in result:
        #calc unix timestamp from '20120131'
        t =  calendar.timegm( datetime.date( *splitDate( r['TS_DAY'] )).timetuple() ) 
        #loop over fields
        for k in r.iterkeys():
            if k != 'TS_DAY' :
                if k not in data.keys(): data[k] = []
                # javascript date format is in milliseconds therefore time*1000
                if r[k] != None: data[k].append( [t*1000,r[k]] )
    dataLabeled = []
    for c in sorted( data.iterkeys() ):
        if c != 'ANNOTATION': dataLabeled.append( {'data':data[c],'label':c} )
    annotations = []
    for a in data['ANNOTATION']: 
        annotations.append( {'min':a[0], 'max':a[0], 'title':a[1].split(' ')[0], 'description':a[1]} )

    return {'data':dataLabeled, 'annotations':annotations}


'''
@app.route('/systems')
def systems():
    result = query_db('select * from systems;')
    return Response(json.dumps(result),  mimetype='application/json')
    
@app.route('/routes')
def routes():
    system = request.args.get('system', '')
    result = query_db('select * from routes where agency_id = ?',[system])
    #print result
    return Response(json.dumps(result),  mimetype='application/json')
    
@app.route('/stops')
def stops():
    system = request.args.get('system', '')
    route = request.args.get('route', '')
    direction = request.args.get('direction', '')
    date=request.args.get('date', '')
    
    query = "select route_short_name,route_long_name from routes where agency_id=? and route_short_name=?"
    
    r = query_db( query,[system,route],1 )
    route_display_name = r['route_short_name'] + ' ' + r['route_long_name']
    
    query = "select run_number,stop_order,stop_id,stop_short_name,departure_time from route_times where agency_id=? and route_short_name=? and direction=? and date_code in (select date_code from date_codes where date=?) order by run_number,stop_order"

    result=dict(system=system, route=route, direction=direction, 
            route_display_name=route_display_name, date=date)
    #result=dict(system=system, route=route, direction=direction )
    current_run_number = -1
    tripList=[]
    stopList=[]
    
    for r in query_db( query,[system,route,direction,date] ):
        run_number = r['run_number']
        print "run_number " + str(run_number)
        print "current_run_number " + str(current_run_number)
        #print "stopList " + str(stopList)
        if current_run_number != run_number:
            if current_run_number > -1:
                tripList.append( dict(run_number=current_run_number, stops=stopList))
                
            stopList = [ dict(stop_order=r['stop_order'],stop_id=r['stop_id'],stop_short_name=r['stop_short_name'],departure_time=r['departure_time']) ]
            current_run_number = run_number
        else:
            stopList.append( dict(stop_order=r['stop_order'],stop_id=r['stop_id'],stop_short_name=r['stop_short_name'],departure_time=r['departure_time']) )
    if current_run_number > -1:
        tripList.append( dict(run_number=current_run_number, stops=stopList))
    result['trips']=tripList
    return Response(json.dumps(result),  mimetype='application/json')
'''
    
@app.before_request
def before_request():
    g.db = connect_db()
    #pass

@app.teardown_request
def teardown_request(exception):
    g.db.close()
    #pass

    
def query_db(query, args=(), one=False):
    cur = g.db.execute(query, args)
    rv = [dict((cur.description[idx][0], value)
            for idx, value in enumerate(row)) for row in cur.fetchall()]
    return (rv[0] if rv else None) if one else rv


def connect_db():
    return sqlite3.connect(app.config[ 'DATABASE' ])

    
def request_wants_json():
    best = request.accept_mimetypes .best_match(['application/json', 'text/html'])
    return best == 'application/json' and request.accept_mimetypes[best] > request.accept_mimetypes['text/html']



if __name__ == '__main__':
    app.run(debug=True)

