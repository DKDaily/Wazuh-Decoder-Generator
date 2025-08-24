// sample_logs.js

// Centralized storage for sample logs. Each log type holds an array of sample log strings.
// This makes it easy to update or add new samples without changing other files.
window.sampleLogs = {
    LEEF: [
        // Log 1: With Syslog Header
        `Aug 23 17:55:10 qradar-primary LEEF:2.0|IBM|Security QRadar|7.3|LoginEvent|\tdevTime=Aug 23 2025 12:25:10 GMT\tusrName=jdoe\tsrc=192.168.1.101\tmsg=User login successful from host console.`,
        // Log 2: With a different Syslog Header
        `Aug 23 17:56:02 qradar-secondary LEEF:2.0|IBM|Security QRadar|7.3|LoginEvent|\tdevTime=Aug 23 2025 12:26:02 GMT\tusrName=admin\tsrc=10.0.0.5\tsev=8\tmsg=User login failed: invalid password.`,
        // Log 3: Direct (No Header)
        `LEEF:2.0|IBM|Security QRadar|7.3|AuditEvent|\tdevTime=Aug 23 2025 12:27:15 GMT\tusrName=auditor\tsrc=127.0.0.1\tmsg=User activity report generated.`,
        // Log 4: Direct (No Header)
        `LEEF:2.0|IBM|Security QRadar|7.3|SystemEvent|\tdevTime=Aug 23 2025 12:28:00 GMT\tsev=4\tmsg=System health check completed successfully.`
    ],
    CEF: [
        // Log 1: With Syslog Header
        `Aug 23 11:30:15 ap-syslog-1 CEF:0|Trend Micro|Apex Central|2019|700106|Data Loss Prevention|3|devicePayloadId=4860BD457222-BB2611EF-FBE7-2501-8BCF externalId=11504 suser=testuser1 msg=Policy violation detected on confidential data transfer. fname=report.xlsx src=192.168.4.155 smac=2C-F0-5D-51-A9-52 shost=RCHCORPD054 dvchost=Apex One as a Service`,
        // Log 2: With a different Syslog Header
        `Aug 23 11:32:04 central-server CEF:0|Trend Micro|Apex Central|2019|202101|Behavior Monitoring|5|devicePayloadId=9082AC123456-CC12345-FBE7-2501-ABCD externalId=11509 suser=admin_user msg=Suspicious process behavior detected. fname=svchost.exe act=Terminate src=10.10.20.50 smac=00-1B-63-84-45-E6 shost=FINANCE-PC01 dvchost=Apex One as a Service`,
        // Log 3: Direct (No Header)
        `CEF:0|Trend Micro|Apex Central|2019|700106|Data Loss Prevention|3|devicePayloadId=5555BD457222-BB2611EF-FBE7-2501-8BCF externalId=12011 suser=testuser2 msg=Unauthorized USB device detected. fname=autorun.inf act=Block src=192.168.4.201 smac=5C-F9-DD-72-B1-04 shost=MARKETING-LT05 dvchost=Apex One as a Service`,
        // Log 4: Direct (No Header)
        `CEF:0|Trend Micro|Apex Central|2019|400110|Virus/Malware|8|devicePayloadId=6666BD457222-BB2611EF-FBE7-2501-8BCF externalId=12015 suser=guest msg=Malware detected and cleaned. fname=trojan.js.xmr cn1Label=ThreatID cn1=10101 src=172.16.30.12 dvchost=Apex One as a Service`
    ]
};
