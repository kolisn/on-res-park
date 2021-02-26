# on-res-park

 Park Reservation Monitor to BOOL+/JSON
 
 Enter ground url, site csv, start/end dates and find out if any of those sites are available for the entire range.
 As a side-effect this handles scanning sites not currently in the calendar view.


Instructions:

To prepare the project:



`npm install`



To run the project


`npm start` 

or 

`node index [options]`




`Options:`

`  -v, --version                output the version number`

`  -w, --www '<URL>'              Campground URL`

`  -s, --site <#1>,<#2>         Site numbers: 31,40,45`

`  -b, --start <YYYY/MM/DD>     End date: 2020/01/20`

`  -e, --end <YYYY/MM/DD>       End date: 2020/01/25`

`  -o, --outputfile <FILENAME>  Filename/path`

`  -h, --help                   display help for command*`




- output true/false


- `npm start` definition found in package.json calls 

`node index --www 'https://reservations.ontarioparks.com/create-booking/results?resourceLocationId=-2147483538&mapId=-2147483176&searchTabGroupId=0&bookingCategoryId=0&startDate=2021-06-26&endDate=2021-07-03&nights=8&isReserving=true&equipmentId=-32768&subEquipmentId=-32768&partySize=1' --site 117,118,122 --start '2021/06/26' --end '2021/07/03' --outputfile 'demo.json'`





Optional File Output:

`{`
  `"location": "Map of OntarioNear North ParksKillarneyGeorge Lake B & C",`
  `"calendarTable": [`
    `{ "site": "35", "date": "Sat., Jun. 12, 2021", "status": "Available" },`
    `{ "site": "35", "date": "Sun., Jun. 13, 2021", "status": "Available" },`
    `{ "site": "35", "date": "Mon., Jun. 14, 2021", "status": "Available" },`
    `{ "site": "35", "date": "Tue., Jun. 15, 2021", "status": "Available" },`
    `{ "site": "35", "date": "Wed., Jun. 16, 2021", "status": "Available" }]`
`}`
