# on-res-park

 Park reservation monitor to JSON


Instructions:

`npm install`

to prepare the project

`npm start` 

- output true/false

to run the module

or:


`node index [options]`

*Options:
  -v, --version                output the version number
  -w, --www <URL>              Campground URL
  -s, --site <#1>,<#2>         Site numbers: 31,40,45
  -b, --start <YYYY/MM/DD>     End date: 2020/01/20
  -e, --end <YYYY/MM/DD>       End date: 2020/01/25
  -o, --outputfile <FILENAME>  Filename/path
  -h, --help                   display help for command*





Optional File Output:

*{
  "location": "Map of OntarioNear North ParksKillarneyGeorge Lake B & C",
  "calendarTable": [
    { "site": "35", "date": "Sat., Jun. 12, 2021", "status": "Available" },
    { "site": "35", "date": "Sun., Jun. 13, 2021", "status": "Available" },
    { "site": "35", "date": "Mon., Jun. 14, 2021", "status": "Available" },
    { "site": "35", "date": "Tue., Jun. 15, 2021", "status": "Available" },
    { "site": "35", "date": "Wed., Jun. 16, 2021", "status": "Available" }]
}*
