// sample_logs.js

// Centralized storage for sample logs. Each log type holds an array of sample log strings.
// This makes it easy to update or add new samples without changing other files.
window.sampleLogs = {
    LEEF: [
        `LEEF:2.0|IBM|Security QRadar|7.3|LoginEvent|\tdevTime=Jul 23 2025 10:30:00 UTC\tdevTimeFormat=MMM dd yyyy HH:mm:ss z\tproto=TCP\tsrc=192.168.1.100\tdst=10.0.0.50\tspt=54321\tdpt=8080\tusrName=johndoe\tmsg=User login successful\tsev=5\tcat=Authentication\tident=12345\tapp=WebApp\tfilePath=/home/johndoe/document.txt\tfileName=document.txt\tdeviceAction=allow\tdeviceCustomString1=ExtraInfo\tdeviceCustomNumber1=123`,
        `Jun  3 09:49:50 3.111.9.101 LEEF:2.0|Seqrite|EPS|6.0.0.0|Web Security Event|^|url=https://images-eds-ssl.xboxlive.com^userName=BCBHDK^domainName=WORKGROUP^endpointName=NDUJDII^groupName=Default^ipAddressFromClient=192.168.1.24^macID1=04-BF-1B-10-93-1E^macID2=60-A9-E2-99-C8-ED^categoryId=Games^incidentOn=Tue Jun 03 04:13:48 UTC 2025^macID3=60-A5-E2-99-C9-EE^serverDateTime=Tue Jun 03 04:19:50 UTC 2025`
    ],
    CEF: [
        `Jun 06 2025 12:00:55 qahy4m.manage.trendmicro.com CEF:0|Trend Micro|Apex Central|2019|700106|Data Loss Prevention|3|devicePayloadId=4860BD457222-BB2611EF-FBE7-2501-8BCF externalId=11504 cs3Label=Product_Entity/Endpoint cs3=RCHCDRPPD054 dvchost=Apex One as a Service cs1Label=Policy_GUID cs1=fe4c905e-c7ff-4c2e-86ef-10096cd23f44 cs2Label=Policy cs2=DLP cn1Label=Product cn1=15 rt=Mar 08 2025 06:28:51 GMT+00:00 src=192.168.4.155 TMCMLogDetectedIP=192.168.4.155 smac=2C-F0-5D-51-A9-52 shost=RCHCORPD054 TMCMLogDetectedHost=RCHCORPD054 cs4Label=Incident_Source_(AD_Account) cs4=testuser.t suser=test user duser=/o\\=exchangelabs/ou\\=exchange administrative group (fydibohf23spdlt)/cn\\=recipients/cn\\=17c4d8f2f49e4455910efb8976c62644-location.; msg=Book3 (003).xlsx filePath=Book3 (003).xlsx fname=Book3 (003).xlsx cs5Label=Rule cs5=Email Client cs6Label=Template cs6=All: SWIFT BIC (SWIFT Business Identifier Code) cn3Label=Channel cn3=122 cn2Label=Action cn2=3 fsize=12980 cfp1Label=ForensicFileAvailable cfp1=0 deviceFacility=Apex One ApexCentralHost=Apex Central as a Service TMCMdevicePlatform=Windows Server 2016 10.0 (Build 14393) deviceNtDomain=N/A dntdom=Corporate\\\\Usb blocked\\\\`,
        `CEF:0|Fortinet|FortiGate|v6.0|30204|IPS Detection|5|src=172.16.10.10 dst=8.8.8.8 dpt=443 proto=TCP msg=Suspicious outbound connection`
    ]
};
