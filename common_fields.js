// common_fields.js

// A single, unified list of common original field names and their normalized equivalents.
// This list will be used by all log parsers (CEF, LEEF, etc.) to suggest and map field names.
window.commonNormalizedFields = [
    // This empty value will be replaced with the actual 'key' later when populated
    { original: "", normalized: "-- Select Common Field / Use Original --" },

    // Common Network/Security Fields
    { original: "src", normalized: "source.ip" },
    { original: "dst", normalized: "destination.ip" },
    { original: "spt", normalized: "source.port" },
    { original: "dpt", normalized: "destination.port" },
    { original: "proto", normalized: "network.protocol" },
    { original: "act", normalized: "action" },
    { original: "sev", normalized: "event.severity" },
    { original: "cat", normalized: "event.category" },
    { original: "msg", normalized: "message" },
    { original: "ident", normalized: "event.id" },
    { original: "app", normalized: "application.name" },

    // Common User Fields
    { original: "suser", normalized: "source.user" }, 
    { original: "usrName", normalized: "username" }, 
    { original: "duser", normalized: "destination.user.name" },
    { original: "user", normalized: "user.name" },
    { original: "userName", normalized: "user.name" },
    { original: "sourceUser", normalized: "source.user.name" },
    { original: "destinationUser", normalized: "destination.user.name" },

    // Common File Fields
    { original: "fname", normalized: "file.name" }, // CEF style
    { original: "fileName", normalized: "file.name" }, // LEEF style
    { original: "filePath", normalized: "file.path" },
    { original: "fsize", normalized: "file.size" },
    { original: "fileHash", normalized: "file.hash" },

    // Common Device/Host Fields
    { original: "dvchost", normalized: "device.hostname" },
    { original: "shost", normalized: "source.hostname" },
    { original: "dhost", normalized: "destination.hostname" },
    { original: "deviceProduct", normalized: "device.product" },
    { original: "deviceVendor", normalized: "device.vendor" },
    { original: "deviceVersion", normalized: "device.version" },
    { original: "deviceFacility", normalized: "device.facility" },
    { original: "dvc", normalized: "device.name" }, // Example new common field

    // Common Time Fields
    { original: "rt", normalized: "event.received" }, // CEF style
    { original: "devTime", normalized: "event.device_time" }, // LEEF style
    { original: "end", normalized: "event.end" },
    { original: "start", normalized: "event.start" },

    // Custom String/Number Fields (generic, can be mapped to more specific names)
    { original: "deviceCustomString1", normalized: "device.custom_string_1" },
    { original: "deviceCustomString2", normalized: "device.custom_string_2" },
    { original: "deviceCustomString3", normalized: "device.custom_string_3" },
    { original: "deviceCustomNumber1", normalized: "device.custom_number_1" },
    { original: "deviceCustomNumber2", normalized: "device.custom_number_2" },

    // Add more common fields as needed
    // Example: { original: "outcome", normalized: "event.outcome" },
    // Example: { original: "reason", normalized: "event.reason" },
];
